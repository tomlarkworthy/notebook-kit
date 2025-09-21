export const existsSync = () => false;
export const createWriteStream = () => ({
  write: () => {},
  end: () => {},
  on: () => {}
});
export const createReadStream = () => ({
  on: () => {},
  pipe: () => {},
  destroy: () => {}
});
// Add other fs methods as needed, returning no-op or throwing errors
