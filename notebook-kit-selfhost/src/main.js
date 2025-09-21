import { observable } from '@observablehq/notebook-kit/vite';

// We need to provide a DOMParser instance for the observable plugin.
// In a browser environment, we can use the native DOMParser.
const browserDOMParser = new DOMParser();

// The observable plugin expects a template path, but in our self-hosting
// scenario, we'll provide the template content directly.
// For now, we'll use a dummy template path, as the transformIndexHtml handler
// will receive the input HTML directly.
const dummyTemplatePath = 'observablehq/templates/default.html';

const observablePlugin = observable({
  parser: browserDOMParser,
  template: dummyTemplatePath,
  // We'll override transformTemplate to simply return the input,
  // as we're providing the full HTML to the transform function.
  transformTemplate: async (source, context) => {
    // In a browser context, we don't have access to the file system to read a template.
    // The input 'source' here would be the content of the dummyTemplatePath,
    // which we don't actually use. We need to ensure the transformIndexHtml
    // handler gets the actual notebook HTML.
    // For now, we'll return a minimal valid HTML structure.
    return `<!DOCTYPE html><html><head><title></title></head><body><main></main></body></html>`;
  },
  transformNotebook: async (notebook, context) => {
    // The original observable plugin expects a file path for context.filename.
    // We'll provide a dummy path for now.
    context.filename = '/notebook.html';
    return notebook;
  }
});

// Expose a function to process notebook HTML
window.processNotebookHtml = async (htmlContent) => {
  const context = {
    path: '/notebook.html', // Dummy path for context
    filename: '/notebook.html', // Dummy filename for context
    server: {
      hot: {
        send: () => {} // No-op for HMR in self-hosted context
      }
    }
  };

  // The transformIndexHtml handler expects the raw HTML input.
  // We need to call the handler directly.
  let transformedHtml = await observablePlugin.transformIndexHtml.handler(htmlContent, context);

  // Replace observable: URLs with paths to node_modules
  transformedHtml = transformedHtml.replace(/observable:runtime/g, './node_modules/@observablehq/notebook-kit/dist/src/runtime/index.js');
  transformedHtml = transformedHtml.replace(/observable:styles\/theme-(\w+)\.css/g, './node_modules/@observablehq/notebook-kit/dist/src/styles/theme-$1.css');
  transformedHtml = transformedHtml.replace(/observable:styles\/(global\.css|inspector\.css|highlight\.css|plot\.css|index\.css|syntax-dark\.css|syntax-light\.css|abstract-dark\.css|abstract-light\.css)/g, './node_modules/@observablehq/notebook-kit/dist/src/styles/$1');

  // Inject import map for bare module specifiers
  const importMap = {
    imports: {
      "@observablehq/runtime": "./node_modules/@observablehq/runtime/src/index.js",
      "@observablehq/inspector": "./node_modules/@observablehq/inspector/src/index.js",
      // Add other @observablehq modules if they appear as bare specifiers
      // For example, if you see "@observablehq/parser", add it here:
      // "@observablehq/parser": "./node_modules/@observablehq/parser/dist/parser.js"
    }
  };
  const importMapScript = `<script type="importmap">${JSON.stringify(importMap, null, 2)}</script>`;
  transformedHtml = transformedHtml.replace(/<head>/, `<head>\n${importMapScript}`);

  return transformedHtml;
};

console.log('Notebook Kit self-hosting module loaded.');
