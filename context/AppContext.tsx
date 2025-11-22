
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Printer, Receipt, Item, AppSettings, BackupData, SavedTicket } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as DB from '../db/db';

type Theme = 'light' | 'dark';

// --- Initial Seed Data ---
const INITIAL_CATEGORIES = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Sides'];

// Updated Initial Items structure
const INITIAL_ITEMS: Item[] = [
    { id: 'a1', name: 'Spring Rolls', price: 150.00, category: 'Appetizers', stock: 100, representation: 'image', imageUrl: 'https://picsum.photos/id/10/200/200' },
    { id: 'm1', name: 'Steak Frites', price: 650.00, category: 'Main Courses', stock: 50, representation: 'image', imageUrl: 'https://picsum.photos/id/40/200/200' },
    { id: 'b1', name: 'Coke', price: 60.00, category: 'Beverages', stock: 200, representation: 'color', color: '#EF4444', shape: 'circle' },
];

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
  importItems: (newItems: Item[]) => void;
  
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
        
        const isInitialized = await DB.getIsInitialized();
        console.log("Database initialized check:", isInitialized);

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

        // Seed Initial Data ONLY if not initialized before
        if (!isInitialized) {
             console.log("Seeding Database...");
             // Seed Items
             for (const item of INITIAL_ITEMS) await DB.putItem(item);
             setItemsState(INITIAL_ITEMS);

             // Seed Categories
             await DB.saveCategories(INITIAL_CATEGORIES);
             setCategoriesState(INITIAL_CATEGORIES);

             // Seed Settings
             await DB.saveSettings(DEFAULT_SETTINGS);
             setSettingsState(DEFAULT_SETTINGS);

             // Mark as initialized so we don't seed again
             await DB.setInitialized();
        } else {
             // Normal Load
             setItemsState(loadedItems);
             setCategoriesState(loadedCategories || INITIAL_CATEGORIES);
             setSettingsState(loadedSettings || DEFAULT_SETTINGS);
        }

        // Always load these
        setReceiptsState(loadedReceipts.sort((a,b) => b.date.getTime() - a.date.getTime()));
        setPrintersState(loadedPrinters);
        setSavedTicketsState(loadedTickets);

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
    const itemWithId = { ...item, id: item.id || crypto.randomUUID() };
    
    setItemsState(curr => [...curr, itemWithId]);
    try {
        await DB.putItem(itemWithId);
    } catch (e) {
        // Revert
        setItemsState(curr => curr.filter(i => i.id !== itemWithId.id));
        alert("Failed to add item.");
        console.error(e);
    }
  }, []);

  const updateItem = useCallback(async (updatedItem: Item) => {
    setItemsState(curr => curr.map(item => item.id === updatedItem.id ? updatedItem : item));
    try {
        await DB.putItem(updatedItem);
    } catch (e) {
        alert("Failed to update item.");
        console.error(e);
        // Reload from DB to ensure state consistency
        const dbItems = await DB.getAllItems();
        setItemsState(dbItems);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    console.log("[AppContext] Deleting item with ID:", id);
    
    // 1. Optimistic Update (Immediate UI response)
    setItemsState(curr => {
        const remaining = curr.filter(item => item.id !== id);
        return remaining;
    });

    try {
        // 2. DB Update
        await DB.deleteItem(id);
    } catch (e) {
        console.error("[AppContext] Failed to delete item from DB", e);
        alert("Failed to delete item from database. The list will refresh.");
        
        // 3. Rollback on failure
        const dbItems = await DB.getAllItems();
        setItemsState(dbItems);
    }
  }, []);
  
  // Import multiple items (e.g. from CSV)
  const importItems = useCallback(async (newItems: Item[]) => {
      setItemsState(curr => {
          // Merge logic: replace if ID exists, else add
          const map = new Map(curr.map(i => [i.id, i]));
          newItems.forEach(i => map.set(i.id, i));
          return Array.from(map.values());
      });
      
      try {
          for (const item of newItems) {
              await DB.putItem(item);
          }
          
          // Also update categories if new ones found
          const newCats = new Set(categories);
          newItems.forEach(i => {
              if(i.category) newCats.add(i.category);
          });
          
          const newCatsArray = Array.from(newCats);
          if(newCatsArray.length > categories.length) {
             setCategoriesState(newCatsArray);
             await DB.saveCategories(newCatsArray);
          }
          
      } catch(e) {
          console.error("Bulk import failed", e);
          alert("Error importing items into database.");
      }
  }, [categories]);

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
           alert("Failed to save ticket.");
           const dbTickets = await DB.getAllSavedTickets();
           setSavedTicketsState(dbTickets);
      }
  }, []);

  const removeTicket = useCallback(async (ticketId: string) => {
      setSavedTicketsState(curr => curr.filter(t => t.id !== ticketId));
      try {
          await DB.deleteSavedTicket(ticketId);
      } catch (e) {
          alert("Failed to delete ticket.");
          const dbTickets = await DB.getAllSavedTickets();
          setSavedTicketsState(dbTickets);
      }
  }, []);

  // --- Backup & Restore ---
  const exportData = useCallback(async () => {
    const backup: BackupData = {
        version: '4.0',
        timestamp: new Date().toISOString(),
        settings,
        items,
        categories,
        printers,
        receipts,
        savedTickets
    };
    
    const jsonString = JSON.stringify(backup, null, 2);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `pos_backup_${dateStr}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });

        await Share.share({
          title: 'Restaurant POS Backup',
          text: `Backup created on ${new Date().toLocaleDateString()}`,
          url: result.uri, 
          dialogTitle: 'Save/Share Backup File'
        });

        alert(`Backup saved successfully!`);
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
          
          const restoredReceipts = (data.receipts || []).map(r => ({
              ...r,
              date: new Date(r.date)
          }));

          await DB.saveSettings(data.settings);
          await DB.saveCategories(data.categories);
          
          for(const p of (data.printers || [])) await DB.putPrinter(p);
          for(const i of (data.items || [])) await DB.putItem(i);
          for(const r of restoredReceipts) await DB.addReceipt(r);
          for(const t of (data.savedTickets || [])) await DB.putSavedTicket(t);

          await DB.setInitialized();

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
      items, addItem, updateItem, deleteItem, importItems,
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
