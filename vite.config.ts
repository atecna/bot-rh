import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

const isProd = process.env.NODE_ENV === "production";

console.log("--------------------------------");
console.log("isProd", isProd);
console.log("process.env.NODE_ENV", process.env.NODE_ENV);
console.log("process.env.BASE_PATH", process.env.BASE_PATH);
console.log("--------------------------------");

const config = defineConfig({
  ...(isProd ? { base: "/bot-rh/" } : {}),
  server: {
    allowedHosts: ["innovation.atecna.fr"],
  },
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      ...(isProd ? { basename: "/bot-rh" } : {}),
    }),
    tsconfigPaths(),
  ],
});

export default config;
