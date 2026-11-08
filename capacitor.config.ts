import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.okankilic.myverge',
  appName: 'Wishcrumbs',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: '#A4552F',
    },
  },
};

export default config;
