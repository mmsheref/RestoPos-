
import React, { useState, useRef, useEffect } from 'react';
import { MenuIcon, SearchIcon, CloseIcon } from '../../constants';

interface SalesHeaderProps {
  openDrawer: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SalesHeader: React.FC<SalesHeaderProps> = ({ openDrawer, searchQuery, onSearchChange }) => {
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Automatically enter search mode if there is a query (e.g. restored from state)
  useEffect(() => {
      if (searchQuery && !isSearching) {
          setIsSearching(true);
      }
  }, [searchQuery]);

  // Focus input when entering search mode
  useEffect(() => {
      if (isSearching && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isSearching]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleClearText = () => {
    onSearchChange('');
    // Keep focus on input after clearing
    inputRef.current?.focus();
  };

  const handleCloseSearch = () => {
    setIsSearching(false);
    onSearchChange('');
  };

  return (
    <header className="bg-surface shadow-sm w-full z-10 flex-shrink-0 h-16 flex items-center justify-between px-4">
      {isSearching ? (
        <div className="flex items-center w-full gap-2">
          <div className="relative flex-grow">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search all items..."
              value={searchQuery}
              onChange={handleQueryChange}
              className="w-full h-10 pl-3 pr-10 bg-surface-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            />
            {searchQuery && (
                <button 
                    onClick={handleClearText}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-text-muted hover:text-text-primary bg-surface-muted rounded-full"
                    aria-label="Clear text"
                >
                    <CloseIcon className="h-4 w-4" />
                </button>
            )}
          </div>
          <button
            onClick={handleCloseSearch}
            className="p-2 text-text-secondary hover:text-text-primary font-medium text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full">
          <button onClick={openDrawer} className="p-2 text-text-secondary hover:text-text-primary">
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-text-primary">
              Sales
            </h1>
          </div>
          <button onClick={() => setIsSearching(true)} className="p-2 text-text-secondary hover:text-text-primary">
            <SearchIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </header>
  );
};

export default SalesHeader;
