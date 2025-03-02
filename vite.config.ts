import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  base: process.env.BASE_PATH + '/' || '/',
  server: {
    allowedHosts: ["innovation.atecna.fr"]
  },
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        // v3_lazyRouteDiscovery: true, // Désactivé car cause des erreurs en production
      },
      basename: process.env.BASE_PATH || '/',
    }),
    tsconfigPaths(),
  ],
});
