export function observe<T>(initialize: (change: (value: T) => void) => unknown): AsyncGenerator<T, void, unknown> {
  let resolve: ((value: T) => void) | undefined;
  let reject: ((error: Error) => void) | undefined;
  let value: T | undefined;
  let stale = false;

  const dispose = initialize((x) => {
    value = x;
    if (resolve) {
      resolve(x);
      resolve = reject = undefined;
    } else {
      stale = true;
    }
    return x;
  });

  if (dispose != null && typeof dispose !== "function") {
    throw new Error(
      typeof dispose === "object" && "then" in dispose && typeof dispose.then === "function"
        ? "async initializers are not supported"
        : "initializer returned something, but not a dispose function"
    );
  }

  return {
    next(): Promise<IteratorResult<T, void>> {
      return stale
        ? ((stale = false), Promise.resolve({ done: false as const, value: value as T }))
        : new Promise<T>((res, rej) => ((resolve = res), (reject = rej))).then((v) => ({
            done: false as const,
            value: v,
          }));
    },
    return(): Promise<IteratorResult<T, void>> {
      // Reject pending promises so no-one is left hanging
      if (reject) {
        reject(new Error("Generator returned"));
        resolve = reject = undefined;
      }
      if (dispose != null) {
        (dispose as () => void)();
      }
      return Promise.resolve({ done: true as const, value: undefined });
    },
    throw(e?: unknown): Promise<IteratorResult<T, void>> {
      // Reject pending promises
      if (reject) {
        reject(e instanceof Error ? e : new Error(String(e)));
        resolve = reject = undefined;
      }
      if (dispose != null) {
        (dispose as () => void)();
      }
      return Promise.resolve({ done: true as const, value: undefined });
    },
    [Symbol.asyncIterator]() {
      return this;
    },
    async [Symbol.asyncDispose]() {
      await this.return();
    },
  };
}
