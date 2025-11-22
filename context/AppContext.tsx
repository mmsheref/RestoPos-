
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Printer, Receipt, Item, AppSettings, BackupData } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as DB from '../db/db';

type Theme = 'light' | 'dark';

// --- Initial Seed Data ---
const INITIAL_CATEGORIES = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Sides'];

const INITIAL_ITEMS: Item[] = [
    { id: 'a1', name: 'Spring Rolls', price: 150.00, category: 'Appetizers', stock: 100, imageUrl: 'https://picsum.photos/id/10/200/200' },
    { id: 'a2', name: 'Garlic Bread', price: 120.00, category: 'Appetizers', stock: 100, imageUrl: 'https://picsum.photos/id/20/200/200' },
    { id: 'm1', name: 'Steak Frites', price: 650.00, category: 'Main Courses', stock: 50, imageUrl: 'https://picsum.photos/id/40/200/200' },
    { id: 'm2', name: 'Veg Noodles', price: 250.00, category: 'Main Courses', stock: 60, imageUrl: 'https://picsum.photos/id/50/200/200' },
    { id: 'd1', name: 'Cheesecake', price: 220.00, category: 'Desserts', stock: 20, imageUrl: 'https://picsum.photos/id/70/200/200' },
    { id: 'b1', name: 'Coke', price: 60.00, category: 'Beverages', stock: 200, imageUrl: 'https://picsum.photos/id/90/200/200' },
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
  
  categories: string[];
  setCategories: (categories: string[]) => void; 
  addCategory: (name: string) => void;

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
  
  // --- Initialize & Load Data ---
  useEffect(() => {
    const initData = async () => {
      try {
        await DB.initDB();
        
        // Load data in parallel
        const [loadedItems, loadedReceipts, loadedPrinters, loadedSettings, loadedCategories] = await Promise.all([
            DB.getAllItems(),
            DB.getAllReceipts(),
            DB.getAllPrinters(),
            DB.getSettings(),
            DB.getCategories()
        ]);

        // Seed Initial Data if empty
        if (loadedItems.length === 0 && loadedCategories === undefined) {
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
        } else {
             setItemsState(loadedItems);
             setReceiptsState(loadedReceipts.sort((a,b) => b.date.getTime() - a.date.getTime())); // Sort desc
             setPrintersState(loadedPrinters);
             setSettingsState(loadedSettings || DEFAULT_SETTINGS);
             setCategoriesState(loadedCategories || INITIAL_CATEGORIES);
        }

      } catch (e) {
        console.error("Failed to initialize database:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);


  // --- Logic Wrappers ---

  const addReceipt = useCallback(async (receipt: Receipt) => {
    // Optimistic UI update
    setReceiptsState(prev => [receipt, ...prev]);
    // DB Update
    await DB.addReceipt(receipt);
  }, []);

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
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    await DB.saveSettings(updated);
  }, [settings]);

  const addPrinter = useCallback(async (printer: Printer) => {
    setPrintersState(prev => [...prev, printer]);
    await DB.putPrinter(printer);
  }, []);

  const removePrinter = useCallback(async (printerId: string) => {
    setPrintersState(prev => prev.filter(p => p.id !== printerId));
    await DB.deletePrinter(printerId);
  }, []);

  // --- Item Management ---
  const addItem = useCallback(async (item: Item) => {
    setItemsState(prev => [...prev, item]);
    await DB.putItem(item);
  }, []);

  const updateItem = useCallback(async (updatedItem: Item) => {
    setItemsState(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    await DB.putItem(updatedItem);
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setItemsState(prev => prev.filter(item => item.id !== id));
    await DB.deleteItem(id);
  }, []);

  // --- Category Management ---
  const setCategories = useCallback(async (newCategories: string[]) => {
      setCategoriesState(newCategories);
      await DB.saveCategories(newCategories);
  }, []);

  const addCategory = useCallback(async (name: string) => {
      const newCats = categories.includes(name) ? categories : [...categories, name];
      setCategoriesState(newCats);
      await DB.saveCategories(newCats);
  }, [categories]);


  // --- Backup & Restore ---
  const exportData = useCallback(async () => {
    const backup: BackupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        settings,
        items,
        categories,
        printers,
        receipts
    };
    
    const jsonString = JSON.stringify(backup, null, 2);
    const fileName = `pos_backup_${new Date().toISOString().slice(0, 10)}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        await Share.share({
          title: 'Restaurant POS Backup',
          text: `Backup created on ${new Date().toLocaleDateString()}`,
          url: result.uri, 
          dialogTitle: 'Save Backup File'
        });

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
  }, [settings, items, categories, printers, receipts]);

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

          // Update State
          setSettingsState(data.settings);
          setItemsState(data.items || []);
          setCategoriesState(data.categories || []);
          setPrintersState(data.printers || []);
          setReceiptsState(restoredReceipts);

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
