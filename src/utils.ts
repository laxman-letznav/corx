export const isPromise = (obj: any): boolean => {
  return obj && typeof obj.subscribe !== 'function' && typeof obj.then === 'function';
};
