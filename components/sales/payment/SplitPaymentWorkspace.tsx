
import React, { useState, useEffect, useMemo } from 'react';
import { PaymentType, SplitPaymentDetail } from '../../../types';
import { ArrowLeftIcon, TrashIcon, PlusIcon, CheckIcon } from '../../../constants';

interface SplitPaymentWorkspaceProps {
    total: number;
    paymentTypes: PaymentType[];
    onBack: () => void;
    onComplete: (details: SplitPaymentDetail[]) => void;
}

/**
 * Allows the user to break a large bill into smaller chunks paid via different methods.
 * Example: ₹100 Bill -> ₹50 Cash + ₹50 Card.
 */
const SplitPaymentWorkspace: React.FC<SplitPaymentWorkspaceProps> = ({ total, paymentTypes, onBack, onComplete }) => {
    const [rows, setRows] = useState<SplitPaymentDetail[]>([]);

    // Initial Setup: One row with full amount.
    // We assume paymentTypes is memoized by parent to prevent infinite loops.
    useEffect(() => {
        const defaultMethod = paymentTypes.length > 0 ? paymentTypes[0].name : 'Cash';
        setRows([{ method: defaultMethod, amount: total }]);
    }, [total, paymentTypes]);

    const totalEntered = useMemo(() => {
        return rows.reduce((sum, row) => sum + (row.amount || 0), 0);
    }, [rows]);

    // Use epsilon for safe float comparison (avoiding 0.0000001 errors)
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
        
        // Smart method selection: try to pick one that hasn't been used yet to save clicks
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

                    {/* Payment Rows */}
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

export default SplitPaymentWorkspace;
