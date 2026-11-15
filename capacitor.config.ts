import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.okankilic.wishcrumbs',
  appName: 'Wishcrumbs',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: '#A4552F',
    },
  },
};

export default config;
