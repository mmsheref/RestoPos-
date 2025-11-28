
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { LockIcon, MenuIcon, DollarSignIcon, ChartIcon, CheckIcon, CalendarIcon, DownloadIcon, TableIcon } from '../constants';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type ReportTab = 'overview' | 'items' | 'categories' | 'orders';

interface Metrics {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  paymentMethods: Record<string, number>;
  topItems: { name: string, count: number, revenue: number }[];
  allItems: { name: string, count: number, revenue: number, category: string }[];
  salesByHour: Record<number, number>;
  salesByCategory: Record<string, number>;
}

const ReportsScreen: React.FC = () => {
    const { openDrawer, receipts, settings } = useAppContext();
    const [isLocked, setIsLocked] = useState(!!settings.reportsPIN);
    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState('');
    
    // Filters
    const [filter, setFilter] = useState<DateFilter>('today');
    const [customStartDate, setCustomStartDate] = useState(() => {
        const now = new Date();
        now.setHours(0,0,0,0);
        return now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    });
    const [customEndDate, setCustomEndDate] = useState(() => {
        const now = new Date();
        now.setHours(23,59,59,999);
        return now.toISOString().slice(0, 16);
    });

    // Navigation
    const [activeTab, setActiveTab] = useState<ReportTab>('overview');

    useEffect(() => {
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
        let startTime: Date;
        let endTime: Date;

        if (filter === 'custom') {
            startTime = new Date(customStartDate);
            endTime = new Date(customEndDate);
        } else {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endTime = new Date(); // Default end is now

            switch(filter) {
                case 'today':
                    startTime = startOfDay;
                    break;
                case 'yesterday':
                    startTime = new Date(startOfDay);
                    startTime.setDate(startTime.getDate() - 1);
                    endTime = new Date(startOfDay); // End of yesterday is start of today
                    break;
                case 'week':
                    startTime = new Date(startOfDay);
                    startTime.setDate(startTime.getDate() - 7);
                    break;
                case 'month':
                    startTime = new Date(startOfDay);
                    startTime.setDate(startTime.getDate() - 30);
                    break;
                default:
                    startTime = startOfDay;
            }
        }

        return receipts.filter(r => {
            const date = new Date(r.date);
            return date >= startTime && date <= endTime;
        });
    }, [receipts, filter, customStartDate, customEndDate]);

    const metrics = useMemo<Metrics>(() => {
        let totalSales = 0;
        let totalOrders = filteredReceipts.length;
        const paymentMethods: Record<string, number> = {};
        const itemsSold: Record<string, { count: number, revenue: number, category: string }> = {};
        const salesByHour: Record<number, number> = {};
        const salesByCategory: Record<string, number> = {};

        for(let i=0; i<24; i++) salesByHour[i] = 0;

        filteredReceipts.forEach(r => {
            totalSales += r.total;
            paymentMethods[r.paymentMethod] = (paymentMethods[r.paymentMethod] || 0) + r.total;
            const hour = new Date(r.date).getHours();
            salesByHour[hour] += r.total;

            r.items.forEach(item => {
                if (!itemsSold[item.name]) itemsSold[item.name] = { count: 0, revenue: 0, category: item.category || 'Uncategorized' };
                itemsSold[item.name].count += item.quantity;
                itemsSold[item.name].revenue += (item.price * item.quantity);
                
                const cat = item.category || 'Uncategorized';
                salesByCategory[cat] = (salesByCategory[cat] || 0) + (item.price * item.quantity);
            });
        });

        const allItems = Object.entries(itemsSold)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue);

        return {
            totalSales,
            totalOrders,
            avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
            paymentMethods,
            topItems: allItems.slice(0, 5),
            allItems,
            salesByHour,
            salesByCategory
        };
    }, [filteredReceipts]);


    // --- CSV EXPORT ---
    const handleExport = async () => {
        // 1. Summary
        let csvContent = "REPORT SUMMARY\n";
        csvContent += `Generated,${new Date().toLocaleString()}\n`;
        csvContent += `Filter,${filter === 'custom' ? `${customStartDate} to ${customEndDate}` : filter}\n`;
        csvContent += `Total Sales,${metrics.totalSales.toFixed(2)}\n`;
        csvContent += `Total Orders,${metrics.totalOrders}\n\n`;

        // 2. Items
        csvContent += "ITEM SALES\n";
        csvContent += "Item Name,Category,Quantity Sold,Revenue\n";
        metrics.allItems.forEach(item => {
             csvContent += `"${item.name.replace(/"/g, '""')}","${item.category}",${item.count},${item.revenue.toFixed(2)}\n`;
        });
        csvContent += "\n";

        // 3. Transactions
        csvContent += "TRANSACTION LOG\n";
        csvContent += "Receipt ID,Date,Time,Payment Method,Total,Items\n";
        filteredReceipts.forEach(r => {
             const d = new Date(r.date);
             const itemsSummary = r.items.map(i => `${i.quantity}x ${i.name}`).join(' | ');
             csvContent += `${r.id},${d.toLocaleDateString()},${d.toLocaleTimeString()},${r.paymentMethod},${r.total.toFixed(2)},"${itemsSummary.replace(/"/g, '""')}"\n`;
        });

        const fileName = `sales_report_${Date.now()}.csv`;
        
        try {
            if (Capacitor.isNativePlatform()) {
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: csvContent,
                    directory: Directory.Documents,
                    encoding: Encoding.UTF8
                });
                await Share.share({ url: result.uri });
            } else {
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (e) {
            alert("Failed to export report.");
            console.error(e);
        }
    };


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

    const maxHourlySales = Math.max(...(Object.values(metrics.salesByHour) as number[]), 1);

    return (
        <div className="flex h-full flex-col bg-background overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b border-border bg-surface gap-4">
                <div className="flex items-center">
                    <button onClick={openDrawer} className="p-2 -ml-2 text-text-secondary hover:text-text-primary">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-text-primary ml-4 hidden sm:block">Reports</h1>
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                     <div className="flex bg-surface-muted rounded-lg p-1 text-xs font-medium whitespace-nowrap">
                        {(['today', 'yesterday', 'week', 'month', 'custom'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-md capitalize transition-colors ${filter === f ? 'bg-primary text-primary-content shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleExport} className="p-2 text-primary hover:bg-primary/10 rounded-full" title="Export CSV">
                        <DownloadIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Custom Date Picker */}
            {filter === 'custom' && (
                <div className="flex-shrink-0 p-4 bg-surface border-b border-border flex flex-wrap gap-4 items-center justify-center animate-fadeIn">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-text-secondary" />
                        <span className="text-sm font-medium text-text-secondary">From:</span>
                        <input 
                            type="datetime-local" 
                            value={customStartDate} 
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="p-2 text-sm border border-border rounded-md bg-background text-text-primary"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="text-sm font-medium text-text-secondary">To:</span>
                         <input 
                            type="datetime-local" 
                            value={customEndDate} 
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="p-2 text-sm border border-border rounded-md bg-background text-text-primary"
                        />
                    </div>
                </div>
            )}

            {/* Sub Navigation */}
            <div className="flex-shrink-0 border-b border-border bg-surface px-4">
                <nav className="flex space-x-8 overflow-x-auto no-scrollbar" aria-label="Tabs">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'items', label: 'Item Sales' },
                        { id: 'categories', label: 'Categories' },
                        { id: 'orders', label: 'Orders' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ReportTab)}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
                {activeTab === 'overview' && (
                    <div className="space-y-6 max-w-6xl mx-auto">
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
                                <h3 className="text-lg font-bold text-text-primary mb-6">Hourly Activity</h3>
                                <div className="h-48 flex items-end gap-1">
                                    {Object.entries(metrics.salesByHour).map(([hour, value]) => (
                                        <div key={hour} className="flex-1 flex flex-col items-center group relative">
                                            <div 
                                                className="w-full bg-primary/80 hover:bg-primary rounded-t-sm transition-all relative"
                                                style={{ height: `${((value as number) / maxHourlySales) * 100}%`, minHeight: (value as number) > 0 ? '4px' : '0' }}
                                            >
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                                                    {parseInt(hour)}:00 - ₹{(value as number).toFixed(0)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs text-text-muted mt-2 px-1">
                                    <span>12 AM</span>
                                    <span>6 AM</span>
                                    <span>12 PM</span>
                                    <span>6 PM</span>
                                    <span>11 PM</span>
                                </div>
                            </div>

                             {/* Sales by Payment Method */}
                            <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                                <h3 className="text-lg font-bold text-text-primary mb-4">Payment Methods</h3>
                                <div className="space-y-4">
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

                        {/* Top 5 Items */}
                         <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-text-primary">Top 5 Selling Items</h3>
                                <button onClick={() => setActiveTab('items')} className="text-sm text-primary hover:underline font-medium">View All</button>
                            </div>
                            <div className="space-y-4">
                                {metrics.topItems.map((item, i) => (
                                    <div key={item.name} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-muted text-xs font-bold text-text-secondary">
                                                {i + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium text-text-primary">{item.name}</p>
                                                <p className="text-xs text-text-secondary">{item.count} sold</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-text-primary">₹{item.revenue.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'items' && (
                    <div className="bg-surface rounded-lg shadow-sm border border-border overflow-hidden">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-surface-muted">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Item Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Category</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Qty Sold</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {metrics.allItems.map((item) => (
                                    <tr key={item.name} className="hover:bg-surface-muted/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{item.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary text-right">{item.count}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-bold text-right">₹{item.revenue.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {metrics.allItems.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-text-muted">No items sold in this period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'categories' && (
                    <div className="bg-surface rounded-lg shadow-sm border border-border overflow-hidden max-w-4xl mx-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-surface-muted">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Category</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Total Revenue</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">% of Sales</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {Object.entries(metrics.salesByCategory)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([category, revenue]) => (
                                    <tr key={category} className="hover:bg-surface-muted/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-bold text-right">₹{revenue.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary text-right">
                                            {((revenue / metrics.totalSales) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                                {Object.keys(metrics.salesByCategory).length === 0 && (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-text-muted">No sales data.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                 {activeTab === 'orders' && (
                    <div className="bg-surface rounded-lg shadow-sm border border-border overflow-hidden">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-surface-muted">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">ID</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Method</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {filteredReceipts.map((r) => (
                                    <tr key={r.id} className="hover:bg-surface-muted/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-text-secondary">#{r.id.slice(-6)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{r.date.toLocaleDateString()} {r.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary capitalize">{r.paymentMethod}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-bold text-right">₹{r.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {filteredReceipts.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-text-muted">No orders found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsScreen;
