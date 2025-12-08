
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { NAV_LINKS, SignOutIcon, APP_VERSION, SyncIcon, OfflineIcon, CheckIcon } from '../constants';
import ConfirmModal from './modals/ConfirmModal';

const NavDrawer: React.FC = () => {
  const { isDrawerOpen, closeDrawer, user, signOut, settings, pendingSyncCount, isOnline } = useAppContext();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  const handleSignOutClick = () => {
    setIsSignOutModalOpen(true);
  };

  const confirmSignOut = () => {
    signOut();
    setIsSignOutModalOpen(false);
  };

  return (
    <>
      {isDrawerOpen && (
        <div
          onClick={closeDrawer}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 bg-neutral-900 text-white z-[70] flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out will-change-transform ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-neutral-800 bg-neutral-900/50">
          <h2 className="text-2xl font-bold text-white truncate tracking-tight">
            {settings.storeName || 'POS Menu'}
          </h2>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul>
            {NAV_LINKS.map(({ path, label, Icon }) => (
              <li key={path} className="px-3 mb-1">
                <NavLink
                  to={path}
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3.5 text-base rounded-lg transition-all duration-200 font-medium ${
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 mr-4" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Sync Status Indicator */}
        <div className="px-6 py-2">
            <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${
                !isOnline ? 'bg-neutral-800 text-neutral-400' :
                pendingSyncCount > 0 ? 'bg-amber-900/30 text-amber-400' :
                'bg-green-900/20 text-green-400'
            }`}>
                {!isOnline ? (
                    <>
                        <OfflineIcon className="h-4 w-4" />
                        <span>Offline Mode</span>
                    </>
                ) : pendingSyncCount > 0 ? (
                    <>
                        <SyncIcon className="h-4 w-4 animate-spin" />
                        <span>{pendingSyncCount} unsynced transaction{pendingSyncCount !== 1 ? 's' : ''}</span>
                    </>
                ) : (
                    <>
                        <CheckIcon className="h-4 w-4" />
                        <span>All Changes Saved</span>
                    </>
                )}
            </div>
        </div>
        
        <div className="px-6 py-4 mt-auto text-center border-t border-neutral-800">
            <p className="text-xs text-neutral-500">Version {APP_VERSION}</p>
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50">
            {user && (
                <div className="text-xs text-neutral-500 mb-3 truncate px-2 font-mono">
                    {user.email}
                </div>
            )}
            <button 
                onClick={handleSignOutClick}
                className="w-full flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg"
            >
                <SignOutIcon className="h-5 w-5 mr-4"/>
                <span>Sign Out</span>
            </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={confirmSignOut}
        title="Sign Out"
        confirmText="Sign Out"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      >
        <p>Are you sure you want to sign out?</p>
      </ConfirmModal>
    </>
  );
};

export default NavDrawer;
