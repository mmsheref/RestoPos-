
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { OrderItem, SavedTicket } from '../../types';
import { ThreeDotsIcon, TrashIcon, ArrowLeftIcon } from '../../constants';
import { useAppContext } from '../../context/AppContext';

// --- Helper Component: Swipeable Item Row ---
interface SwipeableOrderItemProps {
    item: OrderItem;
    editingQuantityItemId: string | null;
    tempQuantity: string;
    onQuantityClick: (item: OrderItem) => void;
    onQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onQuantityCommit: () => void;
    onQuantityKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onIncrement: (id: string, qty: number) => void;
    onDecrement: (id: string) => void;
    onDelete: (id: string) => void;
}

const SwipeableOrderItem: React.FC<SwipeableOrderItemProps> = ({
    item, editingQuantityItemId, tempQuantity,
    onQuantityClick, onQuantityChange, onQuantityCommit, onQuantityKeyDown,
    onIncrement, onDecrement, onDelete
}) => {
    const [offset, setOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const startX = useRef(0);
    const currentOffset = useRef(0);
    const isOpen = offset < -60; // Threshold to consider "open"

    // Handlers for Touch
    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        // Don't start swipe if editing quantity
        if (editingQuantityItemId === item.lineItemId) return;
        
        setIsSwiping(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        startX.current = clientX;
        currentOffset.current = offset;
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isSwiping) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const diff = clientX - startX.current;
        
        // Calculate new offset (clamped)
        // We only allow swiping left (negative offset) up to -100px
        let newOffset = currentOffset.current + diff;
        if (newOffset > 0) newOffset = 0; // Can't swipe right past 0
        if (newOffset < -100) newOffset = -100; // Max swipe width

        setOffset(newOffset);
    };

    const handleTouchEnd = () => {
        setIsSwiping(false);
        // Snap logic
        if (offset < -40) {
            setOffset(-80); // Snap open (reveal width)
        } else {
            setOffset(0); // Snap closed
        }
    };

    // Close on click if open
    const handleContentClick = () => {
        if (isOpen) setOffset(0);
    };

    return (
        <li className="relative border-b border-border overflow-hidden h-[72px] select-none">
            {/* Background Action Layer (Delete) */}
            <div className="absolute inset-0 flex justify-end bg-red-600">
                <button
                    onClick={() => onDelete(item.lineItemId)}
                    className="w-[80px] h-full flex flex-col items-center justify-center text-white active:bg-red-700 transition-colors"
                >
                    <TrashIcon className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Delete</span>
                </button>
            </div>

            {/* Foreground Content Layer */}
            <div 
                className="absolute inset-0 bg-surface flex items-center px-4 py-3 transition-transform duration-200 ease-out"
                style={{ transform: `translateX(${offset}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onClick={handleContentClick}
            >
                {/* Item Details */}
                <div className="flex-grow min-w-0 pr-2 pointer-events-none">
                    <p className="font-semibold text-text-primary truncate">{item.name}</p>
                    <p className="text-text-secondary text-xs">{item.price.toFixed(2)}</p>
                </div>

                {/* Quantity Controls - Stop Propagation to prevent swipe when clicking buttons */}
                <div className="flex items-center justify-center gap-3 mx-2" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                    <button 
                        onClick={() => onDecrement(item.lineItemId)} 
                        className="h-8 w-8 flex items-center justify-center bg-surface-muted text-lg rounded-full text-text-secondary active:bg-red-200 dark:active:bg-red-500/50 active:text-red-700 transition-colors focus:outline-none touch-manipulation border border-border" 
                        aria-label="Decrease quantity"
                    >
                        -
                    </button>
                    
                    {editingQuantityItemId === item.lineItemId ? (
                        <input 
                            type="tel" 
                            value={tempQuantity} 
                            onChange={onQuantityChange} 
                            onBlur={onQuantityCommit} 
                            onKeyDown={onQuantityKeyDown} 
                            className="font-mono w-12 text-center text-lg text-text-primary bg-background border border-primary rounded-md ring-1 ring-primary p-1" 
                            autoFocus 
                            onFocus={(e) => e.target.select()} 
                        />
                    ) : (
                        <span 
                            onClick={() => onQuantityClick(item)} 
                            className="font-mono w-8 text-center text-lg text-text-primary cursor-pointer active:scale-95 transition-transform"
                        >
                            {item.quantity}
                        </span>
                    )}
                    
                    <button 
                        onClick={() => onIncrement(item.lineItemId, item.quantity + 1)} 
                        className="h-8 w-8 flex items-center justify-center bg-surface-muted text-lg rounded-full text-text-secondary active:bg-green-200 dark:active:bg-green-500/50 active:text-green-700 transition-colors focus:outline-none touch-manipulation border border-border" 
                        aria-label="Increase quantity"
                    >
                        +
                    </button>
                </div>

                {/* Total Price */}
                <div className="w-16 text-right pointer-events-none">
                    <p className="font-bold text-text-primary">{(item.price * item.quantity).toFixed(2)}</p>
                </div>
            </div>
            
            {/* Visual indicator for "Swipe left" if not swiped */}
            {!isOpen && !isSwiping && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-black/5 to-transparent pointer-events-none md:hidden"></div>
            )}
        </li>
    );
};


interface TicketProps {
    className?: string;
    onClose?: () => void;
    // Data
    currentOrder: OrderItem[];
    editingTicket: SavedTicket | null;
    savedTickets: SavedTicket[];
    settings: { taxEnabled: boolean; taxRate: number };
    total: number;
    subtotal: number;
    tax: number;
    printers: any[];

    // State & Handlers for Quantity
    editingQuantityItemId: string | null;
    tempQuantity: string;
    setEditingQuantityItemId: (id: string | null) => void;
    setTempQuantity: (qty: string) => void;
    removeFromOrder: (lineItemId: string) => void;
    deleteLineItem: (lineItemId: string) => void;
    updateOrderItemQuantity: (lineItemId: string, newQuantity: number) => void;
    handleQuantityClick: (item: OrderItem) => void;
    handleQuantityChangeCommit: () => void;
    handleQuantityInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleQuantityInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

    // Main Actions
    handlePrimarySaveAction: () => void;
    onCharge: () => void;
    onOpenTickets: () => void;
    onSaveTicket: () => void;
    onClearTicket: () => void;
    onPrintRequest: () => void; // Added Prop for print workflow
}

const Ticket: React.FC<TicketProps> = (props) => {
  const {
    className, onClose,
    currentOrder, editingTicket, savedTickets, settings, total, subtotal, tax, printers,
    editingQuantityItemId, tempQuantity, setEditingQuantityItemId, setTempQuantity, 
    removeFromOrder, deleteLineItem, updateOrderItemQuantity,
    handleQuantityClick, handleQuantityChangeCommit, handleQuantityInputChange, handleQuantityInputKeyDown,
    handlePrimarySaveAction, onCharge, onOpenTickets, onSaveTicket, onClearTicket, onPrintRequest
  } = props;
  
  const [isTicketMenuOpen, setTicketMenuOpen] = useState(false);
  const [isClearConfirmVisible, setIsClearConfirmVisible] = useState(false);
  const ticketMenuRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const prevOrderLength = useRef(currentOrder.length);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (ticketMenuRef.current && !ticketMenuRef.current.contains(event.target as Node)) {
            setTicketMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  useEffect(() => {
    if (isClearConfirmVisible) {
        setTicketMenuOpen(false);
    }
  }, [isClearConfirmVisible]);

  useEffect(() => {
    if (listContainerRef.current && currentOrder.length > prevOrderLength.current) {
        const container = listContainerRef.current;
        setTimeout(() => {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }, 0);
    }
    prevOrderLength.current = currentOrder.length;
  }, [currentOrder]);


  const handleTicketAction = async (action: string) => {
    setTicketMenuOpen(false);
    switch (action) {
      case 'clear':
        if (currentOrder.length === 0 && !editingTicket) return;
        setIsClearConfirmVisible(true);
        break;
      
      case 'print':
        if (currentOrder.length === 0) {
           alert("Ticket is empty. Nothing to print.");
           return;
        }
        // Instead of printing directly, we now request a print from the parent component
        // This allows the parent to enforce "Save before Print" logic.
        onPrintRequest();
        break;

      case 'edit':
        if (currentOrder.length === 0 && !editingTicket) {
           alert("No ticket to edit.");
           return;
        }
        onSaveTicket();
        break;
      default:
        alert(`Feature '${action}' is coming soon!`);
        break;
    }
  };
  
  const handleConfirmClear = () => {
    onClearTicket();
    setIsClearConfirmVisible(false);
  };

  const renderActionButtons = () => {
    if (currentOrder.length > 0) {
      return (
        <button 
          onClick={handlePrimarySaveAction}
          className="w-full bg-primary text-primary-content font-bold py-4 rounded-lg transition-colors text-lg shadow-md hover:bg-primary-hover active:scale-[0.98]"
        >
          {editingTicket ? 'Update' : 'Save'}
        </button>
      );
    }
    if (savedTickets.length > 0) {
      return (
        <button 
          onClick={onOpenTickets}
          className="w-full bg-amber-500 text-white font-bold py-4 rounded-lg transition-colors text-lg shadow-md hover:bg-amber-600 active:scale-[0.98]"
        >
          Open Tickets ({savedTickets.length})
        </button>
      );
    }
    return (
      <button 
        disabled
        className="w-full bg-gray-300 dark:bg-gray-600 text-white dark:text-gray-400 font-bold py-4 rounded-lg text-lg cursor-not-allowed shadow-none"
      >
        Save
      </button>
    );
  };
  
  const ticketHeaderTitle = useMemo(() => {
    if (editingTicket) return `Ticket: ${editingTicket.name}`;
    if (currentOrder.length > 0) return 'Current Order';
    return 'New Order';
  }, [editingTicket, currentOrder.length]);

  return (
    <section className={`${className} bg-surface border-l border-border h-full`}>
      <header className="bg-surface shadow-sm w-full z-30 flex-shrink-0 h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2">
            {onClose && (
                <button onClick={onClose} className="md:hidden p-2 -ml-2 text-text-secondary">
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
            )}
            <h1 className="text-xl font-semibold text-text-primary">{ticketHeaderTitle}</h1>
        </div>
        <div className="relative" ref={ticketMenuRef}>
            <button onClick={() => setTicketMenuOpen(prev => !prev)} className="p-2 text-text-secondary hover:text-text-primary" aria-label="Ticket options">
              <ThreeDotsIcon className="h-5 w-5" />
            </button>
            {isTicketMenuOpen && (
                <div
                    className="absolute right-0 mt-2 w-56 bg-surface rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-white/10 z-20"
                >
                    <div className="py-1">
                        <button onClick={() => handleTicketAction('clear')} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-muted">Clear Ticket</button>
                        <button onClick={() => handleTicketAction('print')} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-muted">
                          Print Bill
                        </button>
                        <button onClick={() => handleTicketAction('edit')} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-muted">Edit Ticket Details</button>
                    </div>
                </div>
            )}
          </div>
      </header>
      
      {/* Scrollable Area: Items + Sticky Totals */}
      <div ref={listContainerRef} className="flex-1 overflow-y-auto flex flex-col relative">
          {isClearConfirmVisible ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <TrashIcon className="h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-bold text-text-primary">Clear Current Order?</h3>
              <p className="text-sm text-text-secondary mt-1 mb-6">This action cannot be undone.</p>
              <div className="flex gap-4">
                  <button onClick={() => setIsClearConfirmVisible(false)} className="px-6 py-2 bg-surface-muted text-text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold">
                      Cancel
                  </button>
                  <button onClick={handleConfirmClear} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 shadow-md">
                      Yes, Clear
                  </button>
              </div>
            </div>
          ) : currentOrder.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h6" /><path d="M12 14v-4" /></svg>
              <p className="mt-4 font-medium">Your order is empty</p>
            </div>
          ) : (
            <>
                {/* List Items */}
                <div className="pb-2">
                    <ul className="overflow-x-hidden">
                    {currentOrder.map(item => (
                        <SwipeableOrderItem
                            key={item.lineItemId}
                            item={item}
                            editingQuantityItemId={editingQuantityItemId}
                            tempQuantity={tempQuantity}
                            onQuantityClick={handleQuantityClick}
                            onQuantityChange={handleQuantityInputChange}
                            onQuantityCommit={handleQuantityChangeCommit}
                            onQuantityKeyDown={handleQuantityInputKeyDown}
                            onIncrement={updateOrderItemQuantity}
                            onDecrement={removeFromOrder}
                            onDelete={deleteLineItem}
                        />
                    ))}
                    </ul>
                </div>

                {/* Sticky Totals Section */}
                <div className="sticky bottom-0 bg-surface/95 backdrop-blur-sm border-t border-border p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                    <div className="space-y-2 text-sm">
                        {settings.taxEnabled && (
                            <>
                                <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between text-text-secondary"><span>GST ({settings.taxRate}%)</span><span>{tax.toFixed(2)}</span></div>
                            </>
                        )}
                        <div className={`flex justify-between font-bold text-xl text-text-primary ${settings.taxEnabled ? 'pt-2 border-t mt-2 border-border' : ''}`}>
                            <span>Total</span><span>{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </>
          )}
      </div>

      {/* Action Buttons Footer - Always Fixed */}
      <div className="p-4 border-t border-border bg-surface z-20">
          <div className={`flex items-center gap-4 ${isClearConfirmVisible ? 'opacity-50 pointer-events-none' : ''}`}>
            {renderActionButtons()}
            <button onClick={onCharge} disabled={currentOrder.length === 0} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-lg transition-colors text-lg shadow-md hover:bg-emerald-600 active:scale-[0.98] disabled:bg-gray-300 disabled:dark:bg-gray-600 disabled:dark:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex justify-center items-center">
              Charge
            </button>
          </div>
      </div>
    </section>
  );
};

export default Ticket;
