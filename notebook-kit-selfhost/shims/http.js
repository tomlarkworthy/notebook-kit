export default {};
export const STATUS_CODES = {};
export const get = () => { throw new Error('http.get is not supported in the browser.'); };
export const request = () => { throw new Error('http.request is not supported in the browser.'); };
