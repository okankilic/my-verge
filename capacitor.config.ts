import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.okankilic.myverge',
  appName: 'Willa',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: '#5B3FD9',
    },
  },
};

export default config;
