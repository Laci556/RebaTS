import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  dts: true,
  format: ["cjs", "esm"],
  clean: true,
});
