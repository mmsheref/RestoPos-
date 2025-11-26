
declare global {
  interface Window {
    cordova: any;
  }
}

/**
 * Requests necessary permissions for Bluetooth Scanning/Printing.
 * Handles differences between Android 12+ (API 31) and older versions.
 * No longer requests storage permissions as Capacitor's Filesystem API handles its own scope.
 */
export const requestAppPermissions = async (): Promise<boolean> => {
  console.log("[Permissions] Starting permission request check...");

  // 1. If not on a device or Cordova not loaded, return true (dev/web mode)
  if (!window.cordova || !window.cordova.plugins || !window.cordova.plugins.permissions) {
    console.warn("[Permissions] cordova-plugin-android-permissions not detected. Assuming web environment.");
    return true;
  }

  const permissions = window.cordova.plugins.permissions;

  // 2. List of permissions to request for Bluetooth functionality
  // Modern storage permissions are handled by the Filesystem plugin itself.
  const permissionsList = [
    // Android 12+ Bluetooth (API 31+)
    'android.permission.BLUETOOTH_SCAN',
    'android.permission.BLUETOOTH_CONNECT',
    // Location (Required for Bluetooth scanning on Android 6-11)
    permissions.ACCESS_FINE_LOCATION,
    permissions.ACCESS_COARSE_LOCATION,
  ];

  console.log("[Permissions] Requesting hardware permissions:", permissionsList);

  // 3. Request Permissions
  return new Promise((resolve) => {
    permissions.requestPermissions(
      permissionsList,
      (status: any) => {
        console.log("[Permissions] Status response:", status);
        if (!status.hasPermission) {
          console.warn("[Permissions] User denied one or more hardware permissions.");
        } else {
          console.log("[Permissions] All necessary hardware permissions granted.");
        }
        resolve(!!status.hasPermission);
      },
      (error: any) => {
        console.error("[Permissions] Request failed with error:", error);
        resolve(false);
      }
    );
  });
};
