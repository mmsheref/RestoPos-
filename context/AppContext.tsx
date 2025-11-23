import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Printer, Receipt, Item, AppSettings, BackupData, SavedTicket, CustomGrid } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { exportItemsToCsv } from '../utils/csvHelper';
import { db, ensureAuthenticated, RESTAURANT_ID, clearAllData, firebaseConfig } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, Timestamp, getDoc } from 'firebase/firestore';
import FirebaseError from '../components/FirebaseError';

type Theme = 'light' | 'dark';

const DEFAULT_SETTINGS: AppSettings = { 
    taxEnabled: true, 
    taxRate: 5, 
    storeName: 'My Restaurant',
    storeAddress: '123 Food Street, Flavor Town',
    receiptFooter: 'Follow us @myrestaurant'
};

interface FirebaseErrorState {
  title: string;
  message: string;
  instructions: string[];
  projectId: string;
}

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

  savedTickets: SavedTicket[];
  saveTicket: (ticket: SavedTicket) => void;
  removeTicket: (ticketId: string) => void;

  customGrids: CustomGrid[];
  addCustomGrid: (grid: CustomGrid) => void;
  updateCustomGrid: (grid: CustomGrid) => void;
  deleteCustomGrid: (id: string) => void;
  setCustomGrids: (grids: CustomGrid[]) => void;

  // Backup
  exportData: () => void;
  restoreData: (data: BackupData) => void;
  exportItemsCsv: () => void;
  replaceItems: (items: Item[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<FirebaseErrorState | null>(null);

  
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
  const [savedTickets, setSavedTicketsState] = useState<SavedTicket[]>([]);
  const [customGrids, setCustomGridsState] = useState<CustomGrid[]>([]);
  
  // --- Initialize & Load Data from Firebase ---
  useEffect(() => {
    const initFirebase = async () => {
      try {
        await ensureAuthenticated();
        
        const unsubscribers = [
          onSnapshot(collection(db, 'restaurants', RESTAURANT_ID, 'items'), (snapshot) => {
              const itemsData = snapshot.docs.map(doc => ({ ...doc.data() } as Item));
              setItemsState(itemsData);
          }),
          onSnapshot(collection(db, 'restaurants', RESTAURANT_ID, 'receipts'), (snapshot) => {
              const receiptsData = snapshot.docs.map(doc => {
                  const data = doc.data();
                  return { ...data, date: (data.date as Timestamp).toDate() } as Receipt;
              }).sort((a,b) => b.date.getTime() - a.date.getTime());
              setReceiptsState(receiptsData);
          }),
          onSnapshot(collection(db, 'restaurants', RESTAURANT_ID, 'printers'), (snapshot) => {
              const printersData = snapshot.docs.map(doc => ({ ...doc.data() } as Printer));
              setPrintersState(printersData);
          }),
          onSnapshot(collection(db, 'restaurants', RESTAURANT_ID, 'saved_tickets'), (snapshot) => {
              const ticketsData = snapshot.docs.map(doc => ({ ...doc.data() } as SavedTicket));
              setSavedTicketsState(ticketsData);
          }),
          onSnapshot(collection(db, 'restaurants', RESTAURANT_ID, 'custom_grids'), (snapshot) => {
              const gridsData = snapshot.docs.map(doc => ({ ...doc.data() } as CustomGrid));
              setCustomGridsState(gridsData);
          }),
          onSnapshot(doc(db, 'restaurants', RESTAURANT_ID, 'config', 'settings'), async (docSnap) => {
              if (docSnap.exists()) {
                setSettingsState(docSnap.data() as AppSettings);
              } else {
                // If settings don't exist, create them with defaults directly.
                console.log("No settings found in Firestore, creating with defaults.");
                setSettingsState(DEFAULT_SETTINGS);
                try {
                  await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'config', 'settings'), DEFAULT_SETTINGS);
                } catch (e) {
                  console.error("Failed to create default settings document:", e);
                }
              }
          })
        ];
        
        setIsLoading(false);

        return () => unsubscribers.forEach(unsub => unsub());

      } catch (e: any) {
        console.error("Firebase initialization failed:", e);
        if (e.code === 'auth/configuration-not-found') {
            setInitializationError({
                title: 'Firebase Configuration Error',
                message: 'Anonymous sign-in is not enabled for your project.',
                instructions: [
                    'Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">Firebase Console</a>.',
                    `Select your project: <strong>${firebaseConfig.projectId}</strong>.`,
                    'In the left menu, go to <strong>Build &gt; Authentication</strong>.',
                    'Click the <strong>Sign-in method</strong> tab.',
                    'Find <strong>Anonymous</strong> in the provider list and click the pencil icon to enable it.',
                    '<strong>Refresh this page</strong> after enabling.'
                ],
                projectId: firebaseConfig.projectId
            });
        } else {
            setInitializationError({
                title: 'Connection Failed',
                message: e.message || 'Could not connect to the database. Please check your internet connection and try again.',
                instructions: ['If the problem persists, verify your Firebase configuration details.'],
                projectId: firebaseConfig.projectId
            });
        }
        setIsLoading(false);
      }
    };

    const unsubscribePromise = initFirebase();

    return () => {
        unsubscribePromise.then(unsub => { if(unsub) unsub() });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addReceipt = useCallback(async (receipt: Receipt) => {
    try {
        await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'receipts', receipt.id), receipt);
    } catch (e) {
        console.error("Failed to save receipt", e);
        alert("Failed to save receipt to database.");
    }
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
    try {
        await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'config', 'settings'), updated);
    } catch (e) {
        console.error("Failed to save settings", e);
    }
  }, [settings]);

  const addPrinter = useCallback(async (printer: Printer) => {
    try {
        await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'printers', printer.id), printer);
    } catch (e) {
        alert("Failed to save printer.");
    }
  }, []);

  const removePrinter = useCallback(async (printerId: string) => {
    try {
        await deleteDoc(doc(db, 'restaurants', RESTAURANT_ID, 'printers', printerId));
    } catch (e) {
        alert("Failed to delete printer.");
    }
  }, []);

  const addItem = useCallback(async (item: Item) => {
    try { 
      await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'items', item.id), item); 
    } catch (e) { 
      console.error("Failed to add item", e);
      alert("Failed to add item.");
    }
  }, []);

  const updateItem = useCallback(async (updatedItem: Item) => {
    try { 
      await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'items', updatedItem.id), updatedItem); 
    } catch (e) { 
      console.error("Failed to update item", e);
      alert("Failed to update item.");
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
        await deleteDoc(doc(db, 'restaurants', RESTAURANT_ID, 'items', id));
    } catch (e) {
        console.error("Failed to delete item", e);
        alert("Failed to delete item from database.");
    }
  }, []);

  const saveTicket = useCallback(async (ticket: SavedTicket) => {
      try { 
        await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'saved_tickets', ticket.id), ticket); 
      } catch (e) { 
        console.error("Failed to save ticket", e);
        alert("Failed to save ticket.");
      }
  }, []);

  const removeTicket = useCallback(async (ticketId: string) => {
      try { 
        await deleteDoc(doc(db, 'restaurants', RESTAURANT_ID, 'saved_tickets', ticketId));
      } catch (e) { 
        console.error("Failed to delete ticket", e);
        alert("Failed to delete ticket.");
      }
  }, []);

  const addCustomGrid = useCallback(async (grid: CustomGrid) => {
      try { 
        await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'custom_grids', grid.id), grid); 
      } catch (e) { 
        console.error("Failed to add custom grid", e);
        alert("Failed to add custom grid.");
      }
  }, []);

  const updateCustomGrid = useCallback(async (grid: CustomGrid) => {
      try { 
        await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'custom_grids', grid.id), grid);
      } catch (e) { 
        console.error("Failed to update custom grid", e);
        alert("Failed to update custom grid.");
      }
  }, []);

  const deleteCustomGrid = useCallback(async (id: string) => {
      try { 
        await deleteDoc(doc(db, 'restaurants', RESTAURANT_ID, 'custom_grids', id));
      } catch (e) { 
        console.error("Failed to delete custom grid", e);
        alert("Failed to delete custom grid.");
      }
  }, []);

  const setCustomGrids = useCallback(async (newGrids: CustomGrid[]) => {
      const batch = writeBatch(db);
      const gridsCollectionRef = collection(db, 'restaurants', RESTAURANT_ID, 'custom_grids');
      
      try {
          // To perform a replace, we fetch existing IDs to delete the ones not in the new set
          const currentGridIds = customGrids.map(g => g.id);
          const newGridIds = new Set(newGrids.map(g => g.id));
          
          const gridsToDelete = currentGridIds.filter(id => !newGridIds.has(id));
          
          gridsToDelete.forEach(id => {
              batch.delete(doc(gridsCollectionRef, id));
          });

          newGrids.forEach(grid => {
              batch.set(doc(gridsCollectionRef, grid.id), grid);
          });
          
          await batch.commit();

      } catch (e) {
          console.error("Failed to save grid changes to DB:", e);
          alert("Failed to save grid changes. Please try again.");
      }
  }, [customGrids]);


  const replaceItems = useCallback(async (newItems: Item[]) => {
    setIsLoading(true);
    const batch = writeBatch(db);
    const itemsCollectionRef = collection(db, 'restaurants', RESTAURANT_ID, 'items');
    try {
      // Clear existing items
      items.forEach(item => batch.delete(doc(itemsCollectionRef, item.id)));

      // Add new items
      newItems.forEach(item => batch.set(doc(itemsCollectionRef, item.id), item));

      await batch.commit();
    } catch (e) {
      alert("Failed to import items from CSV. Data has not been changed.");
    } finally {
      setIsLoading(false);
    }
  }, [items]);

  const exportItemsCsv = useCallback(() => {
    try {
      const csvString = exportItemsToCsv(items);
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `pos_items_export_${dateStr}.csv`;
  
      if (Capacitor.isNativePlatform()) {
        Filesystem.writeFile({
          path: fileName,
          data: csvString,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        }).then(result => {
           Share.share({ url: result.uri });
        }).catch(error => {
          alert(`CSV Export Failed: ${error.message || error}`);
        });
      } else {
        const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    } catch (e) {
      alert("An error occurred while generating the CSV file.");
    }
  }, [items]);
  
  const exportData = useCallback(async () => {
    const backup: BackupData = {
        version: '2.0-firebase', timestamp: new Date().toISOString(),
        settings, items, categories: [], printers, receipts, savedTickets, customGrids
    };
    const jsonString = JSON.stringify(backup, null, 2);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `pos_backup_${dateStr}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({ path: fileName, data: jsonString, directory: Directory.Documents, encoding: Encoding.UTF8 });
        await Share.share({ url: result.uri });
      } catch (error: any) {
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
  }, [settings, items, printers, receipts, savedTickets, customGrids]);

  const restoreData = useCallback(async (data: BackupData) => {
      setIsLoading(true);
      try {
          await clearAllData();
          
          const batch = writeBatch(db);
          
          // Settings
          batch.set(doc(db, 'restaurants', RESTAURANT_ID, 'config', 'settings'), data.settings);

          // Collections
          (data.items || []).forEach(item => batch.set(doc(db, 'restaurants', RESTAURANT_ID, 'items', item.id), item));
          (data.printers || []).forEach(p => batch.set(doc(db, 'restaurants', RESTAURANT_ID, 'printers', p.id), p));
          (data.receipts || []).forEach(r => batch.set(doc(db, 'restaurants', RESTAURANT_ID, 'receipts', r.id), {...r, date: new Date(r.date)}));
          (data.savedTickets || []).forEach(t => batch.set(doc(db, 'restaurants', RESTAURANT_ID, 'saved_tickets', t.id), t));
          (data.customGrids || []).forEach(g => batch.set(doc(db, 'restaurants', RESTAURANT_ID, 'custom_grids', g.id), g));

          await batch.commit();

      } catch(e) {
          console.error("Restore failed:", e);
          alert("Failed to restore data from backup.");
      } finally {
          setIsLoading(false);
      }
  }, []);


  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);
  
  if (initializationError) {
      return <FirebaseError error={initializationError} />
  }

  if (isLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
             <div className="text-center">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                 <p className="text-gray-600 dark:text-gray-400">Connecting to Cloud...</p>
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
      savedTickets, saveTicket, removeTicket,
      customGrids, addCustomGrid, updateCustomGrid, deleteCustomGrid, setCustomGrids,
      exportData, restoreData,
      exportItemsCsv, replaceItems
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