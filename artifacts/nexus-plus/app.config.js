const base = require('./app.json');

module.exports = ({ config }) => ({
  ...base.expo,
  ...config,
  android: {
    ...base.expo.android,
    ...config?.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON || base.expo.android.googleServicesFile || undefined,
  },
});
