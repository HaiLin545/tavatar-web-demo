export function wasmBase64() {
  return {
    name: "wasm-base64",
    load(id) {
      if (id.endsWith(".wasm")) {
        const fs = require("fs");
        const wasmBuffer = fs.readFileSync(id);
        const base64 = wasmBuffer.toString("base64");
        return `export default "${base64}";`;
      }
    },
  };
}
