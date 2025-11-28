
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { LockIcon, MenuIcon, DollarSignIcon, ChartIcon, CheckIcon } from '../constants';
import { Receipt } from '../types';

type DateFilter = 'today' | 'yesterday' | 'week' | 'month';

interface Metrics {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  paymentMethods: Record<string, number>;
  topItems: { name: string, count: number, revenue: number }[];
  salesByHour: Record<number, number>;
}

const ReportsScreen: React.FC = () => {
    const { openDrawer, receipts, settings } = useAppContext();
    const [isLocked, setIsLocked] = useState(!!settings.reportsPIN);
    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<DateFilter>('today');

    useEffect(() => {
        // Re-lock if settings change (e.g. PIN added remotely)
        setIsLocked(!!settings.reportsPIN);
    }, [settings.reportsPIN]);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (pinInput === settings.reportsPIN) {
            setIsLocked(false);
            setError('');
            setPinInput('');
        } else {
            setError('Incorrect PIN');
            setPinInput('');
        }
    };

    // --- DATA AGGREGATION ---
    const filteredReceipts = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        let startTime = new Date(startOfDay);

        switch(filter) {
            case 'today':
                // startTime is already start of today
                break;
            case 'yesterday':
                startTime.setDate(startTime.getDate() - 1);
                // We also need an end time for yesterday
                break;
            case 'week':
                startTime.setDate(startTime.getDate() - 7);
                break;
            case 'month':
                startTime.setDate(startTime.getDate() - 30);
                break;
        }

        return receipts.filter(r => {
            const date = new Date(r.date);
            if (filter === 'yesterday') {
                const endOfYesterday = new Date(startOfDay); // Start of today is end of yesterday
                return date >= startTime && date < endOfYesterday;
            }
            return date >= startTime;
        });
    }, [receipts, filter]);

    const metrics = useMemo<Metrics>(() => {
        let totalSales = 0;
        let totalOrders = filteredReceipts.length;
        const paymentMethods: Record<string, number> = {};
        const itemsSold: Record<string, { count: number, revenue: number }> = {};
        const salesByHour: Record<number, number> = {};

        // Initialize hours 0-23
        for(let i=0; i<24; i++) salesByHour[i] = 0;

        filteredReceipts.forEach(r => {
            totalSales += r.total;
            
            // Payment Method
            paymentMethods[r.paymentMethod] = (paymentMethods[r.paymentMethod] || 0) + r.total;

            // Hourly
            const hour = new Date(r.date).getHours();
            salesByHour[hour] += r.total;

            // Items
            r.items.forEach(item => {
                if (!itemsSold[item.name]) itemsSold[item.name] = { count: 0, revenue: 0 };
                itemsSold[item.name].count += item.quantity;
                itemsSold[item.name].revenue += (item.price * item.quantity);
            });
        });

        const topItems = Object.entries(itemsSold)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalSales,
            totalOrders,
            avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
            paymentMethods,
            topItems,
            salesByHour
        };
    }, [filteredReceipts]);

    // --- RENDER LOCKED STATE ---
    if (isLocked) {
        return (
            <div className="flex h-full flex-col bg-background">
                <div className="flex-shrink-0 h-16 flex items-center px-4 border-b border-border bg-surface">
                    <button onClick={openDrawer} className="p-2 -ml-2 text-text-secondary hover:text-text-primary">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-text-primary ml-4">Reports</h1>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-surface p-8 rounded-xl shadow-lg text-center">
                        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <LockIcon className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-2">Restricted Access</h2>
                        <p className="text-text-secondary mb-6">Please enter the security PIN to view reports.</p>
                        
                        <form onSubmit={handleUnlock}>
                            <input
                                type="password"
                                inputMode="numeric" 
                                pattern="[0-9]*"
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value)}
                                className="w-full text-center text-2xl tracking-widest p-3 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary mb-4 font-mono"
                                placeholder="• • • •"
                                autoFocus
                            />
                            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                            <button 
                                type="submit"
                                className="w-full py-3 bg-primary text-primary-content font-bold rounded-lg hover:bg-primary-hover transition-colors"
                            >
                                Unlock
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER DASHBOARD ---
    // Explicitly cast Object.values result to number[] to handle cases where TS infers 'unknown[]'
    const maxHourlySales = Math.max(...(Object.values(metrics.salesByHour) as number[]), 1); // Avoid div by zero

    return (
        <div className="flex h-full flex-col bg-background overflow-hidden">
            <div className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b border-border bg-surface">
                <div className="flex items-center">
                    <button onClick={openDrawer} className="p-2 -ml-2 text-text-secondary hover:text-text-primary">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-text-primary ml-4">Dashboard</h1>
                </div>
                <div className="flex bg-surface-muted rounded-lg p-1 text-xs font-medium">
                    {(['today', 'yesterday', 'week', 'month'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-md capitalize transition-colors ${filter === f ? 'bg-primary text-primary-content shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                        <div className="flex items-center gap-3 mb-2 text-text-secondary">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                                <DollarSignIcon className="h-5 w-5" />
                            </div>
                            <span className="font-medium">Total Sales</span>
                        </div>
                        <p className="text-3xl font-bold text-text-primary">₹{metrics.totalSales.toFixed(2)}</p>
                    </div>
                    
                    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                        <div className="flex items-center gap-3 mb-2 text-text-secondary">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                <ChartIcon className="h-5 w-5" />
                            </div>
                            <span className="font-medium">Total Orders</span>
                        </div>
                        <p className="text-3xl font-bold text-text-primary">{metrics.totalOrders}</p>
                    </div>

                    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                        <div className="flex items-center gap-3 mb-2 text-text-secondary">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                                <CheckIcon className="h-5 w-5" />
                            </div>
                            <span className="font-medium">Avg. Order Value</span>
                        </div>
                        <p className="text-3xl font-bold text-text-primary">₹{metrics.avgOrderValue.toFixed(2)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Hourly Sales Chart */}
                    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                        <h3 className="text-lg font-bold text-text-primary mb-6">Hourly Breakdown</h3>
                        <div className="h-48 flex items-end gap-1">
                            {Object.entries(metrics.salesByHour).map(([hour, value]) => (
                                <div key={hour} className="flex-1 flex flex-col items-center group relative">
                                    <div 
                                        className="w-full bg-primary/80 hover:bg-primary rounded-t-sm transition-all relative"
                                        style={{ height: `${((value as number) / maxHourlySales) * 100}%`, minHeight: (value as number) > 0 ? '4px' : '0' }}
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                                            ₹{(value as number).toFixed(0)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-text-muted mt-1 transform -rotate-45 origin-top-left md:rotate-0 md:origin-center">
                                        {parseInt(hour) % 3 === 0 ? hour : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Items */}
                    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                        <h3 className="text-lg font-bold text-text-primary mb-4">Top Selling Items</h3>
                        <div className="space-y-4">
                            {metrics.topItems.map((item, i) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-muted text-xs font-bold text-text-secondary">
                                            {i + 1}
                                        </span>
                                        <span className="font-medium text-text-primary">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-text-primary">₹{item.revenue.toFixed(2)}</p>
                                        <p className="text-xs text-text-secondary">{item.count} orders</p>
                                    </div>
                                </div>
                            ))}
                            {metrics.topItems.length === 0 && (
                                <p className="text-text-muted text-sm text-center py-4">No sales data for this period.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sales by Payment Method */}
                <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Sales by Payment Type</h3>
                    <div className="space-y-3">
                        {Object.entries(metrics.paymentMethods).map(([method, value]) => (
                            <div key={method}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-text-primary">{method}</span>
                                    <span className="text-text-secondary">₹{(value as number).toFixed(2)} ({(((value as number) / metrics.totalSales) * 100).toFixed(1)}%)</span>
                                </div>
                                <div className="w-full bg-surface-muted rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="bg-emerald-500 h-2.5 rounded-full" 
                                        style={{ width: `${((value as number) / metrics.totalSales) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                         {Object.keys(metrics.paymentMethods).length === 0 && (
                                <p className="text-text-muted text-sm text-center py-4">No data available.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReportsScreen;
