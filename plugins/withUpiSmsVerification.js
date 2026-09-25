const { withAndroidManifest, createRunOncePlugin } = require('@expo/config-plugins');

function withUpiSmsVerification(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const permissions = new Set((manifest['uses-permission'] ?? []).map((p) => p.$?.['android:name']));
    if (!permissions.has('android.permission.RECEIVE_SMS')) {
      manifest['uses-permission'] = [
        ...(manifest['uses-permission'] ?? []),
        { $: { 'android:name': 'android.permission.RECEIVE_SMS' } },
      ];
    }
    return mod;
  });
}

module.exports = createRunOncePlugin(withUpiSmsVerification, 'with-upi-sms-verification', '1.0.0');
