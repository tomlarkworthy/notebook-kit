export const readFile = async (path, encoding) => {
  if (path === 'observablehq/templates/default.html') {
    return `<!DOCTYPE html><html><head><title></title></head><body><main></main></body></html>`;
  }
  throw new Error(`fs/promises.readFile is not supported in the browser for path: ${path}`);
};
export const mkdir = async () => { /* no-op */ };
// Add other fs/promises methods as needed
