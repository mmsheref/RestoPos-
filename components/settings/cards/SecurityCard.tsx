
import React, { useState } from 'react';
import { AppSettings } from '../../../types';
import { LockIcon, CheckIcon } from '../../../constants';

interface SecurityCardProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SecurityCard: React.FC<SecurityCardProps> = ({ settings, updateSettings }) => {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  const hasPin = !!settings.reportsPIN;

  const handleSave = () => {
    setError('');
    
    if (!newPin) {
        if(hasPin) {
            // Clearing the PIN input while a PIN exists usually means "Update", not delete.
            // Deletion is handled by the dedicated button.
            return;
        } else {
            return;
        }
    }

    if (newPin.length < 4) {
        setError("PIN must be at least 4 digits.");
        return;
    }

    if (newPin !== confirmPin) {
        setError("PINs do not match.");
        return;
    }

    // Update settings
    updateSettings({ reportsPIN: newPin });
    setIsSaved(true);
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleClear = () => {
      if(confirm("Are you sure you want to remove the PIN protection? Reports will be accessible to anyone.")) {
          updateSettings({ reportsPIN: '' });
          setNewPin('');
          setConfirmPin('');
      }
  }

  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
      <div className="flex items-center gap-3 mb-4">
        <LockIcon className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold text-text-primary">Security & Reports</h2>
      </div>
      
      <p className="text-sm text-text-secondary mb-6">
        Set a PIN to protect your sales reports and analytics from unauthorized access. 
        Leave blank to disable protection.
      </p>

      {hasPin ? (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <p className="text-emerald-800 dark:text-emerald-200 font-medium flex items-center gap-2">
                  <CheckIcon className="h-5 w-5" />
                  Reports are protected by a PIN.
              </p>
              <button onClick={handleClear} className="text-xs text-red-600 dark:text-red-400 hover:underline mt-2 font-semibold">
                  Remove Protection
              </button>
          </div>
      ) : (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
            <p className="text-amber-800 dark:text-amber-200 font-medium">
                Reports are currently accessible to everyone.
            </p>
        </div>
      )}

      <div className="space-y-4 max-w-sm">
        <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
                {hasPin ? 'Change PIN' : 'New PIN'}
            </label>
            <input 
                type="password" 
                inputMode="numeric"
                pattern="[0-9]*"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter 4-6 digit PIN"
                className="w-full p-2 border border-border rounded-md bg-background text-text-primary focus:ring-2 focus:ring-primary"
            />
        </div>
        
        <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
                Confirm PIN
            </label>
            <input 
                type="password" 
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Re-enter PIN"
                className="w-full p-2 border border-border rounded-md bg-background text-text-primary focus:ring-2 focus:ring-primary"
            />
        </div>

        {error && <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>}

        <div className="pt-2">
            <button
              onClick={handleSave}
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-content transition-colors w-full ${
                isSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary-hover'
              }`}
            >
              {isSaved ? <span className="flex items-center gap-2"><CheckIcon className="h-4 w-4"/> Saved</span> : 'Save PIN'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityCard;
