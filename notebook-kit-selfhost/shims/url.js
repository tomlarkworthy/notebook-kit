export const fileURLToPath = (url) => url.replace(/^file:\/\//, '');
export const pathToFileURL = (path) => `file://${path}`;
// A basic shim for import.meta.resolve, might need refinement depending on usage
export const URL = globalThis.URL;
