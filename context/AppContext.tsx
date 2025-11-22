
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Printer } from '../types';

type Theme = 'light' | 'dark';

interface AppSettings {
  taxEnabled: boolean;
  taxRate: number;
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
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  printers: Printer[];
  addPrinter: (printer: Printer) => void;
  removePrinter: (printerId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  
  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
        const storedPrefs = localStorage.getItem('theme');
        if (storedPrefs) {
            return storedPrefs as Theme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // App Settings State (Tax, etc.)
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem('appSettings');
      if (storedSettings) {
        try {
          return JSON.parse(storedSettings);
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
    }
    // Default settings
    return { taxEnabled: true, taxRate: 5 };
  });

  // Printer State
  const [printers, setPrinters] = useState<Printer[]>(() => {
    if (typeof window !== 'undefined') {
      const storedPrinters = localStorage.getItem('printers');
      if (storedPrinters) {
        try {
          return JSON.parse(storedPrinters);
        } catch (e) {
          console.error("Failed to parse printers", e);
        }
      }
    }
    return [];
  });

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('appSettings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addPrinter = useCallback((printer: Printer) => {
    setPrinters(prev => {
      const updated = [...prev, printer];
      localStorage.setItem('printers', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removePrinter = useCallback((printerId: string) => {
    setPrinters(prev => {
      const updated = prev.filter(p => p.id !== printerId);
      localStorage.setItem('printers', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);


  return (
    <AppContext.Provider value={{ 
      isDrawerOpen, openDrawer, closeDrawer, toggleDrawer, 
      headerTitle, setHeaderTitle,
      theme, setTheme,
      settings, updateSettings,
      printers, addPrinter, removePrinter
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
