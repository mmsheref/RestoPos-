
declare global {
  interface Window {
    cordova: any;
  }
}

/**
 * Requests necessary permissions for Bluetooth Scanning/Printing and Storage.
 * Handles differences between Android 12+ (API 31) and older versions.
 */
export const requestAppPermissions = async (): Promise<boolean> => {
  // 1. If not on a device or Cordova not loaded, return true (dev/web mode)
  if (!window.cordova || !window.cordova.plugins || !window.cordova.plugins.permissions) {
    console.warn("cordova-plugin-android-permissions not detected. Assuming web environment or permissions handled natively.");
    return true;
  }

  const permissions = window.cordova.plugins.permissions;

  // List of permissions to request
  // We use raw strings for Android 12+ specific permissions in case the plugin types are outdated
  const permissionsList = [
    // Android 12+ Bluetooth
    'android.permission.BLUETOOTH_SCAN',
    'android.permission.BLUETOOTH_CONNECT',
    // Location (Required for Bluetooth scanning on Android < 12)
    permissions.ACCESS_FINE_LOCATION,
    permissions.ACCESS_COARSE_LOCATION,
    // Storage
    permissions.WRITE_EXTERNAL_STORAGE,
    permissions.READ_EXTERNAL_STORAGE
  ];

  return new Promise((resolve) => {
    // First, check if we already have them
    permissions.checkPermission(permissionsList, (status: any) => {
      if (status.hasPermission) {
        resolve(true);
      } else {
        // If not, request them
        console.log("Requesting Android Permissions...");
        permissions.requestPermissions(
          permissionsList,
          (status: any) => {
            if (!status.hasPermission) {
              alert("Permissions are required to scan for printers and save files.");
            }
            resolve(status.hasPermission);
          },
          (error: any) => {
            console.error("Permission request failed", error);
            alert("Failed to request permissions. Please check App Settings.");
            resolve(false);
          }
        );
      }
    }, (err: any) => {
      // Fallback: just try to request if check fails
      permissions.requestPermissions(permissionsList, (s: any) => resolve(s.hasPermission), () => resolve(false));
    });
  });
};
