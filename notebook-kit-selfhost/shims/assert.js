export const strict = {
  ok: (value, message) => {
    if (!value) {
      console.warn('Assertion failed:', message || 'No message provided');
    }
  },
  equal: (actual, expected, message) => {
    if (actual !== expected) {
      console.warn('Assertion failed:', message || `Expected ${expected}, got ${actual}`);
    }
  },
  // Add other assertion methods as needed
};
export default strict.ok;
