
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
    console.warn("cordova-plugin-android-permissions not detected. Assuming web environment.");
    return true;
  }

  const permissions = window.cordova.plugins.permissions;

  // 2. List of permissions to request
  // We use raw strings for Android 12+ specific permissions to ensure compatibility
  const permissionsList = [
    // Android 12+ Bluetooth (API 31+)
    'android.permission.BLUETOOTH_SCAN',
    'android.permission.BLUETOOTH_CONNECT',
    // Location (Required for Bluetooth scanning on Android 6-11)
    permissions.ACCESS_FINE_LOCATION,
    permissions.ACCESS_COARSE_LOCATION,
    // Storage
    permissions.WRITE_EXTERNAL_STORAGE,
    permissions.READ_EXTERNAL_STORAGE
  ];

  // 3. Request Permissions
  // We use requestPermissions directly instead of checkPermission for arrays,
  // as it handles the check logic internally and is more reliable across plugin versions.
  return new Promise((resolve) => {
    permissions.requestPermissions(
      permissionsList,
      (status: any) => {
        if (!status.hasPermission) {
          console.warn("User denied one or more permissions.");
        }
        resolve(!!status.hasPermission);
      },
      (error: any) => {
        console.error("Permission request failed", error);
        resolve(false);
      }
    );
  });
};
