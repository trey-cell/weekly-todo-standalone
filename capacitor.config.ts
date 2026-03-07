import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.treyr.weeklytodo',
  appName: 'Weekly Todo',
  webDir: 'dist',
  // Uncomment the line below ONLY if using a remote URL (WebView mode):
  server: { url: 'https://weekly-todo-standalone.vercel.app', cleartext: false },
};

export default config;
