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
  const transformedHtml = await observablePlugin.transformIndexHtml.handler(htmlContent, context);
  return transformedHtml;
};

console.log('Notebook Kit self-hosting module loaded.');
