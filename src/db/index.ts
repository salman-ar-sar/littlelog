import * as SQLite from 'expo-sqlite';
import { DB_NAME, MIGRATIONS, LATEST_SCHEMA_VERSION } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Opens (and memoizes) the app database, running any pending migrations.
 * Safe to call concurrently — all callers share one connection.
 */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    let version = row?.user_version ?? 0;
    while (version < LATEST_SCHEMA_VERSION) {
      const next = version + 1;
      const statements = MIGRATIONS[next];
      if (!statements) throw new Error(`No migration for schema version ${next}`);
      for (const sql of statements) {
        await db.execAsync(sql);
      }
      version = next;
    }
    await db.execAsync(`PRAGMA user_version = ${LATEST_SCHEMA_VERSION}`);
  });
  return db;
}
