
import { Item } from '../types';

// Mapping Headers to Keys
// Handle,SKU,Name,Category,Description,Sold by weight,Option 1 name,Option 1 value,Option 2 name,Option 2 value,Option 3 name,Option 3 value,Cost,Barcode,SKU of included item,Quantity of included item,Track stock,Available for sale [AYSHAS],Price [AYSHAS],In stock [AYSHAS],Low stock [AYSHAS]

const CSV_HEADERS = [
  'Handle', 'SKU', 'Name', 'Category', 'Description', 
  'Sold by weight', 'Option 1 name', 'Option 1 value', 
  'Option 2 name', 'Option 2 value', 'Option 3 name', 'Option 3 value', 
  'Cost', 'Barcode', 'SKU of included item', 'Quantity of included item', 
  'Track stock', 'Available for sale [AYSHAS]', 'Price [AYSHAS]', 
  'In stock [AYSHAS]', 'Low stock [AYSHAS]'
];

export const parseCSV = (csvText: string): Item[] => {
  const lines = csvText.split(/\r\n|\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  
  // Identify Indexes
  const nameIdx = headers.findIndex(h => h === 'Name');
  const catIdx = headers.findIndex(h => h === 'Category');
  const priceIdx = headers.findIndex(h => h.includes('Price [AYSHAS]')); // Flexible matching
  const costIdx = headers.findIndex(h => h === 'Cost');
  const stockIdx = headers.findIndex(h => h.includes('In stock [AYSHAS]'));
  const handleIdx = headers.findIndex(h => h === 'Handle');

  if (nameIdx === -1 || priceIdx === -1) {
    console.error("Missing required columns in CSV");
    return [];
  }

  const newItems: Item[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Basic comma split (WARNING: Doesn't handle quoted commas, but sufficient for simple provided CSV)
    const row = line.split(','); 

    // If row is malformed, skip
    if (row.length < headers.length) continue;

    const name = row[nameIdx]?.trim();
    const category = row[catIdx]?.trim() || 'Uncategorized';
    const priceStr = row[priceIdx]?.trim();
    const costStr = row[costIdx]?.trim();
    const stockStr = row[stockIdx]?.trim();
    const handle = row[handleIdx]?.trim();

    if (!name) continue;

    // Check for variable price (text "variable")
    let price = parseFloat(priceStr);
    if (isNaN(price)) price = 0;

    let stock = parseInt(stockStr, 10);
    if (isNaN(stock)) stock = 0;

    let cost = parseFloat(costStr);
    if (isNaN(cost)) cost = 0;

    newItems.push({
      id: handle || crypto.randomUUID(),
      name,
      category: category || 'General',
      price,
      cost,
      stock,
      representation: 'color', // Default for CSV import
      color: '#3b82f6', // Default Blue
      shape: 'square'
    });
  }

  return newItems;
};

export const generateCSV = (items: Item[]): string => {
  const headerRow = CSV_HEADERS.join(',');
  const rows = items.map(item => {
    const rowData = new Array(CSV_HEADERS.length).fill('');
    
    // Map Item data back to specific indexes
    // 'Handle', 'SKU', 'Name', 'Category', ...
    
    rowData[0] = item.id; // Handle
    rowData[2] = item.name; // Name
    rowData[3] = item.category; // Category
    rowData[12] = item.cost ? item.cost.toFixed(2) : '0.00'; // Cost
    rowData[18] = item.price.toFixed(2); // Price [AYSHAS]
    rowData[19] = item.stock.toString(); // In stock [AYSHAS]
    
    // Fill defaults
    rowData[16] = 'Y'; // Track stock
    rowData[17] = 'Y'; // Available for sale

    return rowData.join(',');
  });

  return [headerRow, ...rows].join('\n');
};
