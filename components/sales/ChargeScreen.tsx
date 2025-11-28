
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { OrderItem, PaymentType } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { printReceipt } from '../../utils/printerHelper';
import { UserIcon, ArrowLeftIcon, SplitIcon, CheckIcon, PrintIcon, MailIcon, AnimatedCheckIcon, PaymentMethodIcon, ItemsIcon } from '../../constants';

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
                    <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
                    {settings.taxEnabled && <div className="flex justify-between text-text-secondary"><span>GST ({settings.taxRate}%)</span><span>{tax.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold text-xl text-text-primary pt-3 mt-1 border-t border-border"><span>Total</span><span>{total.toFixed(2)}</span></div>
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
                    <div className="flex justify-between text-xs text-text-muted border-t border-border pt-2">
                        <span>Subtotal: {subtotal.toFixed(2)}</span>
                        <span>Tax: {tax.toFixed(2)}</span>
                    </div>
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
}

const PaymentWorkspace: React.FC<PaymentWorkspaceProps> = ({
    onBack, total, otherPaymentTypes, cashPaymentType,
    inputRef, cashTendered, handleFocus, handleCashChange, handleProcessCashPayment, handleProcessOtherPayment,
    uniqueQuickCash, onProcessPayment
}) => (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Mobile Header */}
      <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 bg-surface border-b border-border md:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-semibold">
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </button>
        <span className="font-bold text-lg">Checkout</span>
        <div className="w-8"></div> {/* Spacer */}
      </header>
      
      {/* Desktop Header */}
      <header className="hidden md:flex flex-shrink-0 h-16 items-center justify-between px-6 border-b border-border bg-surface">
        <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-semibold px-3 py-1.5 rounded-lg hover:bg-surface-muted transition-colors">
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Sales
        </button>
        <div className="flex items-center gap-2">
             <UserIcon className="h-5 w-5 text-text-muted" />
             <span className="text-sm text-text-secondary">Cashier</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
            {/* Total Display */}
            <div className="mb-8 text-center py-6">
                <p className="text-sm text-text-muted uppercase tracking-wider mb-2 font-bold">Total Payable Amount</p>
                <h1 className="text-5xl md:text-7xl font-bold font-mono text-text-primary tracking-tight">₹{total.toFixed(2)}</h1>
            </div>

            <div className="w-full space-y-6">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {/* Split Button */}
                <button 
                    onClick={() => alert("Split Payment feature coming soon")} 
                    className="p-4 bg-surface border-2 border-primary/20 text-primary font-bold rounded-xl shadow-sm hover:shadow-md hover:bg-primary/5 hover:border-primary transition-all flex flex-col items-center justify-center gap-2 active:scale-95 aspect-[4/3] md:aspect-auto md:h-28"
                >
                    <SplitIcon className="h-8 w-8"/>
                    <span>Split Bill</span>
                </button>

                {otherPaymentTypes.map(pt => (
                    <button 
                    key={pt.id} 
                    onClick={() => handleProcessOtherPayment(pt.name)} 
                    className="p-4 bg-primary text-primary-content font-bold rounded-xl shadow-sm hover:shadow-md hover:bg-primary-hover transition-all flex flex-col items-center justify-center gap-2 active:scale-95 aspect-[4/3] md:aspect-auto md:h-28"
                    >
                    <PaymentMethodIcon iconName={pt.icon} className="h-8 w-8"/>
                    <span>{pt.name}</span>
                    </button>
                ))}
            </div>
            
            {/* Cash Section */}
            {cashPaymentType && (
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                        <PaymentMethodIcon iconName="cash" className="h-5 w-5 text-emerald-500" />
                        Cash Payment
                    </h3>
                    
                    <div className="flex flex-col md:flex-row items-stretch gap-4 mb-4">
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
                            className="px-8 py-4 bg-emerald-500 text-white font-bold text-lg rounded-xl shadow hover:bg-emerald-600 active:bg-emerald-700 transition-colors md:w-auto w-full"
                        >
                            Pay Cash
                        </button>
                    </div>
                    
                    {/* Quick Cash Suggestions */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {uniqueQuickCash.map(amount => (
                            <button 
                                key={amount} 
                                onClick={() => onProcessPayment(cashPaymentType.name, amount)} 
                                className="py-3 bg-surface-muted text-text-secondary font-bold rounded-lg hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 border border-transparent hover:border-emerald-200 transition-colors"
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
        <div className="flex-1 flex flex-col justify-center items-center p-6 bg-background">
            <div className="w-full max-w-sm bg-surface rounded-2xl shadow-xl p-8 text-center animate-fadeIn border border-border">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AnimatedCheckIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-text-primary mb-1">Payment Successful</h2>
                <p className="text-text-muted text-sm mb-6">Receipt #{paymentResult.receiptId.slice(-4)}</p>
                
                <div className="bg-surface-muted rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Total Amount</span>
                        <span className="font-bold text-text-primary">₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">{paymentResult.method === 'Cash' ? 'Cash Tendered' : 'Paid Via'}</span>
                        <span className="font-bold text-text-primary">{paymentResult.method === 'Cash' ? `₹${amountTendered.toFixed(2)}` : paymentResult.method}</span>
                    </div>
                    {paymentResult.method === 'Cash' && change > 0 && (
                        <div className="border-t border-border pt-3 mt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Change Due</span>
                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{change.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <button onClick={handlePrintReceipt} disabled={isPrinting} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-border text-text-primary font-bold rounded-xl hover:bg-surface-muted transition-colors disabled:opacity-50">
                        <PrintIcon className="h-5 w-5" /> {isPrinting ? 'Printing...' : 'Print Receipt'}
                    </button>
                    <button onClick={onNewSale} className="w-full flex items-center justify-center gap-2 p-4 bg-primary text-primary-content font-bold text-lg rounded-xl hover:bg-primary-hover shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98]">
                        <CheckIcon className="h-6 w-6" /> New Sale
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
  onProcessPayment: (method: string, tendered: number) => void;
  onNewSale: () => void;
  paymentResult: { method: string, change: number, receiptId: string, date: Date } | null;
}

const ChargeScreen: React.FC<ChargeScreenProps> = ({ orderItems, total, tax, subtotal, onBack, onProcessPayment, onNewSale, paymentResult }) => {
  const { settings, printers, paymentTypes } = useAppContext();
  const [cashTendered, setCashTendered] = useState(total.toFixed(2));
  const [isPrinting, setIsPrinting] = useState(false);
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


  const uniqueQuickCash = useMemo(() => {
    const suggestions = new Set<number>();
    
    // Add logical next denominations
    suggestions.add(Math.ceil(total / 10) * 10);
    suggestions.add(Math.ceil(total / 50) * 50);
    suggestions.add(Math.ceil(total / 100) * 100);
    suggestions.add(Math.ceil(total / 500) * 500);

    // Filter out values smaller than total and sort
    const validSuggestions = Array.from(suggestions)
        .filter(amount => amount >= total)
        .sort((a, b) => a - b);
    
    return validSuggestions.slice(0, 6);
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
  
  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-background overflow-hidden">
      {!paymentResult && (
          <StaticTicketPanel 
            orderItems={orderItems} 
            settings={settings}
            subtotal={subtotal}
            tax={tax}
            total={total}
          />
      )}
      
      <div className="flex-1 flex flex-col h-full min-w-0">
        {paymentResult ? (
          <ChangeWorkspace 
            paymentResult={paymentResult}
            total={total}
            isPrinting={isPrinting}
            handlePrintReceipt={handlePrintReceipt}
            onNewSale={onNewSale}
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
          />
        )}
      </div>
    </div>
  );
};

export default ChargeScreen;
