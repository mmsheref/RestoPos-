
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { OrderItem, PaymentType, SplitPaymentDetail } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { printReceipt } from '../../utils/printerHelper';
import { UserIcon, ArrowLeftIcon, CheckIcon, PrintIcon, AnimatedCheckIcon, PaymentMethodIcon, ItemsIcon, SplitIcon, PlusIcon, TrashIcon, CloseIcon } from '../../constants';

// --- Sub-components to prevent re-rendering ---

interface StaticTicketPanelProps {
  orderItems: OrderItem[];
  settings: { taxEnabled: boolean; taxRate: number };
  subtotal: number;
  tax: number;
  total: number;
}

const StaticTicketPanel: React.FC<StaticTicketPanelProps> = ({ orderItems, settings, subtotal, tax, total }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    // Desktop View (Always Visible on Tablet/Desktop)
    const DesktopView = (
        <div className="hidden md:flex md:w-1/3 lg:w-1/4 bg-surface border-r border-border flex-col h-full flex-shrink-0">
            <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b border-border bg-surface">
                <h2 className="text-xl font-semibold text-text-primary">Order Summary</h2>
                <span className="bg-surface-muted px-2 py-1 rounded text-sm text-text-secondary font-bold">{orderItems.length} Items</span>
            </header>
            <div className="flex-1 overflow-y-auto p-4 bg-background/50">
                <ul className="space-y-3 mb-6">
                {orderItems.map(item => (
                    <li key={item.lineItemId} className="flex justify-between items-start text-sm border-b border-border/50 pb-2 last:border-0">
                        <div className="flex flex-col">
                            <span className="text-text-primary font-medium">{item.name}</span>
                            <span className="text-text-secondary text-xs">{item.quantity} x {item.price.toFixed(2)}</span>
                        </div>
                        <span className="font-mono text-text-primary font-bold">{(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                ))}
                </ul>
            </div>
            <div className="flex-shrink-0 p-4 bg-surface border-t border-border">
                <div className="space-y-2 text-sm">
                    {settings.taxEnabled && (
                        <>
                            <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-text-secondary"><span>GST ({settings.taxRate}%)</span><span>{tax.toFixed(2)}</span></div>
                        </>
                    )}
                    <div className={`flex justify-between font-bold text-xl text-text-primary ${settings.taxEnabled ? 'pt-3 mt-1 border-t border-border' : ''}`}><span>Total</span><span>{total.toFixed(2)}</span></div>
                </div>
            </div>
        </div>
    );

    // Mobile View (Collapsible)
    const MobileView = (
        <div className="md:hidden w-full bg-surface border-b border-border flex-shrink-0 z-10 shadow-sm">
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full p-4 flex justify-between items-center active:bg-surface-muted transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary">
                        <ItemsIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-semibold text-text-primary text-sm">Order Summary</span>
                        <span className="text-xs text-text-secondary">{orderItems.length} items</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-primary">₹{total.toFixed(2)}</span>
                    <span className={`text-text-muted transform transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}>▼</span>
                </div>
            </button>
            
            {!isCollapsed && (
                <div className="px-4 pb-4 animate-fadeIn bg-surface-muted/30 border-t border-border">
                     <ul className="space-y-2 py-3 max-h-48 overflow-y-auto">
                        {orderItems.map(item => (
                            <li key={item.lineItemId} className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary truncate pr-4"><span className="font-bold text-text-primary">{item.quantity}</span> x {item.name}</span>
                                <span className="font-mono text-text-primary">{(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                    {settings.taxEnabled && (
                        <div className="flex justify-between text-xs text-text-muted border-t border-border pt-2">
                            <span>Subtotal: {subtotal.toFixed(2)}</span>
                            <span>Tax: {tax.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <>
            {DesktopView}
            {MobileView}
        </>
    );
};


interface PaymentWorkspaceProps {
    onBack: () => void;
    total: number;
    otherPaymentTypes: PaymentType[];
    cashPaymentType: PaymentType | undefined;
    inputRef: React.RefObject<HTMLInputElement>;
    cashTendered: string;
    handleFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
    handleCashChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleProcessCashPayment: () => void;
    handleProcessOtherPayment: (methodName: string) => void;
    uniqueQuickCash: number[];
    onProcessPayment: (method: string, tendered: number) => void;
    onSplitClick: () => void;
}

const PaymentWorkspace: React.FC<PaymentWorkspaceProps> = ({
    onBack, total, otherPaymentTypes, cashPaymentType,
    inputRef, cashTendered, handleFocus, handleCashChange, handleProcessCashPayment, handleProcessOtherPayment,
    uniqueQuickCash, onProcessPayment, onSplitClick
}) => (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Mobile Header */}
      <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 bg-surface border-b border-border md:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-semibold">
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </button>
        <span className="font-bold text-lg">Checkout</span>
        <button 
            onClick={onSplitClick} 
            className="flex items-center gap-1 bg-surface-muted text-text-primary px-3 py-1.5 rounded-lg border border-border hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-bold uppercase tracking-wide"
        >
            <SplitIcon className="h-4 w-4" /> Split
        </button>
      </header>
      
      {/* Desktop Header */}
      <header className="hidden md:flex flex-shrink-0 h-16 items-center justify-between px-6 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-semibold px-3 py-1.5 rounded-lg hover:bg-surface-muted transition-colors">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Sales
            </button>
            <button 
                onClick={onSplitClick} 
                className="flex items-center gap-2 bg-white dark:bg-gray-800 text-text-primary px-4 py-2 rounded-lg border border-border hover:border-primary/50 hover:text-primary transition-all shadow-sm font-bold text-sm"
            >
                <SplitIcon className="h-4 w-4" />
                SPLIT PAYMENT
            </button>
        </div>
        <div className="flex items-center gap-2">
             <UserIcon className="h-5 w-5 text-text-muted" />
             <span className="text-sm text-text-secondary">Cashier</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
            {/* Total Display */}
            <div className="mb-6 text-center py-1">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1 font-bold">Total Payable Amount</p>
                <div className="flex items-baseline justify-center gap-1 text-5xl md:text-7xl font-bold font-mono text-text-primary tracking-tight">
                    <span className="text-3xl md:text-5xl text-text-muted font-normal">₹</span>
                    {total.toFixed(2)}
                </div>
            </div>

            <div className="w-full space-y-6">
                {/* 1. Other Methods Grid - MOVED TO TOP */}
                <div>
                     <div className="grid grid-cols-1 gap-3">
                        {otherPaymentTypes.map(pt => (
                            <button 
                            key={pt.id} 
                            onClick={() => handleProcessOtherPayment(pt.name)} 
                            className="bg-emerald-500 text-white font-bold rounded-xl shadow-md hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95 py-4 w-full"
                            >
                            <PaymentMethodIcon iconName={pt.icon} className="h-6 w-6 text-white/90"/>
                            <span>{pt.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                {cashPaymentType && otherPaymentTypes.length > 0 && (
                    <div className="flex items-center gap-4">
                        <hr className="flex-grow border-border" />
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">OR</span>
                        <hr className="flex-grow border-border" />
                    </div>
                )}

                {/* 2. Cash Section - MOVED TO BOTTOM */}
                {cashPaymentType && (
                    <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
                        <label className="block text-sm font-bold text-text-secondary mb-2">Cash Payment</label>
                        <div className="flex flex-col md:flex-row items-stretch gap-3 mb-3">
                            <div className="relative flex-grow">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xl">₹</span>
                                <input 
                                    ref={inputRef} 
                                    type="text" 
                                    inputMode="decimal" 
                                    value={cashTendered} 
                                    onFocus={handleFocus} 
                                    onChange={handleCashChange} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleProcessCashPayment()} 
                                    className="w-full pl-10 pr-4 py-4 text-3xl font-mono font-bold bg-surface-muted rounded-xl border-2 border-transparent focus:border-emerald-500 focus:bg-surface focus:ring-0 transition-all text-right" 
                                    placeholder="0.00"
                                />
                            </div>
                            <button 
                                onClick={handleProcessCashPayment} 
                                className="px-8 py-4 bg-emerald-500 text-white font-bold text-lg rounded-xl shadow hover:bg-emerald-600 active:bg-emerald-700 transition-colors md:w-auto w-full flex-shrink-0"
                            >
                                Pay Cash
                            </button>
                        </div>
                        
                        {/* Quick Cash Suggestions */}
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar md:grid md:grid-cols-6">
                            {uniqueQuickCash.map(amount => (
                                <button 
                                    key={amount} 
                                    onClick={() => onProcessPayment(cashPaymentType.name, amount)} 
                                    className="flex-shrink-0 md:flex-shrink py-3 px-4 md:px-0 bg-surface-muted text-text-secondary font-bold rounded-lg hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 border border-transparent hover:border-emerald-200 transition-colors"
                                >
                                    ₹{amount}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
);

// --- SPLIT PAYMENT WORKSPACE ---

interface SplitPaymentWorkspaceProps {
    total: number;
    paymentTypes: PaymentType[];
    onBack: () => void;
    onComplete: (details: SplitPaymentDetail[]) => void;
}

const SplitPaymentWorkspace: React.FC<SplitPaymentWorkspaceProps> = ({ total, paymentTypes, onBack, onComplete }) => {
    const [rows, setRows] = useState<SplitPaymentDetail[]>([]);

    // Initial Setup: One row with full amount
    // Using dependency on paymentTypes to re-init if they load, but we rely on the parent
    // to pass a stable or memoized array to prevent infinite loops.
    useEffect(() => {
        // Safe default method selection
        const defaultMethod = paymentTypes.length > 0 ? paymentTypes[0].name : 'Cash';
        setRows([{ method: defaultMethod, amount: total }]);
    }, [total, paymentTypes]);

    const totalEntered = useMemo(() => {
        return rows.reduce((sum, row) => sum + (row.amount || 0), 0);
    }, [rows]);

    // Use epsilon for float comparison safety
    const remaining = parseFloat((total - totalEntered).toFixed(2));
    const isValid = Math.abs(remaining) < 0.01 && rows.every(r => r.amount > 0 && r.method);

    const handleRowChange = (index: number, field: keyof SplitPaymentDetail, value: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const handleRemoveRow = (index: number) => {
        setRows(rows.filter((_, i) => i !== index));
    };

    const handleAddRemaining = () => {
        if (remaining <= 0) return;
        
        // Smart method selection: try to pick one that hasn't been used yet
        const usedMethods = new Set(rows.map(r => r.method));
        const availableMethods = paymentTypes.map(pt => pt.name);
        const nextMethod = availableMethods.find(m => !usedMethods.has(m)) || availableMethods[0] || 'Cash';
        
        setRows([...rows, { method: nextMethod, amount: remaining }]);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background relative">
            {/* Header */}
            <header className="flex-shrink-0 h-16 flex items-center px-4 md:px-6 bg-surface border-b border-border">
                <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-semibold mr-4">
                    <ArrowLeftIcon className="h-5 w-5" />
                    <span className="hidden md:inline">Cancel Split</span>
                </button>
                <h2 className="text-xl font-bold text-text-primary flex-grow">Split Payment</h2>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    
                    {/* Remaining Balance Hero */}
                    <div className={`p-6 rounded-2xl border-2 text-center transition-colors ${Math.abs(remaining) < 0.01 ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-surface border-red-500'}`}>
                        <p className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-1">Remaining Balance</p>
                        <div className={`text-5xl md:text-6xl font-mono font-bold ${Math.abs(remaining) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                            ₹{remaining.toFixed(2)}
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="space-y-3">
                        {rows.map((row, index) => (
                            <div key={index} className="flex gap-3 items-center bg-surface p-3 rounded-xl border border-border shadow-sm">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-text-muted mb-1 ml-1">Method</label>
                                    <select
                                        value={row.method}
                                        onChange={(e) => handleRowChange(index, 'method', e.target.value)}
                                        className="w-full p-3 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary font-medium"
                                    >
                                        {paymentTypes.filter(pt => pt.enabled).map(pt => (
                                            <option key={pt.id} value={pt.name}>{pt.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-40">
                                    <label className="block text-xs font-bold text-text-muted mb-1 ml-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">₹</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={row.amount}
                                            onChange={(e) => handleRowChange(index, 'amount', parseFloat(e.target.value) || 0)}
                                            className="w-full p-3 pl-7 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary font-mono text-right font-bold"
                                        />
                                    </div>
                                </div>
                                {rows.length > 1 && (
                                    <div className="pt-5">
                                        <button 
                                            onClick={() => handleRemoveRow(index)}
                                            className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Remove Payment"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add Remaining Shortcut */}
                    {remaining > 0.01 && (
                        <button
                            onClick={handleAddRemaining}
                            className="w-full py-4 border-2 border-dashed border-primary/30 text-primary rounded-xl hover:bg-primary/5 flex items-center justify-center gap-2 font-bold transition-colors"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add Remaining Amount (₹{remaining.toFixed(2)})
                        </button>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-border bg-surface z-20 pb-safe-bottom">
                <div className="max-w-2xl mx-auto flex gap-4">
                    <button 
                        onClick={onBack} 
                        className="flex-1 py-4 bg-surface-muted text-text-secondary font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => isValid && onComplete(rows)}
                        disabled={!isValid}
                        className="flex-[2] py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        <CheckIcon className="h-5 w-5" />
                        Complete Transaction
                    </button>
                </div>
            </div>
        </div>
    );
};


interface ChangeWorkspaceProps {
    paymentResult: { method: string, change: number, receiptId: string, date: Date };
    total: number;
    isPrinting: boolean;
    handlePrintReceipt: () => void;
    onNewSale: () => void;
}

const ChangeWorkspace: React.FC<ChangeWorkspaceProps> = ({ paymentResult, total, isPrinting, handlePrintReceipt, onNewSale }) => {
    const change = paymentResult.change || 0;
    const amountTendered = total + change;
    
    return (
        <div className="flex-1 flex flex-col h-full bg-background relative">
            {/* Header */}
            <header className="flex-shrink-0 h-16 flex items-center justify-center md:justify-start px-4 md:px-6 bg-surface border-b border-border">
                 <h2 className="text-xl font-bold text-text-primary">Transaction Complete</h2>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-full space-y-8 min-h-[400px]">
                    {/* Success Icon & Message */}
                    <div className="text-center">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-fadeIn">
                            <AnimatedCheckIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-text-primary mb-2">Payment Successful</h2>
                        <p className="text-text-secondary font-mono">Receipt #{paymentResult.receiptId.slice(-4)}</p>
                    </div>

                    {/* Change Hero */}
                    {paymentResult.method === 'Cash' && change > 0 && (
                        <div className="text-center py-6 px-10 bg-surface-muted/50 rounded-2xl w-full border border-border">
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Change Due</p>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-3xl font-bold text-emerald-600/70 dark:text-emerald-400/70">₹</span>
                                <span className="text-6xl md:text-7xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{change.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Details Grid */}
                    <div className="w-full bg-surface rounded-xl border border-border p-6 shadow-sm">
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-4 border-b border-border pb-2">Transaction Details</h3>
                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                            <div className="text-text-secondary">Total Amount</div>
                            <div className="text-right font-bold text-text-primary">₹{total.toFixed(2)}</div>

                            <div className="text-text-secondary">{paymentResult.method === 'Cash' ? 'Cash Tendered' : 'Payment Method'}</div>
                            <div className="text-right font-medium text-text-primary">{paymentResult.method === 'Cash' ? `₹${amountTendered.toFixed(2)}` : paymentResult.method}</div>

                            <div className="text-text-secondary">Date & Time</div>
                            <div className="text-right text-text-primary">{paymentResult.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-border bg-surface z-20 pb-safe-bottom">
                <div className="flex gap-4 max-w-3xl mx-auto">
                    <button
                        onClick={handlePrintReceipt}
                        disabled={isPrinting}
                        className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-border text-text-primary font-bold rounded-xl hover:bg-surface-muted transition-colors disabled:opacity-50 text-lg active:scale-[0.98]"
                    >
                        <PrintIcon className="h-6 w-6" />
                        {isPrinting ? 'Printing...' : 'Print Receipt'}
                    </button>
                    <button
                        onClick={onNewSale}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-primary-content font-bold text-lg rounded-xl hover:bg-primary-hover shadow-lg active:scale-[0.98] transition-all"
                    >
                        <CheckIcon className="h-6 w-6" />
                        New Sale
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---

interface ChargeScreenProps {
  orderItems: OrderItem[];
  total: number;
  tax: number;
  subtotal: number;
  onBack: () => void;
  onProcessPayment: (method: string, tendered: number, splitDetails?: SplitPaymentDetail[]) => void;
  onNewSale: () => void;
  paymentResult: { method: string, change: number, receiptId: string, date: Date } | null;
}

const ChargeScreen: React.FC<ChargeScreenProps> = ({ orderItems, total, tax, subtotal, onBack, onProcessPayment, onNewSale, paymentResult }) => {
  const { settings, printers, paymentTypes } = useAppContext();
  const [cashTendered, setCashTendered] = useState(total.toFixed(2));
  const [isPrinting, setIsPrinting] = useState(false);
  
  // View State: 'standard' | 'split'
  const [viewMode, setViewMode] = useState<'standard' | 'split'>('standard');

  const hasBeenFocused = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const cashPaymentType = useMemo(() => {
    const config = paymentTypes.find(p => p.id === 'cash');
    if (config && !config.enabled) {
      return undefined;
    }
    if (config) {
      return config;
    }
    return {
      id: 'cash',
      name: 'Cash',
      icon: 'cash',
      type: 'cash',
      enabled: true,
    } as PaymentType;
  }, [paymentTypes]);

  const otherPaymentTypes = useMemo(() => paymentTypes.filter(p => p.id !== 'cash' && p.enabled), [paymentTypes]);

  // FIX: Memoize the combined list passed to the Split Workspace to prevent infinite re-renders/resets
  const splitPaymentTypes = useMemo(() => {
      return [...(cashPaymentType ? [cashPaymentType] : []), ...otherPaymentTypes];
  }, [cashPaymentType, otherPaymentTypes]);


  const uniqueQuickCash = useMemo(() => {
    // Standard currency denominations to use as a base.
    const denominations = [10, 20, 50, 100, 200, 500, 2000];
    const suggestions = new Set<number>();

    // 1. Add the next available currency notes that are greater than the total.
    denominations.forEach(denom => {
      if (denom > total) {
        suggestions.add(denom);
      }
    });

    // 2. Add suggestions by rounding up to the nearest 10s and 100s.
    suggestions.add(Math.ceil(total / 10) * 10);
    suggestions.add(Math.ceil(total / 100) * 100);

    // 3. Process, filter, sort, and limit the suggestions.
    const finalSuggestions = Array.from(suggestions)
      // Filter out any suggestion that is not strictly greater than the total.
      // This handles cases where the total is an exact multiple of 10 or 100.
      .filter(amount => amount > total)
      .sort((a, b) => a - b);

    return finalSuggestions.slice(0, 6);
  }, [total]);
    
  useEffect(() => {
    setCashTendered(total.toFixed(2));
    hasBeenFocused.current = false;
  }, [total]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!hasBeenFocused.current) {
        e.target.select();
        hasBeenFocused.current = true;
    }
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value === '' || /^\d*\.?\d{0,2}$/.test(e.target.value)) {
          setCashTendered(e.target.value);
      }
  };

  const handleProcessCashPayment = () => {
      if (!cashPaymentType) return;
      onProcessPayment(cashPaymentType.name, parseFloat(cashTendered) || 0);
  };
  
  const handleProcessOtherPayment = (methodName: string) => {
      onProcessPayment(methodName, total);
  };

  const handlePrintReceipt = async () => {
    if (!paymentResult || isPrinting) return;
    setIsPrinting(true);
    const printer = printers.find(p => p.interfaceType === 'Bluetooth') || printers[0];
    const result = await printReceipt({ items: orderItems, total, subtotal, tax, receiptId: paymentResult.receiptId, paymentMethod: paymentResult.method, settings, printer, date: paymentResult.date });
    setIsPrinting(false);
    if (!result.success) alert(`Print Failed: ${result.message}`);
  };
  
  const handleSplitConfirm = (details: SplitPaymentDetail[]) => {
      const methodString = `Split (${details.map(d => d.method).join(', ')})`;
      onProcessPayment(methodString, total, details);
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-background overflow-hidden">
      {/* Always render StaticTicketPanel for split view consistency */}
      <StaticTicketPanel 
        orderItems={orderItems} 
        settings={settings}
        subtotal={subtotal}
        tax={tax}
        total={total}
      />
      
      <div className="flex-1 flex flex-col h-full min-w-0">
        {paymentResult ? (
          <ChangeWorkspace 
            paymentResult={paymentResult}
            total={total}
            isPrinting={isPrinting}
            handlePrintReceipt={handlePrintReceipt}
            onNewSale={onNewSale}
          />
        ) : viewMode === 'split' ? (
            <SplitPaymentWorkspace 
                total={total}
                paymentTypes={splitPaymentTypes} 
                onBack={() => setViewMode('standard')}
                onComplete={handleSplitConfirm}
            />
        ) : (
            <PaymentWorkspace
                onBack={onBack}
                total={total}
                otherPaymentTypes={otherPaymentTypes}
                cashPaymentType={cashPaymentType}
                inputRef={inputRef}
                cashTendered={cashTendered}
                handleFocus={handleFocus}
                handleCashChange={handleCashChange}
                handleProcessCashPayment={handleProcessCashPayment}
                handleProcessOtherPayment={handleProcessOtherPayment}
                uniqueQuickCash={uniqueQuickCash}
                onProcessPayment={onProcessPayment}
                onSplitClick={() => setViewMode('split')}
            />
        )}
      </div>
    </div>
  );
};

export default ChargeScreen;
