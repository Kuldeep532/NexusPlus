module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON || config.android?.googleServicesFile,
  },
  plugins: [
    ...(config.plugins || []).filter((plugin) => plugin !== 'expo-splash-screen'),
    [
      'expo-splash-screen',
      {
        image: './assets/generated-branding/nexus-plus-1024.png',
        backgroundColor: '#120B24',
        imageWidth: 220,
        resizeMode: 'contain',
      },
    ],
  ],
});
