// Polyfill stub for Node stream module in browser/Vite environment
export const Readable = class {};
export const Writable = class {};
export const Transform = class {};
export const Duplex = class {};

const stream = {
  Readable,
  Writable,
  Transform,
  Duplex,
};

export default stream;
