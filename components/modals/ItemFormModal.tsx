
import React, { useState, useEffect } from 'react';
import { Item } from '../../types';

interface ItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Partial<Item>) => void;
    initialData?: Item;
    categories: string[];
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({ isOpen, onClose, onSave, initialData, categories }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setCategory(initialData.category);
                setPrice(initialData.price.toString());
                setStock(initialData.stock.toString());
                setImageUrl(initialData.imageUrl);
            } else {
                // Defaults for new item
                setName('');
                setCategory(categories[0] || 'Uncategorized');
                setPrice('');
                setStock('100');
                setImageUrl('');
            }
        }
    }, [initialData, categories, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic Validation
        const parsedPrice = parseFloat(price);
        const parsedStock = parseInt(stock, 10);

        if (!name.trim()) {
            alert("Item name is required.");
            return;
        }
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            alert("Please enter a valid positive price.");
            return;
        }

        onSave({
            name: name.trim(),
            category,
            price: parsedPrice,
            stock: isNaN(parsedStock) ? 0 : parsedStock,
            imageUrl: imageUrl.trim() || 'https://via.placeholder.com/150'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">
                    {initialData ? 'Edit Item' : 'Add New Item'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Item Name</label>
                        <input 
                            required
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="e.g., Burger"
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price</label>
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                <input 
                                    required
                                    type="number" 
                                    min="0"
                                    step="0.01"
                                    value={price} 
                                    onChange={e => setPrice(e.target.value)} 
                                    className="w-full p-2 pl-6 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock</label>
                            <input 
                                type="number" 
                                min="0"
                                step="1"
                                value={stock} 
                                onChange={e => setStock(e.target.value)} 
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                        <div className="relative">
                            <select 
                                value={category} 
                                onChange={e => setCategory(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                            >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image URL</label>
                        <input 
                            type="url" 
                            value={imageUrl} 
                            onChange={e => setImageUrl(e.target.value)} 
                            placeholder="https://example.com/image.jpg"
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Leave empty for placeholder</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-700 mt-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            {initialData ? 'Update Item' : 'Save Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItemFormModal;
