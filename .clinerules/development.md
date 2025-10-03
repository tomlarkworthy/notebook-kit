# DEVELOPMENT.md for notebook-kit-selfhost

## Project Aim

The primary goal of this project is to create a self-hosting, browser-compatible version of the `@observablehq/notebook-kit` library. The original `notebook-kit` is a command-line tool for generating computational notebooks from HTML files, leveraging Node.js-specific features like file system access, child processes, and a Vite development server. This self-hosting project aims to extract the core notebook transformation logic and make it runnable directly within a web browser, without requiring a Node.js backend for rendering.

This allows users to paste raw notebook HTML into a web interface and have it rendered interactively on the client-side, enabling a fully client-side, portable notebook experience.

## Approaches Taken

To achieve browser compatibility while minimizing modifications to the original `@observablehq/notebook-kit` source code, the following approaches were taken:

1.  **External Project Structure**: A new project directory, `notebook-kit-selfhost`, was created alongside the original `notebook-kit` to house the self-hosting solution. This ensures that the original library's codebase remains untouched.

2.  **Esbuild for Bundling**: `esbuild` was chosen as the bundler due to its speed and flexibility. A custom `build.mjs` script was created to programmatically configure `esbuild`.

3.  **Node.js Module Shimming**: The most significant challenge was resolving Node.js-specific module imports within the `@observablehq/notebook-kit` library and its transitive dependencies. This was addressed using `esbuild`'s plugin system:
    *   **Custom `node-shims` Plugin**: An `esbuild` plugin named `node-shims` was developed to intercept imports of Node.js built-in modules (e.g., `node:fs`, `node:child_process`, `path`, `fs`, `os`, `stream`, `net`, `tls`, `crypto`, `vm`, `http`, `querystring`, `assert`, `perf_hooks`, `node:stream/consumers`, `node:stream`, `node:events`, `node:process`, `node:util`, `zlib`, `node:path/posix`).
    *   **Shim Files**: For each intercepted module, a corresponding shim file was created in the `shims/` directory. These shims provide browser-compatible (often no-op or dummy) implementations of the Node.js APIs. This effectively "turns off" functionalities that are not supported or desired in the browser (e.g., database connectors, child process execution).
    *   **Absolute Paths**: The `onResolve` callbacks in the `node-shims` plugin were configured to return absolute paths to the shim files, resolving `esbuild`'s requirement for absolute paths.

4.  **Excluding Node.js-Specific Libraries**:
    *   **`jsdom` Exclusion**: The original `notebook-kit` uses `jsdom` to create a DOM environment in Node.js. In the browser, the native `DOMParser` and `window` object are available. To prevent `jsdom` from being bundled and causing errors, a `jsdom.js` shim was created. This shim exports a dummy `JSDOM` class that leverages the browser's native `DOMParser`, and `esbuild` was configured to redirect `jsdom` imports to this shim.
    *   **Database Connector Exclusion**: Recognizing that database connections and operations are not feasible or desired in a client-side browser environment, all database-related dependencies (`@databricks/sql`, `@duckdb/node-api`, `@google-cloud/bigquery`, `postgres`, `snowflake-sdk`, `bun:sqlite`, `node:sqlite`) were explicitly marked as `external` in the `esbuild` configuration. This prevents them and their extensive Node.js-specific transitive dependencies from being included in the browser bundle.

5.  **Browser Entry Point (`src/main.js`)**: A JavaScript file was created to serve as the entry point for the browser bundle. This file:
    *   Imports the `observable` plugin from `@observablehq/notebook-kit/vite`.
    *   Initializes the `observable` plugin with the native `DOMParser` and overrides `transformTemplate` and `transformNotebook` to provide dummy contexts suitable for in-browser execution.
    *   Exposes a global `window.processNotebookHtml` function, which takes raw HTML content as input and returns the transformed, interactive notebook HTML.

6.  **Host HTML Page (`index.html`)**: A simple HTML page was created to demonstrate the self-hosting capability. It includes:
    *   A `<textarea>` for users to paste notebook HTML.
    *   A button to trigger the `window.processNotebookHtml` function.
    *   A `<div>` element that dynamically creates an `iframe` to render the transformed HTML, ensuring script execution within an isolated context.

## How to Continue Development

### 1. Project Structure

```
notebook-kit/
├── ... (original notebook-kit files)
└── notebook-kit-selfhost/
    ├── build.mjs             # Esbuild configuration and build script
    ├── dist/                 # Output directory for the browser bundle
    │   └── bundle.js
    ├── index.html            # The self-hosting web interface
    ├── package.json          # Project dependencies and scripts
    ├── shims/                # Node.js module shims
    │   ├── assert.js
    │   ├── ...
    │   └── zlib.js
    └── src/
        └── main.js           # Browser entry point for the bundle
```

### 2. Building the Project

To rebuild the browser bundle after making changes:

```bash
cd notebook-kit-selfhost
node build.mjs
```

This will generate `dist/bundle.js`.

### 3. Running the Self-Hosting Interface

To open the self-hosting interface in your browser:

```bash
cd notebook-kit-selfhost
open index.html
```

You can then paste your notebook HTML into the textarea and click "Render Notebook".

### 5. Improvements


