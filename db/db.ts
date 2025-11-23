
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Item, Receipt, Printer, AppSettings, SavedTicket } from '../types';

interface POSDB extends DBSchema {
  items: {
    key: string;
    value: Item;
  };
  receipts: {
    key: string;
    value: Receipt;
    indexes: { 'by-date': Date };
  };
  printers: {
    key: string;
    value: Printer;
  };
  // 'config' store handles singleton data like settings and categories
  config: {
    key: string;
    value: any;
  };
  saved_tickets: {
    key: string;
    value: SavedTicket;
  }
}

const DB_NAME = 'pos_db';
const DB_VERSION = 9; // Bumped to force structure consistency

let dbPromise: Promise<IDBPDatabase<POSDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<POSDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Items Store
        if (!db.objectStoreNames.contains('items')) {
          db.createObjectStore('items', { keyPath: 'id' });
        }
        // Receipts Store
        if (!db.objectStoreNames.contains('receipts')) {
          const receiptStore = db.createObjectStore('receipts', { keyPath: 'id' });
          receiptStore.createIndex('by-date', 'date');
        }
        // Printers Store
        if (!db.objectStoreNames.contains('printers')) {
          db.createObjectStore('printers', { keyPath: 'id' });
        }
        // Config Store (Settings, Categories)
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config');
        }
        // Saved Tickets Store (New in v2)
        if (!db.objectStoreNames.contains('saved_tickets')) {
          db.createObjectStore('saved_tickets', { keyPath: 'id' });
        }
      },
      terminated() {
          console.error("DB Connection Terminated unexpectedly.");
      },
    });
  }
  return dbPromise;
};

// --- Generic CRUD Helpers ---

export const getAllItems = async () => {
  const db = await initDB();
  return db.getAll('items');
};

export const putItem = async (item: Item) => {
  const db = await initDB();
  return db.put('items', item);
};

export const deleteItem = async (id: string) => {
  console.log(`[DB] Attempting to delete item with ID: ${id}`);
  const db = await initDB();
  try {
    const tx = db.transaction('items', 'readwrite');
    console.log(`[DB] Transaction created for deleting item ID: ${id}`);
    const store = tx.objectStore('items');
    await store.delete(id);
    console.log(`[DB] store.delete() called for ID: ${id}. Awaiting transaction completion.`);
    await tx.done;
    console.log(`[DB] Transaction for deleting ID ${id} completed successfully.`);
  } catch (error) {
    console.error(`[DB] Error during delete transaction for ID ${id}:`, error);
    throw error; // Re-throw so the context layer can handle it (e.g., revert state)
  }
};

export const getAllReceipts = async () => {
  const db = await initDB();
  return db.getAllFromIndex('receipts', 'by-date');
};

export const addReceipt = async (receipt: Receipt) => {
  const db = await initDB();
  return db.add('receipts', receipt);
};

export const getAllPrinters = async () => {
  const db = await initDB();
  return db.getAll('printers');
};

export const putPrinter = async (printer: Printer) => {
  const db = await initDB();
  return db.put('printers', printer);
};

export const deletePrinter = async (id: string) => {
  const db = await initDB();
  return db.delete('printers', id);
};

// --- Config Helpers (Settings & Categories) ---

export const getSettings = async (): Promise<AppSettings | undefined> => {
  const db = await initDB();
  return db.get('config', 'settings');
};

export const saveSettings = async (settings: AppSettings) => {
  const db = await initDB();
  return db.put('config', settings, 'settings');
};

export const getCategories = async (): Promise<string[] | undefined> => {
  const db = await initDB();
  return db.get('config', 'categories');
};

export const saveCategories = async (categories: string[]) => {
  const db = await initDB();
  return db.put('config', categories, 'categories');
};

// --- Saved Tickets Helpers ---

export const getAllSavedTickets = async () => {
  const db = await initDB();
  return db.getAll('saved_tickets');
};

export const putSavedTicket = async (ticket: SavedTicket) => {
  const db = await initDB();
  return db.put('saved_tickets', ticket);
};

export const deleteSavedTicket = async (id: string) => {
  const db = await initDB();
  return db.delete('saved_tickets', id);
};

// --- Bulk Ops for Restore ---

export const clearDatabase = async () => {
    const db = await initDB();
    await db.clear('items');
    await db.clear('receipts');
    await db.clear('printers');
    await db.clear('config');
    await db.clear('saved_tickets');
}
