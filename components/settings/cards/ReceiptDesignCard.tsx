
import React from 'react';
import { AppSettings } from '../../../types';
import { PrintIcon } from '../../../constants';
import { testPrint } from '../../../utils/printerHelper';
import { useAppContext } from '../../../context/AppContext';

interface ReceiptDesignCardProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const ReceiptDesignCard: React.FC<ReceiptDesignCardProps> = ({ settings, updateSettings }) => {
  const { printers } = useAppContext();
  
  // Ensure we have default values even if settings are missing them (backward compatibility)
  const config = settings.receiptDesign || {
      headerFontSize: 'large',
      showStoreName: true,
      showStoreAddress: true,
      showDate: true,
      showTaxBreakdown: true,
      showFooter: true,
      compactMode: false
  };

  const handleUpdate = (key: keyof typeof config, value: any) => {
      const newConfig = { ...config, [key]: value };
      updateSettings({ receiptDesign: newConfig });
  };

  const handleTestPrint = () => {
      const printer = printers.find(p => p.interfaceType === 'Bluetooth') || printers[0];
      if (!printer) {
          alert("No printer found to test with.");
          return;
      }
      testPrint(printer, settings);
  };

  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Receipt Design</h2>
        <button 
            onClick={handleTestPrint}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-muted text-text-primary text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
            <PrintIcon className="h-4 w-4" />
            Test Print
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Header Options */}
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider border-b border-border pb-2">Header</h3>
            
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Store Name Font Size</span>
                <select 
                    value={config.headerFontSize}
                    onChange={(e) => handleUpdate('headerFontSize', e.target.value)}
                    className="p-2 border border-border rounded-md bg-background text-text-primary text-sm focus:ring-2 focus:ring-primary"
                >
                    <option value="normal">Normal</option>
                    <option value="large">Large (Double Width)</option>
                    <option value="huge">Huge (Double W+H)</option>
                </select>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Show Store Name</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={config.showStoreName} 
                        onChange={(e) => handleUpdate('showStoreName', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Show Address</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={config.showStoreAddress} 
                        onChange={(e) => handleUpdate('showStoreAddress', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
            </div>
        </div>

        {/* Content Options */}
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider border-b border-border pb-2">Content</h3>
            
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Show Date & Time</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={config.showDate} 
                        onChange={(e) => handleUpdate('showDate', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Show Tax Breakdown</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={config.showTaxBreakdown} 
                        onChange={(e) => handleUpdate('showTaxBreakdown', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
            </div>
        </div>

        {/* Layout Options */}
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider border-b border-border pb-2">Layout</h3>
            
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Compact Mode (Save Paper)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={config.compactMode} 
                        onChange={(e) => handleUpdate('compactMode', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Show Footer Message</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={config.showFooter} 
                        onChange={(e) => handleUpdate('showFooter', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDesignCard;
