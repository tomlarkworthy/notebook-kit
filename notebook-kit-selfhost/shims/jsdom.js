export class JSDOM {
  constructor() {
    return {
      window: {
        DOMParser: globalThis.DOMParser,
        // Add other window properties if needed by notebook-kit,
        // but for now, DOMParser should be sufficient.
      }
    };
  }
}
