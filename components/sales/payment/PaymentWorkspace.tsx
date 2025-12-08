
import React from 'react';
import { PaymentType } from '../../../types';
import { PaymentMethodIcon, ArrowLeftIcon, SplitIcon, UserIcon } from '../../../constants';

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

/**
 * The main interactive area for processing payments.
 * Allows selecting Cash, Custom Methods (UPI, Card), or switching to Split Payment.
 */
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
                {/* 1. Other Methods Grid (Top Priority) */}
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

                {/* 2. Cash Section */}
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

export default PaymentWorkspace;
