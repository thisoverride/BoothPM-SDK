import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/lib/boothSdk.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: true,
  outDir: 'lib'
});
