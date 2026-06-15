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
      localUri TEXT,
      category TEXT
    );
  `);

  try {
    await db.execAsync(`ALTER TABLE local_pdfs ADD COLUMN category TEXT;`);
  } catch (e) {
    // Ignore if column already exists
  }
}

export async function getLocalPdfs() {
  const db = await SQLite.openDatabaseAsync('pdfs.db');
  return await db.getAllAsync('SELECT * FROM local_pdfs ORDER BY name ASC');
}

export async function insertOrUpdatePdf(pdf: { id: string, name: string, hash: string, url: string, localUri: string, category: string }) {
  const db = await SQLite.openDatabaseAsync('pdfs.db');
  await db.runAsync(
    `INSERT INTO local_pdfs (id, name, hash, url, localUri, category) 
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET 
       name=excluded.name, 
       hash=excluded.hash, 
       url=excluded.url, 
       localUri=excluded.localUri,
       category=excluded.category`,
    pdf.id ?? null, pdf.name ?? null, pdf.hash ?? null, pdf.url ?? null, pdf.localUri ?? null, pdf.category ?? null
  );
}

export async function deletePdf(id: string) {
  const db = await SQLite.openDatabaseAsync('pdfs.db');
  await db.runAsync('DELETE FROM local_pdfs WHERE id = ?', id ?? null);
}
