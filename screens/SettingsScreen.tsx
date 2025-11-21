
import React from 'react';
import { useAppContext } from '../context/AppContext';

const SettingsScreen: React.FC = () => {
  const { theme, setTheme, settings, updateSettings } = useAppContext();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleTax = () => {
    updateSettings({ taxEnabled: !settings.taxEnabled });
  };

  const handleTaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      updateSettings({ taxRate: val });
    }
  };

  return (
    <div className="p-6 pb-24 dark:bg-gray-900 min-h-full">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Settings</h1>
      <div className="space-y-8 max-w-2xl mx-auto">
        
        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">Appearance</h2>
          <div className="flex items-center justify-between">
            <label htmlFor="dark-mode-toggle" className="text-gray-700 dark:text-gray-300">Dark Mode</label>
            <button
              id="dark-mode-toggle"
              onClick={toggleTheme}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Switch between light and dark themes.
          </p>
        </div>

        {/* Financial Section (Tax & Currency) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">Financial & Tax</h2>
          <div className="space-y-6">
            
            {/* Tax Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="tax-toggle" className="block text-gray-700 dark:text-gray-300 font-medium">Enable Tax (GST)</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Calculate tax on sales automatically.</p>
              </div>
              <button
                id="tax-toggle"
                onClick={toggleTax}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  settings.taxEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                    settings.taxEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Tax Rate Input (Only visible if tax is enabled) */}
            <div className={`transition-all duration-300 ${settings.taxEnabled ? 'opacity-100 max-h-20' : 'opacity-50 max-h-20 pointer-events-none grayscale'}`}>
                <div className="flex justify-between items-center">
                  <label htmlFor="tax-rate" className="text-gray-700 dark:text-gray-300">Tax Rate (%)</label>
                  <div className="relative w-1/2">
                    <input 
                      id="tax-rate" 
                      type="number" 
                      step="0.1"
                      min="0"
                      value={settings.taxRate}
                      onChange={handleTaxRateChange}
                      disabled={!settings.taxEnabled}
                      className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                  </div>
                </div>
            </div>

            <div className="flex justify-between items-center border-t dark:border-gray-700 pt-4">
              <label htmlFor="currency" className="text-gray-700 dark:text-gray-300">Currency Symbol</label>
              <input id="currency" type="text" defaultValue="₹" disabled className="p-2 border rounded-md w-1/2 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* Printers Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">Printers</h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Connect and manage your thermal receipt printers. This will typically involve Bluetooth pairing.
            </p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
              Find Printers
            </button>
            <div className="mt-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Connected Printers:</h3>
              <p className="text-gray-500 dark:text-gray-400 italic mt-2">No printers connected.</p>
            </div>
          </div>
        </div>

        {/* General Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">Store Info</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="store-name" className="text-gray-700 dark:text-gray-300">Store Name</label>
              <input id="store-name" type="text" defaultValue="My Restaurant" className="p-2 border rounded-md w-1/2 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsScreen;
