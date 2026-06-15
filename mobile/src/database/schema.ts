import * as SQLite from 'expo-sqlite';

export async function initDatabase() {
  const db = await SQLite.openDatabaseAsync('pdfs.db');
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS local_pdfs (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      hash TEXT NOT NULL,
      url TEXT NOT NULL,
      localUri TEXT
    );
  `);
}

export async function getLocalPdfs() {
  const db = await SQLite.openDatabaseAsync('pdfs.db');
  return await db.getAllAsync('SELECT * FROM local_pdfs ORDER BY name ASC');
}

export async function insertOrUpdatePdf(pdf: { id: string, name: string, hash: string, url: string, localUri: string }) {
  const db = await SQLite.openDatabaseAsync('pdfs.db');
  await db.runAsync(
    `INSERT INTO local_pdfs (id, name, hash, url, localUri) 
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET 
       name=excluded.name, 
       hash=excluded.hash, 
       url=excluded.url, 
       localUri=excluded.localUri`,
    [pdf.id, pdf.name, pdf.hash, pdf.url, pdf.localUri]
  );
}

export async function deletePdf(id: string) {
  const db = await SQLite.openDatabaseAsync('pdfs.db');
  await db.runAsync('DELETE FROM local_pdfs WHERE id = ?', [id]);
}
