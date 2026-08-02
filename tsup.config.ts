import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'streaming/index': 'src/streaming/index.ts',
    'resources/agents': 'src/resources/agents.ts',
    'resources/storage': 'src/resources/storage.ts',
  },
  format: ['cjs', 'esm'],
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
  target: 'es2020',
  platform: 'neutral',
  outDir: 'lib',
  bundle: true,
  splitting: false,
  treeshake: true,
  sourcemap: true,
  dts: true,
  clean: true,
  external: ['axios'],
});
