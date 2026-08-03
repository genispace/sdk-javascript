const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { build } = require('esbuild');

const root = path.resolve(__dirname, '..');

describe('published browser and Node package contracts', () => {
  test('exposes streaming APIs through both ESM and CommonJS entry points', () => {
    const esmEntry = pathToFileURL(path.join(root, 'lib/index.mjs')).href;
    const esmExports = JSON.parse(execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `import * as sdk from ${JSON.stringify(esmEntry)}; process.stdout.write(JSON.stringify({ AgentStreamClient: typeof sdk.AgentStreamClient, AgentStreamDecoder: typeof sdk.AgentStreamDecoder }));`,
      ],
      { encoding: 'utf8' },
    ));
    const cjs = require('../lib/index.cjs');

    expect(esmExports.AgentStreamClient).toBe('function');
    expect(esmExports.AgentStreamDecoder).toBe('function');
    expect(cjs.AgentStreamClient).toBeDefined();
    expect(cjs.AgentStreamDecoder).toBeDefined();
  });

  test('bundles the public ESM entry for browsers without Node-only axios dependencies', async () => {
    const result = await build({
      stdin: {
        contents: "import { AgentStreamClient } from './lib/index.mjs'; window.Client = AgentStreamClient;",
        resolveDir: root,
        sourcefile: 'browser-contract.js',
      },
      bundle: true,
      platform: 'browser',
      format: 'esm',
      write: false,
      logLevel: 'silent',
    });

    expect(result.outputFiles).toHaveLength(1);
    expect(result.outputFiles[0].text).toContain('AgentStreamClient');
    expect(result.outputFiles[0].text).not.toContain('form-data');
  });

  test('package exports point to generated artifacts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    for (const condition of ['types', 'import', 'require']) {
      expect(fs.existsSync(path.join(root, pkg.exports['.'][condition]))).toBe(true);
    }
  });

  test('public declarations compile for streaming and agent resume APIs', () => {
    execFileSync(
      path.join(root, 'node_modules/.bin/tsc'),
      [
        '--noEmit',
        '--target', 'ES2020',
        '--module', 'ESNext',
        '--moduleResolution', 'Bundler',
        '--skipLibCheck',
        path.join(root, 'tests/fixtures/public-api.ts'),
      ],
      { encoding: 'utf8' },
    );
  });
});
