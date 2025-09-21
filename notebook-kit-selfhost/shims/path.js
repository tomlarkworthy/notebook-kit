export const dirname = (path) => path.split('/').slice(0, -1).join('/');
export const join = (...paths) => paths.join('/');
export const resolve = (...paths) => paths.join('/'); // Simplified for browser context
export const relative = (from, to) => {
  const fromParts = from.split('/');
  const toParts = to.split('/');
  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
    i++;
  }
  let result = '';
  for (let j = i; j < fromParts.length; j++) {
    result += '../';
  }
  for (let j = i; j < toParts.length; j++) {
    result += toParts[j] + (j === toParts.length - 1 ? '' : '/');
  }
  return result;
};
