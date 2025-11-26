
import React from 'react';
import { Item } from '../../types';
import { TrashIcon, PencilIcon } from '../../constants';

interface ItemTileProps {
    item: Item;
    mode: 'all' | 'grid';
    onAddItemToOrder: (item: Item) => void;
    onAssignItem: (slotIndex: number) => void;
    onRemoveFromGrid?: (slotIndex: number) => void;
    index: number;
    isFixedGrid: boolean;
    isEditing: boolean;
}

const ItemTile: React.FC<ItemTileProps> = React.memo(({ 
    item, mode, onAddItemToOrder, onAssignItem, onRemoveFromGrid, 
    index, isFixedGrid, isEditing 
}) => {
    
    const hasRealImage = item.imageUrl && !item.imageUrl.includes('via.placeholder.com');

    // --- EDIT MODE RENDER ---
    if (isEditing && mode === 'grid') {
        return (
            <div 
                className={`relative w-full rounded-lg overflow-hidden border-2 border-dashed border-primary/50 bg-surface-muted/50 ${isFixedGrid ? 'h-full' : 'aspect-square'} animate-pulse`}
            >
                {/* Background Image (Dimmed) */}
                {hasRealImage && (
                    <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 grayscale"
                    />
                )}
                
                {/* Center: Tap to Swap/Edit */}
                <button
                    onClick={() => onAssignItem(index)}
                    className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full"
                >
                    <PencilIcon className="h-8 w-8 text-text-primary mb-1" />
                    <span className="text-xs font-bold text-text-primary bg-surface/80 px-1 rounded">Change</span>
                </button>

                {/* Top Right: Delete Button */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if(onRemoveFromGrid) onRemoveFromGrid(index);
                    }}
                    className="absolute top-1 right-1 z-20 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 active:scale-95 transition-transform"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>

                {/* Bottom Label */}
                <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 backdrop-blur-sm z-0 pointer-events-none">
                    <h3 className="font-semibold text-white text-xs text-center truncate">
                        {item.name}
                    </h3>
                </div>
            </div>
        );
    }

    // --- NORMAL MODE RENDER (SPEED OPTIMIZED) ---
    
    const handleClick = () => {
        onAddItemToOrder(item);
    };

    if (hasRealImage) {
        return (
            <button
                onClick={handleClick}
                className={`relative w-full rounded-lg overflow-hidden cursor-pointer shadow-sm border border-border bg-surface-muted ${isFixedGrid ? 'h-full' : 'aspect-square'} active:scale-95 transition-transform duration-75 touch-manipulation`}
                aria-label={`Add ${item.name} to order`}
            >
                <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    loading="lazy"
                    decoding="async"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 backdrop-blur-sm z-10 pointer-events-none">
                    <h3 className="font-semibold text-white text-xs md:text-sm leading-tight text-center line-clamp-2">
                        {item.name}
                    </h3>
                </div>
            </button>
        );
    } else {
        return (
            <button
                onClick={handleClick}
                className={`relative w-full rounded-lg cursor-pointer shadow-sm border border-border bg-surface flex flex-col justify-center items-center p-2 text-center transition-colors hover:bg-surface-muted ${isFixedGrid ? 'h-full' : 'aspect-square'} active:scale-95 transition-transform duration-75 touch-manipulation`}
                aria-label={`Add ${item.name} to order`}
            >
                <h3 className="font-semibold text-text-primary text-sm md:text-base leading-tight line-clamp-3 pointer-events-none">
                    {item.name}
                </h3>
            </button>
        );
    }
});

export default ItemTile;
