import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
// Simulate an API call
import { api } from '../services/api'; 

const db = SQLite.openDatabaseSync('pdfs.db');

export const setupDatabase = () => {
  db.execSync(
    'CREATE TABLE IF NOT EXISTS pdfs (id TEXT PRIMARY KEY, name TEXT, hash TEXT, localUri TEXT);'
  );
};

export const syncPdfs = async () => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) return; // Silent skip if offline

  try {
    // Fetch remote metadata
    const response = await api.get('/pdfs');
    const remotePdfs: any[] = response.data;

    // Get local metadata
    const localPdfs = db.getAllSync('SELECT * FROM pdfs') as any[];

    for (const remote of remotePdfs) {
      const local = localPdfs.find((p) => p.id === remote.id);

      // If new or updated hash
      if (!local || local.hash !== remote.hash) {
        const fileUri = `${FileSystem.documentDirectory}${remote.id}.pdf`;
        
        // Download file silently in background
        const downloadRes = await FileSystem.downloadAsync(
          remote.url_download,
          fileUri
        );

        // Upsert DB
        db.runSync(
          'INSERT OR REPLACE INTO pdfs (id, name, hash, localUri) VALUES (?, ?, ?, ?)',
          [remote.id, remote.name, remote.hash, downloadRes.uri]
        );
      }
    }

    // Optional: Check localPdfs that are not in remotePdfs and delete them

  } catch (error) {
    console.error('Sync Error:', error);
  }
};

export const startSyncListener = () => {
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      syncPdfs();
    }
  });
};
