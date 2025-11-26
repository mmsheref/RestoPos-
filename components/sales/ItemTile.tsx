
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
                    type="button"
                    onClick={() => onAssignItem(index)}
                    className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full"
                >
                    <PencilIcon className="h-8 w-8 text-text-primary mb-1" />
                    <span className="text-xs font-bold text-text-primary bg-surface/80 px-1 rounded">Change</span>
                </button>

                {/* Top Right: Delete Button */}
                <button 
                    type="button"
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
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Remove focus to prevent sticky hover states on mobile
        e.currentTarget.blur();
        onAddItemToOrder(item);
    };

    if (hasRealImage) {
        return (
            <button
                type="button"
                onClick={handleClick}
                className={`relative w-full rounded-lg overflow-hidden cursor-pointer shadow-sm border border-border bg-surface-muted ${isFixedGrid ? 'h-full' : 'aspect-square'} touch-manipulation group`}
                aria-label={`Add ${item.name} to order`}
            >
                {/* Inner container handles the scale animation so the button hit area stays full size */}
                <div className="w-full h-full transition-transform duration-75 group-active:scale-95">
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
                </div>
            </button>
        );
    } else {
        return (
            <button
                type="button"
                onClick={handleClick}
                className={`relative w-full rounded-lg cursor-pointer shadow-sm border border-border bg-surface ${isFixedGrid ? 'h-full' : 'aspect-square'} touch-manipulation group`}
                aria-label={`Add ${item.name} to order`}
            >
                <div className="w-full h-full flex flex-col justify-center items-center p-2 text-center transition-colors hover:bg-surface-muted duration-75 group-active:scale-95">
                    <h3 className="font-semibold text-text-primary text-sm md:text-base leading-tight line-clamp-3 pointer-events-none">
                        {item.name}
                    </h3>
                </div>
            </button>
        );
    }
});

export default ItemTile;
