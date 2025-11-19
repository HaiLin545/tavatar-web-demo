import { wasmBase64 } from "./util/import-base-64";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [wasmBase64()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },     
  },
  base: "/",
  build: {
    // 启用压缩
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // 移除console.log
        drop_debugger: true, // 移除debugger
        pure_funcs: ["console.log"], // 移除特定函数调用
      },
    },
    // 启用gzip压缩
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: "index.html",
        viewer: "viewer.html",
      },
      output: {
        manualChunks: {
          vendor: ["three"],
          utils: ["./viewer/Util.js", "./viewer/Constants.js"],
        },
      },
    },
  },
});
