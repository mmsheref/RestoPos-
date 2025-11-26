
import React from 'react';
import { PlusIcon } from '../../constants';
import { Item } from '../../types';
import ItemTile from './ItemTile';

interface ItemGridProps {
  itemsForDisplay: (Item | null)[];
  mode: 'all' | 'grid';
  onAddItemToOrder: (item: Item) => void;
  onAssignItem: (slotIndex: number) => void;
  onRemoveItem?: (slotIndex: number) => void;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
  isEditing?: boolean;
}

const ItemGrid: React.FC<ItemGridProps> = ({ 
    itemsForDisplay, mode, onAddItemToOrder, onAssignItem, onRemoveItem, 
    loadMoreRef, isEditing = false 
}) => {
  const isFixedGrid = mode === 'grid';

  const gridContainerClasses = isFixedGrid ? 'h-full' : '';
  
  const gridClasses = isFixedGrid
    ? 'grid grid-cols-5 grid-rows-4 gap-3 h-full'
    : 'grid grid-cols-5 gap-3';

  return (
    <div className={gridContainerClasses}>
      <div className={gridClasses}>
        {itemsForDisplay.map((item, index) => {
          if (!item) {
            // Only allow assigning items to empty slots if we are in 'grid' mode.
            // In 'all' mode, empty slots don't exist or don't matter.
            if (mode === 'all') return null;

            return (
              <button
                key={`placeholder-${index}`}
                onClick={() => {
                    // Only allow assignment if editing or if it's a fixed grid (user intent is clear)
                    // Current requirement: Only edit button enables editing, but typically clicking empty slot is safe.
                    // However, to align with "edit mode" strictness:
                    if (isEditing) onAssignItem(index);
                }}
                disabled={!isEditing}
                className={`w-full rounded-lg border-2 border-dashed border-border 
                           flex items-center justify-center text-text-muted transition-colors 
                           ${isFixedGrid ? 'h-full' : 'aspect-square'}
                           ${isEditing ? 'cursor-pointer hover:bg-surface-muted hover:border-primary hover:text-primary bg-surface-muted/20' : 'opacity-50 cursor-default'}`}
              >
                {isEditing && <PlusIcon className="h-8 w-8" />}
              </button>
            );
          }
          
          return (
            <ItemTile
                key={`${item.id}-${index}`}
                item={item}
                mode={mode}
                onAddItemToOrder={onAddItemToOrder}
                onAssignItem={onAssignItem}
                onRemoveFromGrid={onRemoveItem}
                index={index}
                isFixedGrid={isFixedGrid}
                isEditing={isEditing}
            />
          );
        })}
      </div>
      {/* Sentinel for infinite scrolling */}
      {loadMoreRef && itemsForDisplay.length > 0 && (
          <div ref={loadMoreRef} className="h-20 w-full flex items-center justify-center mt-4">
              <div className="w-2 h-2 bg-surface-muted rounded-full"></div>
          </div>
      )}
    </div>
  );
};

export default ItemGrid;
