import React, { useState } from 'react';
import type { OrderItem, SavedTicket } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { CheckIcon } from '../../constants';

interface OpenTicketsModalProps {
    isOpen: boolean;
    tickets: SavedTicket[];
    onClose: () => void;
    onLoadTicket: (ticket: SavedTicket) => void;
    onDeleteTicket: (id: string) => void;
}

const OpenTicketsModal: React.FC<OpenTicketsModalProps> = ({ isOpen, tickets, onClose, onLoadTicket, onDeleteTicket }) => {
    const { settings, mergeTickets } = useAppContext();
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());

    const calculateTotal = (items: OrderItem[]) => {
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const taxMultiplier = settings.taxEnabled ? (1 + settings.taxRate / 100) : 1;
        return subtotal * taxMultiplier;
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedTicketIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedTicketIds(newSet);
    };

    const handleMerge = () => {
        if (selectedTicketIds.size < 2) return;
        
        const ids = Array.from(selectedTicketIds) as string[];
        const firstTicket = tickets.find(t => t.id === ids[0]);
        const defaultName = firstTicket ? `${firstTicket.name} + ${ids.length - 1}` : 'Merged Ticket';
        
        const newName = prompt("Enter a name for the merged ticket:", defaultName);
        if (newName) {
            mergeTickets(ids, newName);
            setIsSelectionMode(false);
            setSelectedTicketIds(new Set());
        }
    };

    const toggleMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedTicketIds(new Set());
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
          <div className="bg-surface rounded-lg p-6 shadow-xl w-full max-w-2xl flex flex-col" style={{maxHeight: '80vh'}} onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0 flex justify-between items-center mb-4 pb-4 border-b border-border">
              <h2 className="text-2xl font-bold text-text-primary">
                  {isSelectionMode ? `Select Tickets` : 'Open Tickets'}
              </h2>
              <div className="flex items-center gap-3">
                 <button 
                    onClick={toggleMode} 
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${isSelectionMode ? 'bg-surface-muted text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                 >
                     {isSelectionMode ? 'Cancel Selection' : 'Select'}
                 </button>
                 <button onClick={onClose} className="text-text-muted hover:text-text-primary text-3xl font-light" aria-label="Close">&times;</button>
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto -mx-6 px-6">
              {tickets.length === 0 ? (
                <p className="text-text-secondary text-center py-8">No tickets saved.</p>
              ) : (
                <ul className="space-y-3">
                  {tickets.map(ticket => {
                    const isSelected = selectedTicketIds.has(ticket.id);
                    return (
                        <li 
                            key={ticket.id} 
                            onClick={() => isSelectionMode && toggleSelection(ticket.id)}
                            className={`p-3 rounded-lg flex items-center justify-between transition-colors border-2 ${
                                isSelectionMode 
                                    ? (isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 cursor-pointer' : 'bg-surface-muted border-transparent cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700')
                                    : 'bg-surface-muted border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                          <div className="flex items-center gap-4">
                              {isSelectionMode && (
                                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-text-muted bg-surface'}`}>
                                      {isSelected && <CheckIcon className="h-4 w-4" />}
                                  </div>
                              )}
                              <div>
                                <p className="font-bold text-text-primary">{ticket.name}</p>
                                <p className="text-sm text-text-secondary">{ticket.items.length} items &bull; Total: {calculateTotal(ticket.items).toFixed(2)}</p>
                              </div>
                          </div>
                          
                          {!isSelectionMode && (
                              <div className="flex items-center gap-2">
                                <button onClick={() => onDeleteTicket(ticket.id)} className="h-9 w-9 flex items-center justify-center text-red-500 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-500/20" aria-label={`Delete ticket ${ticket.name}`}>&times;</button>
                                <button onClick={() => onLoadTicket(ticket)} className="px-5 py-2 bg-primary text-primary-content text-sm font-semibold rounded-md hover:bg-primary-hover">Load</button>
                              </div>
                          )}
                        </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex-shrink-0 flex justify-end pt-4 mt-4 border-t border-border gap-2">
                 {isSelectionMode && (
                     <button 
                        onClick={handleMerge} 
                        disabled={selectedTicketIds.size < 2}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                     >
                         Merge ({selectedTicketIds.size})
                     </button>
                 )}
                 <button onClick={onClose} className="px-6 py-2 bg-surface-muted text-text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Close</button>
            </div>
          </div>
        </div>
      );
}

export default OpenTicketsModal;