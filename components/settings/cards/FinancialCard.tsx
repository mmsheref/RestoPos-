
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../../../types';

interface FinancialCardProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const FinancialCard: React.FC<FinancialCardProps> = ({ settings, updateSettings }) => {
  // Use local state to handle decimal input smoothly
  const [taxRateInput, setTaxRateInput] = useState(settings.taxRate.toString());

  // Sync local state if settings update from external source
  useEffect(() => {
    setTaxRateInput(settings.taxRate.toString());
  }, [settings.taxRate]);

  const handleTaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow digits and a single decimal point
    if (/^\d*\.?\d*$/.test(val)) {
      setTaxRateInput(val);
      const num = parseFloat(val);
      if (!isNaN(num)) {
         updateSettings({ taxRate: num });
      } else if (val === '') {
         updateSettings({ taxRate: 0 });
      }
    }
  };

  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">Financial</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary">Enable Tax</span>
          <label htmlFor="tax-toggle" className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              id="tax-toggle" 
              className="sr-only peer"
              checked={settings.taxEnabled} 
              onChange={(e) => updateSettings({ taxEnabled: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>
        {settings.taxEnabled && (
          <div>
            <label htmlFor="taxRate" className="block text-sm font-medium text-text-secondary">Tax Rate (%)</label>
            <input
              type="text"
              inputMode="decimal"
              id="taxRate"
              value={taxRateInput}
              onChange={handleTaxRateChange}
              className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-background"
              placeholder="0"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialCard;
