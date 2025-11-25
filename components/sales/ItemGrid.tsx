import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PlusIcon } from '../../constants';
import { Item } from '../../types';
import ItemTile from './ItemTile';

interface ItemGridProps {
  itemsForDisplay: (Item | null)[];
  mode: 'all' | 'grid';
  onAddItemToOrder: (item: Item) => void;
  onAssignItem: (slotIndex: number) => void;
  onItemLongPress: (item: Item, slotIndex: number, event: React.MouseEvent | React.TouchEvent) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const ItemGrid: React.FC<ItemGridProps> = ({ 
  itemsForDisplay, 
  mode, 
  onAddItemToOrder, 
  onAssignItem, 
  onItemLongPress, 
  scrollContainerRef 
}) => {
  const isFixedGrid = mode === 'grid';
  const NUM_COLUMNS = 5;

  // --- 1. Fixed Grid (5x4) - No Virtualization ---
  if (isFixedGrid) {
    return (
      <div className="h-full">
        <div className="grid grid-cols-5 grid-rows-4 gap-3 h-full">
          {itemsForDisplay.map((item, index) => {
            if (!item) {
              return (
                <div
                  key={`placeholder-${index}`}
                  onClick={() => onAssignItem(index)}
                  role="button"
                  aria-label="Assign item to this slot"
                  className="w-full rounded-lg border-2 border-dashed border-border bg-surface-muted/30 flex items-center justify-center cursor-pointer text-text-muted hover:bg-surface-muted hover:border-primary hover:text-primary transition-colors h-full"
                >
                  <PlusIcon className="h-8 w-8" />
                </div>
              );
            }
            return (
              <ItemTile
                key={`${item.id}-${index}`}
                item={item}
                mode={mode}
                onAddItemToOrder={onAddItemToOrder}
                onItemLongPress={onItemLongPress}
                index={index}
                isFixedGrid={true}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // --- 2. Virtualized Grid ('all' items mode) ---
  const rowCount = Math.ceil(itemsForDisplay.length / NUM_COLUMNS);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 150, // Estimate row height in pixels
    overscan: 5, // Render 5 extra rows for smoother scrolling
  });

  return (
    <div
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const startIndex = virtualRow.index * NUM_COLUMNS;
        const endIndex = startIndex + NUM_COLUMNS;
        const rowItems = itemsForDisplay.slice(startIndex, endIndex);

        return (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
              display: 'grid',
              gridTemplateColumns: `repeat(${NUM_COLUMNS}, 1fr)`,
              gap: '0.75rem',
              padding: '1px 0',
            }}
          >
            {rowItems.map((item, colIndex) => {
              const itemIndex = startIndex + colIndex;
              if (!item) return <div key={`empty-virtual-${itemIndex}`} />;
              
              return (
                <ItemTile
                  key={`${item.id}-${itemIndex}`}
                  item={item}
                  mode={mode}
                  onAddItemToOrder={onAddItemToOrder}
                  onItemLongPress={onItemLongPress}
                  index={itemIndex}
                  isFixedGrid={false}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default ItemGrid;