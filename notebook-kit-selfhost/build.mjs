import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await esbuild.build({
  entryPoints: [join(__dirname, 'src', 'main.js')],
  bundle: true,
  outfile: join(__dirname, 'dist', 'bundle.js'),
  format: 'esm',
  platform: 'browser',
  external: [
    'node:child_process', 'node:fs', 'node:fs/promises', 'node:path', 'node:url', 'node:util',
    'node:stream/consumers', 'node:stream', 'node:events', 'node:process',
    'path', 'fs', 'os', 'stream', 'net', 'tls', 'crypto', 'vm', 'http', 'querystring', 'assert', 'perf_hooks',
    'bun:sqlite', 'node:sqlite', 'zlib',
    'jsdom', // Exclude jsdom as we use native DOMParser in browser
    '@databricks/sql', '@duckdb/node-api', '@google-cloud/bigquery', 'postgres', 'snowflake-sdk' // Exclude database connectors
  ],
  plugins: [
    {
      name: 'node-shims',
      setup(build) {
        // Shim for node:child_process
        build.onResolve({ filter: /^node:child_process$/ }, () => ({ path: join(__dirname, 'shims', 'child_process.js') }));
        // Shim for node:fs
        build.onResolve({ filter: /^node:fs$/ }, () => ({ path: join(__dirname, 'shims', 'fs.js') }));
        // Shim for node:fs/promises
        build.onResolve({ filter: /^node:fs\/promises$/ }, () => ({ path: join(__dirname, 'shims', 'fs_promises.js') }));
        // Shim for node:path
        build.onResolve({ filter: /^node:path$/ }, () => ({ path: join(__dirname, 'shims', 'path.js') }));
        // Shim for node:url
        build.onResolve({ filter: /^node:url$/ }, () => ({ path: join(__dirname, 'shims', 'url.js') }));
        // Shim for node:util
        build.onResolve({ filter: /^node:util$/ }, () => ({ path: join(__dirname, 'shims', 'util.js') }));
        // Additional shims for non-node: prefixed modules
        build.onResolve({ filter: /^path$/ }, () => ({ path: join(__dirname, 'shims', 'path.js') }));
        build.onResolve({ filter: /^fs$/ }, () => ({ path: join(__dirname, 'shims', 'fs.js') }));
        build.onResolve({ filter: /^os$/ }, () => ({ path: join(__dirname, 'shims', 'os.js') }));
        build.onResolve({ filter: /^stream$/ }, () => ({ path: join(__dirname, 'shims', 'stream.js') }));
        build.onResolve({ filter: /^net$/ }, () => ({ path: join(__dirname, 'shims', 'net.js') }));
        build.onResolve({ filter: /^tls$/ }, () => ({ path: join(__dirname, 'shims', 'tls.js') }));
        build.onResolve({ filter: /^crypto$/ }, () => ({ path: join(__dirname, 'shims', 'crypto.js') }));
        build.onResolve({ filter: /^vm$/ }, () => ({ path: join(__dirname, 'shims', 'vm.js') }));
        build.onResolve({ filter: /^http$/ }, () => ({ path: join(__dirname, 'shims', 'http.js') }));
        build.onResolve({ filter: /^querystring$/ }, () => ({ path: join(__dirname, 'shims', 'querystring.js') }));
        build.onResolve({ filter: /^assert$/ }, () => ({ path: join(__dirname, 'shims', 'assert.js') }));
        build.onResolve({ filter: /^perf_hooks$/ }, () => ({ path: join(__dirname, 'shims', 'perf_hooks.js') }));
        build.onResolve({ filter: /^node:stream\/consumers$/ }, () => ({ path: join(__dirname, 'shims', 'stream_consumers.js') }));
        build.onResolve({ filter: /^node:stream$/ }, () => ({ path: join(__dirname, 'shims', 'stream.js') }));
        build.onResolve({ filter: /^node:events$/ }, () => ({ path: join(__dirname, 'shims', 'events.js') }));
        build.onResolve({ filter: /^node:process$/ }, () => ({ path: join(__dirname, 'shims', 'process.js') }));
        build.onResolve({ filter: /^node:util$/ }, () => ({ path: join(__dirname, 'shims', 'util.js') }));
      },
    },
  ],
});

console.log('Build complete!');
