
import React from 'react';
import { useAppContext } from '../context/AppContext';

const SettingsScreen: React.FC = () => {
  const { theme, setTheme } = useAppContext();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-full">
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
          <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-700 pb-2 text-gray-800 dark:text-gray-100">General</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="store-name" className="text-gray-700 dark:text-gray-300">Store Name</label>
              <input id="store-name" type="text" defaultValue="My Restaurant" className="p-2 border rounded-md w-1/2 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
            </div>
            <div className="flex justify-between items-center">
              <label htmlFor="currency" className="text-gray-700 dark:text-gray-300">Currency</label>
              <input id="currency" type="text" defaultValue="INR" className="p-2 border rounded-md w-1/2 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
            </div>
            <div className="flex justify-between items-center">
              <label htmlFor="tax-rate" className="text-gray-700 dark:text-gray-300">Default Tax Rate (%)</label>
              <input id="tax-rate" type="number" defaultValue="5" className="p-2 border rounded-md w-1/2 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsScreen;
