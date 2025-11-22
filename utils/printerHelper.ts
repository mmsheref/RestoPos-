
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

/**
 * Checks if a specific device is currently connected.
 */
export const checkPrinterConnection = async (): Promise<boolean> => {
  if (!window.bluetoothSerial) return false;
  return new Promise((resolve) => {
    window.bluetoothSerial.isConnected(
      () => resolve(true),
      () => resolve(false)
    );
  });
};

/**
 * Connects to a printer if not already connected.
 */
const ensureConnection = async (address: string): Promise<void> => {
  const isConnected = await checkPrinterConnection();
  if (!isConnected) {
    return new Promise((resolve, reject) => {
      window.bluetoothSerial.connect(
        address,
        () => resolve(),
        (err: any) => reject(err)
      );
    });
  }
};

/**
 * Sends a small test print to verify configuration and connectivity.
 */
export const testPrint = async (printer: Printer): Promise<{ success: boolean; message: string }> => {
  // 1. Web Fallback
  if (!window.bluetoothSerial) {
    console.log(`Test Print for ${printer.name} (${printer.address})`);
    alert(`Simulated Test Print:\n\n[PRINTER: ${printer.name}]\n[INTERFACE: ${printer.interfaceType}]\n\nConnection Successful!`);
    return { success: true, message: "Simulated test print successful" };
  }

  // 2. Native Logic
  if (printer.interfaceType !== 'Bluetooth') {
    return { success: false, message: "Only Bluetooth test printing is currently supported." };
  }

  try {
    // Permission check
    const hasPermission = await requestAppPermissions();
    if (!hasPermission) {
      return { success: false, message: "Bluetooth permissions denied." };
    }

    // Connect
    await ensureConnection(printer.address!);

    // Prepare Data
    let data = COMMANDS.INIT;
    data += COMMANDS.CENTER + COMMANDS.BOLD_ON + "TEST PRINT\n" + COMMANDS.BOLD_OFF;
    data += "--------------------------------\n";
    data += COMMANDS.LEFT;
    data += `Device: ${printer.name}\n`;
    data += `Addr: ${printer.address}\n`;
    data += "Status: Connected\n";
    data += "--------------------------------\n";
    data += COMMANDS.CENTER + "It Works!\n";
    data += "\n\n" + COMMANDS.CUT;

    // Send
    return new Promise((resolve) => {
      window.bluetoothSerial.write(
        data,
        () => resolve({ success: true, message: "Test print sent successfully." }),
        (err: any) => resolve({ success: false, message: `Write failed: ${JSON.stringify(err)}` })
      );
    });

  } catch (error) {
    return { success: false, message: `Connection failed: ${JSON.stringify(error)}` };
  }
};

export const printReceipt = async (items: OrderItem[], total: number, printer?: Printer) => {
  if (!printer) {
    alert("No printer configured. Please add a printer in Settings.");
    return;
  }

  // 1. Native Bluetooth Printing
  if (printer.interfaceType === 'Bluetooth' && window.bluetoothSerial) {
    try {
      const hasPermission = await requestAppPermissions();
      if (!hasPermission) {
        console.warn("Bluetooth permissions denied. Aborting print.");
        return;
      }

      await ensureConnection(printer.address!);

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
