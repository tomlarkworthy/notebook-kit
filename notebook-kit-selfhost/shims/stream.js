export class PassThrough {
  write() {}
  end() {}
  on() {}
  pipe() { return this; }
}
export const Writable = PassThrough;
export const Readable = PassThrough;
export const Transform = PassThrough;
export const Duplex = PassThrough;
export const pipeline = () => {};
