
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { OrderItem, PaymentType } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { printReceipt } from '../../utils/printerHelper';
import { UserIcon, ArrowLeftIcon, CheckIcon, PrintIcon, AnimatedCheckIcon, PaymentMethodIcon, ItemsIcon } from '../../constants';

// --- Sub-components to prevent re-rendering ---

interface StaticTicketPanelProps {
  orderItems: OrderItem[];
  settings: { taxEnabled: boolean; taxRate: number };
  subtotal: number;
  tax: number;
  total: number;
}

const StaticTicketPanel: React.FC<StaticTicketPanelProps> = ({ orderItems, settings, subtotal, tax, total }) => {
    const [isCollapsed, setIsCollapsed] = useState(true); // Default collapsed on mobile to save space
    
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
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <ItemsIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-text-primary text-sm">Order Summary</p>
                        <p className="text-xs text-text-secondary">{orderItems.length} Items &bull; Total: <span className="font-bold text-text-primary">₹{total.toFixed(2)}</span></p>
                    </div>
                </div>
                <div className={`transform transition-transform duration-200 text-text-muted ${isCollapsed ? '' : 'rotate-180'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
            </button>
            
            {!isCollapsed && (
                <div className="px-4 pb-4 border-t border-border/50 bg-background/50 max-h-64 overflow-y-auto animate-fadeIn">
                    <ul className="space-y-3 mt-3">
                        {orderItems.map(item => (
                            <li key={item.lineItemId} className="flex justify-between text-sm">
                                <span>{item.quantity} x {item.name}</span>
                                <span className="font-mono font-medium">{(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                    {settings.taxEnabled && (
                        <div className="mt-4 pt-3 border-t border-border space-y-1 text-sm text-text-secondary">
                            <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Tax</span><span>{tax.toFixed(2)}</span></div>
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

// --- Main Component ---

interface ChargeScreenProps {
  total: number;
  tax: number;
  subtotal: number;
  onBack: () => void;
  onProcessPayment: (method: string, tendered: number) => void;
  onNewSale: () => void;
  paymentResult: { method: string, change: number, receiptId: string, date: Date } | null;
  orderItems: OrderItem[];
}

const ChargeScreen: React.FC<ChargeScreenProps> = ({ 
    total, tax, subtotal, onBack, onProcessPayment, onNewSale, paymentResult, orderItems 
}) => {
  const { settings, paymentTypes, printers } = useAppContext();
  
  // --- Payment Input State ---
  const [tenderedInput, setTenderedInput] = useState('');
  
  // Calculate quick cash suggestions
  const quickCashOptions = useMemo(() => {
    const amount = Math.ceil(total);
    const options = new Set<number>();
    
    // Always add exact amount (rounded up)
    options.add(amount);

    // Add logical next denominations
    const denominations = [10, 20, 50, 100, 200, 500, 1000, 2000]; // Customize for currency
    
    // Next multiple of 10, 50, 100
    if (amount % 10 !== 0) options.add(Math.ceil(amount / 10) * 10);
    if (amount % 50 !== 0) options.add(Math.ceil(amount / 50) * 50);
    if (amount % 100 !== 0) options.add(Math.ceil(amount / 100) * 100);
    
    // Add next major bills
    denominations.forEach(denom => {
        if (denom > amount) {
            options.add(denom);
        }
    });

    // Take top 4 distinct options, sorted
    return Array.from(options).sort((a, b) => a - b).slice(0, 4);
  }, [total]);

  // Pre-fill input on mount
  useEffect(() => {
      setTenderedInput(total.toFixed(2));
  }, [total]);

  const handleCashPay = () => {
      const tendered = parseFloat(tenderedInput) || 0;
      if (tendered < total) {
          alert("Tendered amount is less than total.");
          return;
      }
      onProcessPayment('Cash', tendered);
  };

  const handleQuickCash = (amount: number) => {
      onProcessPayment('Cash', amount);
  };

  const handleOtherPayment = (methodName: string) => {
      // For non-cash, tendered is exactly total
      onProcessPayment(methodName, total);
  };

  // --- Sub-renderers ---

  const PaymentWorkspace = () => (
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
          <header className="flex-shrink-0 h-16 flex items-center gap-4 px-4 bg-surface border-b border-border">
              <button onClick={onBack} className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-muted">
                  <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold text-text-primary">Checkout</h1>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-md mx-auto space-y-4">
                  
                  {/* Hero Total Display - Compact & Aligned */}
                  <div className="text-center mb-2">
                      <p className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-1">Total Payable</p>
                      <div className="flex items-baseline justify-center text-primary">
                          <span className="text-3xl font-medium mr-1 text-text-secondary/70">₹</span>
                          <span className="text-6xl font-bold tracking-tight font-mono">{total.toFixed(2)}</span>
                      </div>
                  </div>

                  {/* Other Payment Methods (Top Priority) */}
                  <div className="grid grid-cols-1 gap-3">
                      {paymentTypes.filter(pt => pt.type === 'other' && pt.enabled).map(pt => (
                          <button
                              key={pt.id}
                              onClick={() => handleOtherPayment(pt.name)}
                              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
                          >
                              <PaymentMethodIcon iconName={pt.icon} className="h-6 w-6 text-white/90" />
                              <span className="text-lg font-bold">{pt.name}</span>
                          </button>
                      ))}
                  </div>

                  <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-border"></div>
                      <span className="flex-shrink-0 mx-4 text-xs font-bold text-text-muted uppercase tracking-wider">Or Pay Cash</span>
                      <div className="flex-grow border-t border-border"></div>
                  </div>

                  {/* Cash Payment Section */}
                  <div className="bg-surface p-5 rounded-2xl shadow-sm border border-border">
                      <div className="mb-4">
                          <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Amount Tendered</label>
                          <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-xl font-medium">₹</span>
                              <input
                                  type="number"
                                  inputMode="decimal"
                                  value={tenderedInput}
                                  onChange={e => setTenderedInput(e.target.value)}
                                  onFocus={e => e.target.select()}
                                  className="w-full pl-10 pr-4 py-4 text-3xl font-bold text-text-primary bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                              />
                          </div>
                      </div>

                      {/* Smart Suggestions */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                          {quickCashOptions.map(amount => (
                              <button
                                  key={amount}
                                  onClick={() => handleQuickCash(amount)}
                                  className="py-2 bg-surface-muted text-text-primary font-mono font-semibold rounded-lg hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary transition-colors text-sm"
                              >
                                  ₹{amount}
                              </button>
                          ))}
                      </div>

                      <button
                          onClick={handleCashPay}
                          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-bold rounded-xl shadow-md transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                          <span>Pay Cash</span>
                      </button>
                  </div>

              </div>
          </div>
      </div>
  );

  const ChangeWorkspace = () => {
      const isCash = paymentResult?.method === 'Cash';
      const [isPrinting, setIsPrinting] = useState(false);

      const handlePrint = async () => {
          if (!paymentResult || isPrinting) return;
          if (printers.length === 0) {
              alert("No printer configured.");
              return;
          }
          setIsPrinting(true);
          const printerToUse = printers[0]; // Default to first printer
          const result = await printReceipt({ 
              items: orderItems, 
              total, 
              subtotal, 
              tax, 
              receiptId: paymentResult.receiptId, 
              paymentMethod: paymentResult.method, 
              settings, 
              printer: printerToUse,
              date: paymentResult.date
          });
          setIsPrinting(false);
          if (!result.success) alert(result.message);
      };

      return (
        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 h-16 flex items-center justify-center bg-surface border-b border-border">
                <h1 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckIcon className="h-5 w-5" /> Transaction Complete
                </h1>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm text-center">
                    <div className="mb-6">
                        <AnimatedCheckIcon className="h-24 w-24 mx-auto" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-text-primary mb-1">Payment Successful</h2>
                    <p className="text-text-secondary mb-8">Receipt #{paymentResult?.receiptId.slice(-4)}</p>

                    {isCash && (
                        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border mb-8 transform scale-105">
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Change Due</p>
                            <div className="flex items-baseline justify-center text-primary">
                                <span className="text-3xl font-medium mr-1 text-text-secondary/70">₹</span>
                                <span className="text-6xl font-bold tracking-tight font-mono">{(paymentResult?.change || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <div className="bg-surface-muted rounded-xl p-4 text-sm space-y-2 mb-4">
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Total Amount</span>
                            <span className="font-bold text-text-primary">₹{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Payment Method</span>
                            <span className="font-bold text-text-primary">{paymentResult?.method}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Footer */}
            <div className="p-4 bg-surface border-t border-border z-20 pb-safe-bottom">
                <div className="flex gap-4 max-w-md mx-auto">
                    <button 
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="flex-1 py-4 bg-surface border-2 border-border text-text-primary font-bold rounded-xl hover:bg-surface-muted active:scale-[0.98] transition-colors flex items-center justify-center gap-2"
                    >
                        <PrintIcon className="h-5 w-5" />
                        {isPrinting ? 'Printing...' : 'Print'}
                    </button>
                    <button 
                        onClick={onNewSale}
                        className="flex-1 py-4 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-hover active:scale-[0.98] transition-colors"
                    >
                        New Sale
                    </button>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="flex h-full w-full bg-background font-sans">
      {/* 
         SPLIT SCREEN LAYOUT:
         Left: Static Ticket Panel (Order Summary) - Visible on Desktop/Tablet
         Right: Workspace (Payment Entry OR Success Screen)
      */}
      <StaticTicketPanel 
        orderItems={orderItems} 
        settings={settings} 
        subtotal={subtotal} 
        tax={tax} 
        total={total}
      />
      
      {/* Right Panel Workspace */}
      <div className="flex-1 h-full min-w-0">
          {paymentResult ? <ChangeWorkspace /> : <PaymentWorkspace />}
      </div>
    </div>
  );
};

export default ChargeScreen;
