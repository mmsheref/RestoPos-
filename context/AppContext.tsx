import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Printer, Receipt, Item, AppSettings, BackupData, SavedTicket } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as DB from '../db/db';

type Theme = 'light' | 'dark';

// --- Initial Seed Data ---
const INITIAL_CATEGORIES = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Sides'];

// CLEARED: Default items removed.
const INITIAL_ITEMS: Item[] = [];

const DEFAULT_SETTINGS: AppSettings = { taxEnabled: true, taxRate: 5, storeName: 'My Restaurant' };

interface AppContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  headerTitle: string;
  setHeaderTitle: (title: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Data
  isLoading: boolean;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  printers: Printer[];
  addPrinter: (printer: Printer) => void;
  removePrinter: (printerId: string) => void;
  
  receipts: Receipt[];
  addReceipt: (receipt: Receipt) => void;
  
  items: Item[];
  addItem: (item: Item) => void;
  updateItem: (item: Item) => void;
  deleteItem: (id: string) => void;
  
  categories: string[];
  setCategories: (categories: string[]) => void; 
  addCategory: (name: string) => void;

  savedTickets: SavedTicket[];
  saveTicket: (ticket: SavedTicket) => void;
  removeTicket: (ticketId: string) => void;

  // Backup
  exportData: () => void;
  restoreData: (data: BackupData) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
        const storedPrefs = localStorage.getItem('theme');
        if (storedPrefs) {
            return storedPrefs as Theme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // --- State ---
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [printers, setPrintersState] = useState<Printer[]>([]);
  const [receipts, setReceiptsState] = useState<Receipt[]>([]);
  const [items, setItemsState] = useState<Item[]>([]);
  const [categories, setCategoriesState] = useState<string[]>([]);
  const [savedTickets, setSavedTicketsState] = useState<SavedTicket[]>([]);
  
  // --- Initialize & Load Data ---
  useEffect(() => {
    const initData = async () => {
      try {
        await DB.initDB();
        
        // Load data in parallel
        const [
            loadedItems, 
            loadedReceipts, 
            loadedPrinters, 
            loadedSettings, 
            loadedCategories,
            loadedTickets
        ] = await Promise.all([
            DB.getAllItems(),
            DB.getAllReceipts(),
            DB.getAllPrinters(),
            DB.getSettings(),
            DB.getCategories(),
            DB.getAllSavedTickets()
        ]);

        // Seed Initial Data if empty
        if (loadedItems.length === 0 && (!loadedCategories || loadedCategories.length === 0)) {
             console.log("Seeding Database...");
             // Seed Items (None)
             setItemsState([]);

             // Seed Categories
             await DB.saveCategories(INITIAL_CATEGORIES);
             setCategoriesState(INITIAL_CATEGORIES);

             // Seed Settings
             await DB.saveSettings(DEFAULT_SETTINGS);
             setSettingsState(DEFAULT_SETTINGS);
        } else {
             setItemsState(loadedItems);
             setReceiptsState(loadedReceipts.sort((a,b) => b.date.getTime() - a.date.getTime())); // Sort desc
             setPrintersState(loadedPrinters);
             setSettingsState(loadedSettings || DEFAULT_SETTINGS);
             setCategoriesState(loadedCategories || INITIAL_CATEGORIES);
             setSavedTicketsState(loadedTickets);
        }

      } catch (e) {
        console.error("Failed to initialize database:", e);
        alert("Critical Error: Database initialization failed. Some features may not work.");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);


  // --- Logic Wrappers with Robust Error Handling (Optimistic UI) ---

  const addReceipt = useCallback(async (receipt: Receipt) => {
    const prev = receipts;
    setReceiptsState(curr => [receipt, ...curr]);
    try {
        await DB.addReceipt(receipt);
    } catch (e) {
        console.error("Failed to save receipt", e);
        setReceiptsState(prev);
        alert("Failed to save receipt to database.");
    }
  }, [receipts]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const prev = settings;
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    try {
        await DB.saveSettings(updated);
    } catch (e) {
        setSettingsState(prev);
        console.error("Failed to save settings", e);
    }
  }, [settings]);

  const addPrinter = useCallback(async (printer: Printer) => {
    const prev = printers;
    setPrintersState(curr => [...curr, printer]);
    try {
        await DB.putPrinter(printer);
    } catch (e) {
        setPrintersState(prev);
        alert("Failed to save printer.");
    }
  }, [printers]);

  const removePrinter = useCallback(async (printerId: string) => {
    const prev = printers;
    setPrintersState(curr => curr.filter(p => p.id !== printerId));
    try {
        await DB.deletePrinter(printerId);
    } catch (e) {
        setPrintersState(prev);
        alert("Failed to delete printer.");
    }
  }, [printers]);

  // --- Item Management ---
  const addItem = useCallback(async (item: Item) => {
    const prev = items;
    setItemsState(curr => [...curr, item]);
    try {
        await DB.putItem(item);
    } catch (e) {
        setItemsState(prev);
        alert("Failed to add item.");
    }
  }, [items]);

  const updateItem = useCallback(async (updatedItem: Item) => {
    const prev = items;
    setItemsState(curr => curr.map(item => item.id === updatedItem.id ? updatedItem : item));
    try {
        await DB.putItem(updatedItem);
    } catch (e) {
        setItemsState(prev);
        alert("Failed to update item.");
    }
  }, [items]);

  const deleteItem = useCallback(async (id: string) => {
    console.log(`[AppContext] deleteItem called for ID: ${id}. Attempting DB delete first.`);
    try {
        await DB.deleteItem(id);
        console.log(`[AppContext] DB deletion successful for ID: ${id}. Now updating state.`);
        setItemsState(curr => curr.filter(item => item.id !== id));
    } catch (e) {
        console.error(`[AppContext] DB deletion failed for ID: ${id}. State was not changed.`, e);
        alert("Failed to delete item from database. The item will reappear on refresh.");
    }
  }, [items]);

  // --- Category Management ---
  const setCategories = useCallback(async (newCategories: string[]) => {
      const prev = categories;
      setCategoriesState(newCategories);
      try {
        await DB.saveCategories(newCategories);
      } catch (e) {
          setCategoriesState(prev);
          alert("Failed to update categories.");
      }
  }, [categories]);

  const addCategory = useCallback(async (name: string) => {
      if (categories.includes(name)) return;
      const prev = categories;
      const newCats = [...categories, name];
      setCategoriesState(newCats);
      try {
          await DB.saveCategories(newCats);
      } catch (e) {
          setCategoriesState(prev);
          alert("Failed to save category.");
      }
  }, [categories]);

  // --- Ticket Management ---
  const saveTicket = useCallback(async (ticket: SavedTicket) => {
      const prev = savedTickets;
      // Upsert logic for optimistic UI
      setSavedTicketsState(curr => {
          const exists = curr.find(t => t.id === ticket.id);
          if (exists) {
              return curr.map(t => t.id === ticket.id ? ticket : t);
          }
          return [...curr, ticket];
      });
      try {
          await DB.putSavedTicket(ticket);
      } catch (e) {
          setSavedTicketsState(prev);
          alert("Failed to save ticket.");
      }
  }, [savedTickets]);

  const removeTicket = useCallback(async (ticketId: string) => {
      const prev = savedTickets;
      setSavedTicketsState(curr => curr.filter(t => t.id !== ticketId));
      try {
          await DB.deleteSavedTicket(ticketId);
      } catch (e) {
          setSavedTicketsState(prev);
          alert("Failed to delete ticket.");
      }
  }, [savedTickets]);

  // --- Backup & Restore ---
  const exportData = useCallback(async () => {
    const backup: BackupData = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        settings,
        items,
        categories,
        printers,
        receipts,
        savedTickets
    };
    
    const jsonString = JSON.stringify(backup, null, 2);
    // Sanitize filename: replace colons/dots with dashes for safe filesystem handling on Android/Linux
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `pos_backup_${dateStr}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        // 1. Save to Documents directory (Persistent)
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });

        // 2. Share the file from Documents
        await Share.share({
          title: 'Restaurant POS Backup',
          text: `Backup created on ${new Date().toLocaleDateString()}`,
          url: result.uri, 
          dialogTitle: 'Save/Share Backup File'
        });

        alert(`Backup saved successfully!\n\nLocation: Documents/${fileName}`);

      } catch (error: any) {
        console.error("Export Failed:", error);
        alert(`Export Failed: ${error.message || error}`);
      }
    } else {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", fileName);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  }, [settings, items, categories, printers, receipts, savedTickets]);

  const restoreData = useCallback(async (data: BackupData) => {
      setIsLoading(true);
      try {
          await DB.clearDatabase();
          
          // Helper to restore parsed receipts (dates are strings in JSON)
          const restoredReceipts = (data.receipts || []).map(r => ({
              ...r,
              date: new Date(r.date)
          }));

          // Bulk Insert to DB
          await DB.saveSettings(data.settings);
          await DB.saveCategories(data.categories);
          
          for(const p of (data.printers || [])) await DB.putPrinter(p);
          for(const i of (data.items || [])) await DB.putItem(i);
          for(const r of restoredReceipts) await DB.addReceipt(r);
          for(const t of (data.savedTickets || [])) await DB.putSavedTicket(t);

          // Update State
          setSettingsState(data.settings);
          setItemsState(data.items || []);
          setCategoriesState(data.categories || []);
          setPrintersState(data.printers || []);
          setReceiptsState(restoredReceipts);
          setSavedTicketsState(data.savedTickets || []);

      } catch(e) {
          console.error("Restore failed", e);
          alert("Failed to restore data from backup.");
      } finally {
          setIsLoading(false);
      }
  }, []);


  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);
  
  // Show a loading screen or simple fallback until DB is ready
  if (isLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
             <div className="text-center">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                 <p className="text-gray-600 dark:text-gray-400">Loading Database...</p>
             </div>
          </div>
      )
  }

  return (
    <AppContext.Provider value={{ 
      isDrawerOpen, openDrawer, closeDrawer, toggleDrawer, 
      headerTitle, setHeaderTitle,
      theme, setTheme,
      isLoading,
      settings, updateSettings,
      printers, addPrinter, removePrinter,
      receipts, addReceipt,
      items, addItem, updateItem, deleteItem,
      categories, setCategories, addCategory,
      savedTickets, saveTicket, removeTicket,
      exportData, restoreData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};