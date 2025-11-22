import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Printer, Receipt } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

type Theme = 'light' | 'dark';

interface AppSettings {
  taxEnabled: boolean;
  taxRate: number;
}

const mockReceipts: Receipt[] = [
  { id: 'R003', date: new Date('2023-10-27T14:48:00'), items: [{ id: 'm1', name: 'Steak Frites', price: 650.00, quantity: 2, category: 'Main', stock: 1, imageUrl: '' }], total: 1365.00, paymentMethod: 'Card' },
  { id: 'R002', date: new Date('2023-10-27T12:30:00'), items: [{ id: 'b1', name: 'Coke', price: 60.00, quantity: 2, category: 'Bev', stock: 1, imageUrl: '' }], total: 126.00, paymentMethod: 'Cash' },
  { id: 'R001', date: new Date('2023-10-26T19:00:00'), items: [{ id: 'd1', name: 'Cheesecake', price: 220.00, quantity: 1, category: 'Dessert', stock: 1, imageUrl: '' }], total: 231.00, paymentMethod: 'Card' },
];

interface AppContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  headerTitle: string;
  setHeaderTitle: (title: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  printers: Printer[];
  addPrinter: (printer: Printer) => void;
  removePrinter: (printerId: string) => void;
  receipts: Receipt[];
  addReceipt: (receipt: Receipt) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  
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

  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', { taxEnabled: true, taxRate: 5 });
  const [printers, setPrinters] = useLocalStorage<Printer[]>('printers', []);
  const [receipts, setReceipts] = useLocalStorage<Receipt[]>('receipts', mockReceipts);
  
  // Memoize receipts to parse date strings from localStorage into Date objects
  const parsedReceipts = useMemo(() => {
    return receipts.map(r => ({...r, date: new Date(r.date)}));
  }, [receipts]);

  const addReceipt = useCallback((receipt: Receipt) => {
    setReceipts(prev => [receipt, ...prev]);
  }, [setReceipts]);

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

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  const addPrinter = useCallback((printer: Printer) => {
    setPrinters(prev => [...prev, printer]);
  }, [setPrinters]);

  const removePrinter = useCallback((printerId: string) => {
    setPrinters(prev => prev.filter(p => p.id !== printerId));
  }, [setPrinters]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);
  
  return (
    <AppContext.Provider value={{ 
      isDrawerOpen, openDrawer, closeDrawer, toggleDrawer, 
      headerTitle, setHeaderTitle,
      theme, setTheme,
      settings, updateSettings,
      printers, addPrinter, removePrinter,
      receipts: parsedReceipts, addReceipt
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