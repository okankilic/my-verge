import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.okankilic.myverge',
  appName: 'Nowish',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: '#B45309',
    },
  },
};

export default config;
