
import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Item } from '../types';
import { SearchIcon, TrashIcon, ArrowLeftIcon, CheckIcon } from '../constants';
import { parseCSV, generateCSV } from '../utils/csvHelper';

// --- Colors & Shapes for Picker ---
const PRESET_COLORS = [
    '#94a3b8', // Slate
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#db2777', // Pink
];

const SHAPES = [
    { id: 'square', label: 'Square', class: 'rounded-md' },
    { id: 'circle', label: 'Circle', class: 'rounded-full' },
];

// --- Sub-Component: Item List View ---
const ItemListView: React.FC<{ 
    items: Item[]; 
    onAddItem: () => void; 
    onEditItem: (item: Item) => void;
    onDeleteItem: (id: string) => void;
    onImport: (file: File) => void;
    onExport: () => void;
}> = ({ items, onAddItem, onEditItem, onDeleteItem, onImport, onExport }) => {
    const [search, setSearch] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredItems = useMemo(() => {
        if (!search.trim()) return items;
        return items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    }, [items, search]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImport(e.target.files[0]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const ItemRow = ({ item }: { item: Item }) => (
        <div onClick={() => onEditItem(item)} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
             <div className="flex items-center gap-4 overflow-hidden">
                 {/* Visual Representation */}
                 <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
                     {item.representation === 'image' && item.imageUrl ? (
                         <img src={item.imageUrl} alt={item.name} className="h-12 w-12 object-cover rounded-md" />
                     ) : (
                         <div 
                            className={`h-10 w-10 ${item.shape === 'circle' ? 'rounded-full' : 'rounded-md'}`}
                            style={{ backgroundColor: item.color || '#94a3b8' }}
                         />
                     )}
                 </div>
                 <div className="min-w-0">
                     <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</h3>
                     <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.category} • Stock: {item.stock}</p>
                 </div>
             </div>
             <div className="flex items-center gap-4 flex-shrink-0">
                 <span className="text-sm font-mono font-medium text-gray-800 dark:text-gray-200">₹{item.price.toFixed(2)}</span>
                 <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                 >
                     <TrashIcon className="h-5 w-5 pointer-events-none" />
                 </button>
             </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm p-4 z-10">
                <div className="flex justify-between items-center mb-4">
                     <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Items</h1>
                     <div className="flex gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Import CSV</button>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <button onClick={onExport} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Export CSV</button>
                     </div>
                     <input type="file" ref={fileInputRef} accept=".csv" hidden onChange={handleFileChange} />
                </div>
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search items..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-transparent rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No items found.</p>
                        <button onClick={onAddItem} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 font-medium">
                            Create First Item
                        </button>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                        {filteredItems.map(item => <ItemRow key={item.id} item={item} />)}
                    </div>
                )}
            </div>

            {/* FAB Add Button */}
            {filteredItems.length > 0 && (
                 <button 
                    onClick={onAddItem}
                    className="absolute bottom-6 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-transform active:scale-90"
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                 </button>
            )}
        </div>
    );
};


// --- Sub-Component: Item Form View ---
const ItemFormView: React.FC<{ 
    initialData?: Item; 
    categories: string[]; 
    onSave: (item: Partial<Item>) => void; 
    onCancel: () => void;
    onAddCategory: (name: string) => void;
}> = ({ initialData, categories, onSave, onCancel, onAddCategory }) => {
    
    const [formData, setFormData] = useState<Partial<Item>>({
        name: initialData?.name || '',
        category: initialData?.category || categories[0] || 'General',
        price: initialData?.price || 0,
        cost: initialData?.cost || 0,
        stock: initialData?.stock !== undefined ? initialData.stock : 100,
        representation: initialData?.representation || 'color',
        imageUrl: initialData?.imageUrl || '',
        color: initialData?.color || PRESET_COLORS[6],
        shape: initialData?.shape || 'square',
    });

    const [hasChanges, setHasChanges] = useState(false);

    const handleChange = (field: keyof Item, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === '__ADD_NEW__') {
            const newCat = window.prompt("Enter new category name:");
            if (newCat && newCat.trim()) {
                onAddCategory(newCat.trim());
                handleChange('category', newCat.trim());
            }
        } else {
            handleChange('category', val);
        }
    };

    const handleBack = () => {
        if (hasChanges) {
            if (!window.confirm("You have unsaved changes. Are you sure you want to discard them?")) return;
        }
        onCancel();
    };

    const handleSave = () => {
        if (!formData.name) {
            alert("Item name is required.");
            return;
        }
        onSave(formData);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange('imageUrl', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Top App Bar */}
            <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center justify-between px-4 flex-shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{initialData ? 'Edit Item' : 'Add Item'}</h2>
                </div>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                >
                    Save
                </button>
            </header>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                    
                    {/* Basic Info Card */}
                    <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Details</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={e => handleChange('name', e.target.value)} 
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                    placeholder="Item Name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                <div className="relative">
                                    <select 
                                        value={formData.category} 
                                        onChange={handleCategoryChange}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none dark:text-white"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        <option disabled>──────────</option>
                                        <option value="__ADD_NEW__" className="font-bold text-blue-600">+ Add Category</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={formData.price} 
                                        onChange={e => handleChange('price', parseFloat(e.target.value))} 
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost (₹) <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={formData.cost} 
                                        onChange={e => handleChange('cost', parseFloat(e.target.value))} 
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                    />
                                </div>
                            </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Stock</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={formData.stock} 
                                    onChange={e => handleChange('stock', parseInt(e.target.value))} 
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Representation Card */}
                    <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Representation on POS</h3>
                        
                        {/* Radio Group */}
                        <div className="flex gap-4 mb-6">
                            <label className={`flex-1 cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${formData.representation === 'color' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                <input type="radio" name="rep" checked={formData.representation === 'color'} onChange={() => handleChange('representation', 'color')} className="hidden" />
                                <div className="h-10 w-10 bg-blue-500 rounded-md"></div>
                                <span className="font-medium text-gray-700 dark:text-gray-200">Color & Shape</span>
                            </label>
                            
                            <label className={`flex-1 cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${formData.representation === 'image' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                <input type="radio" name="rep" checked={formData.representation === 'image'} onChange={() => handleChange('representation', 'image')} className="hidden" />
                                <div className="h-10 w-10 bg-gray-300 rounded-md flex items-center justify-center">
                                     <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                </div>
                                <span className="font-medium text-gray-700 dark:text-gray-200">Image</span>
                            </label>
                        </div>

                        {/* Conditional Content */}
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            {formData.representation === 'color' ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Color</label>
                                        <div className="flex flex-wrap gap-3">
                                            {PRESET_COLORS.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => handleChange('color', color)}
                                                    className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${formData.color === color ? 'border-gray-600 dark:border-white scale-110' : 'border-transparent'}`}
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {formData.color === color && <CheckIcon className="text-white w-5 h-5 drop-shadow-md" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Shape</label>
                                        <div className="flex gap-4">
                                            {SHAPES.map(shape => (
                                                <button
                                                    key={shape.id}
                                                    onClick={() => handleChange('shape', shape.id)}
                                                    className={`h-14 w-14 border-2 flex items-center justify-center transition-all ${formData.shape === shape.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-gray-200 dark:border-gray-600 text-gray-400'} ${shape.class}`}
                                                >
                                                    <div className={`h-8 w-8 ${shape.class}`} style={{ backgroundColor: formData.color }}></div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Choose Photo</label>
                                    <div className="flex items-center gap-6">
                                        <div className="h-24 w-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
                                            {formData.imageUrl ? (
                                                <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-gray-400 text-center px-2">No Image Selected</span>
                                            )}
                                        </div>
                                        <div>
                                            <label className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm inline-block mb-2">
                                                Browse Files...
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            </label>
                                            <p className="text-xs text-gray-500">Recommended: 200x200px</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </section>
                </div>
            </div>
        </div>
    );
};


// --- Main Controller ---
const ItemsScreen: React.FC = () => {
  const { items, addItem, updateItem, deleteItem, importItems, categories, addCategory } = useAppContext();
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);

  const handleAddItem = () => {
      setEditingItem(undefined);
      setViewMode('form');
  };

  const handleEditItem = (item: Item) => {
      setEditingItem(item);
      setViewMode('form');
  };

  const handleSaveItem = async (data: Partial<Item>) => {
      if (editingItem) {
          // Update
          const updated = { ...editingItem, ...data } as Item;
          await updateItem(updated);
      } else {
          // Create
          const newItem: Item = {
              id: crypto.randomUUID(),
              name: data.name!,
              category: data.category!,
              price: data.price || 0,
              cost: data.cost || 0,
              stock: data.stock || 0,
              representation: data.representation || 'color',
              imageUrl: data.imageUrl,
              color: data.color,
              shape: data.shape
          };
          await addItem(newItem);
      }
      setViewMode('list');
      setEditingItem(undefined);
  };

  const handleImport = async (file: File) => {
      const text = await file.text();
      const importedItems = parseCSV(text);
      if (importedItems.length > 0) {
          if(window.confirm(`Found ${importedItems.length} items. Import them now? This will merge with existing items.`)) {
            importItems(importedItems);
          }
      } else {
          alert("No valid items found in CSV. Please check the format.");
      }
  };

  const handleExport = () => {
      const csv = generateCSV(items);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `items_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Delete this item?")) {
          await deleteItem(id);
      }
  };

  return (
    <div className="h-full w-full overflow-hidden relative">
        {viewMode === 'list' ? (
            <ItemListView 
                items={items} 
                onAddItem={handleAddItem} 
                onEditItem={handleEditItem}
                onDeleteItem={handleDelete}
                onImport={handleImport}
                onExport={handleExport}
            />
        ) : (
            <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 z-20">
                <ItemFormView 
                    initialData={editingItem} 
                    categories={categories}
                    onSave={handleSaveItem}
                    onCancel={() => setViewMode('list')}
                    onAddCategory={addCategory}
                />
            </div>
        )}
    </div>
  );
};

export default ItemsScreen;
