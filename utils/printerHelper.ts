
import { OrderItem, Printer } from '../types';
import { requestAppPermissions } from './permissions';

declare global {
  interface Window {
    bluetoothSerial: any;
  }
}

// Basic ESC/POS Commands
const ESC = '\x1b';
const GS = '\x1d';
const COMMANDS = {
  INIT: ESC + '@',
  CENTER: ESC + 'a' + '\x01',
  LEFT: ESC + 'a' + '\x00',
  RIGHT: ESC + 'a' + '\x02',
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  CUT: GS + 'V' + '\x41' + '\x00',
};

export const printReceipt = async (items: OrderItem[], total: number, printer?: Printer) => {
  if (!printer) {
    alert("No printer configured. Please add a printer in Settings.");
    return;
  }

  // 1. Native Bluetooth Printing
  if (printer.interfaceType === 'Bluetooth' && window.bluetoothSerial) {
    try {
      // Request Permissions before connecting
      const hasPermission = await requestAppPermissions();
      if (!hasPermission) {
        console.warn("Bluetooth permissions denied. Aborting print.");
        return;
      }

      // Check connection
      const isConnected = await new Promise<boolean>(resolve => {
        window.bluetoothSerial.isConnected(
          () => resolve(true),
          () => resolve(false)
        );
      });

      // Connect if not connected
      if (!isConnected) {
        // alert(`Connecting to ${printer.name}...`);
        await new Promise((resolve, reject) => {
          window.bluetoothSerial.connect(
            printer.address, 
            resolve, 
            (err: any) => reject(err)
          );
        });
      }

      // Construct Receipt Data
      let data = '';
      data += COMMANDS.INIT;
      data += COMMANDS.CENTER + COMMANDS.BOLD_ON + "RESTAURANT POS\n" + COMMANDS.BOLD_OFF;
      data += "123 Food Street, City\n";
      data += "--------------------------------\n";
      data += COMMANDS.LEFT;

      items.forEach(item => {
        const lineTotal = (item.price * item.quantity).toFixed(2);
        // Simple spacing logic (adjust based on 58mm/80mm)
        const name = item.name.length > 16 ? item.name.substring(0, 16) : item.name;
        data += `${item.quantity}x ${name} ${lineTotal}\n`;
      });

      data += "--------------------------------\n";
      data += COMMANDS.RIGHT + COMMANDS.BOLD_ON + `TOTAL: ${total.toFixed(2)}\n` + COMMANDS.BOLD_OFF;
      data += "\n\n" + COMMANDS.CUT;

      // Send to printer
      window.bluetoothSerial.write(data, 
        () => console.log("Print success"), 
        (err: any) => alert("Print Error: " + JSON.stringify(err))
      );

    } catch (error) {
      alert(`Failed to connect to printer: ${error}`);
    }
  } 
  // 2. Web/Simulation Fallback
  else {
    const billText = items.map(i => `${i.quantity}x ${i.name.padEnd(20)} ${(i.price * i.quantity).toFixed(2)}`).join('\n');
    const mode = window.bluetoothSerial ? "Native (Plugin Found but mismatch)" : "Web Simulation";
    alert(`🖨️ [${mode}] Printing to ${printer.name}:\n\n${billText}\n\n----------------\nTotal: ₹${total.toFixed(2)}`);
  }
};
