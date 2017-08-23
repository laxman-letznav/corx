export const neverResolve = <T>() => new Promise<T>(() => null);
