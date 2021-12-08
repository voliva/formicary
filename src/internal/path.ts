import { State } from "derive-state";
import { isSubfield } from "./subfield";

//// STRING PATHS ////
type MappedKey<K extends string, V> =
  | K
  | `${K}${V extends Array<infer A>
      ? `.${number}` | `.${number}.${Paths<A>}`
      : V extends Record<string, any>
      ? `.${Paths<V>}`
      : ""}`;
type KeyMap<T> = {
  [K in keyof T & string]: MappedKey<K, T[K]>;
};
export type Paths<T> = KeyMap<T>[keyof T & string];

type NotNil<T> = Exclude<T, undefined | null>;
export type ValueOfPath<TValues, Path> = Path extends keyof TValues
  ? TValues[Path] // Leaf node, it's just whatever the type of the prop is
  : Path extends `${infer Prop}.${infer Rest}` // If it can be split with a dot
  ? Prop extends keyof TValues // If the first part is a key of the object
    ? ValueOfPath<NotNil<TValues[Prop]>, Rest>
    : unknown
  : unknown;

// eslint-disable-next-line @typescript-eslint/ban-types
const internal = Symbol("internal");
export type Key<T, P extends Paths<T>, R> = { [internal]: [T, P, R] }; // This is actually a TS trick
// the path is going to be just the string. But if we prevent TS from understanding it as a string
// then we can infer the original `T` from that path, so that we can later on work with it
export function createKeyFn<T>() {
  return <P extends Paths<T>>(path: P): Key<T, P, ValueOfPath<T, P>> =>
    path as any;
}

/// PROXY ///
const PATH_RESULT = Symbol("path");

const getProxyHandler = (): ProxyHandler<{ path: string }> => {
  const handler: ProxyHandler<{ path: string }> = {
    get: (target, prop, receiver) => {
      if (prop === PATH_RESULT) {
        return target.path;
      }
      if (typeof prop === "symbol") {
        throw new Error(`Can't serialize symbols to keys`);
      }
      const newPath =
        typeof prop === "number" || !isNaN(prop as any)
          ? `${target.path}[${prop}]`
          : target.path.length
          ? `${target.path}.${prop}`
          : prop;

      if (target.path.length === 0)
        return new Proxy(
          {
            path: newPath,
          },
          handler
        );
      target.path = newPath;

      return receiver;
    },
  };
  return handler;
};

export type KeySelector<TValues, T> = (values: TValues) => T;
export type KeysSelector<TValues, R extends ReadonlyArray<any>> = (
  values: TValues
) => R;

// interface Foo {
//   bar: string;
//   baz?: { bob: number };
// }

// declare function useInputExplicit<
//   T,
//   P extends Paths<T>,
//   R extends ValueOfPath<T, P>
// >(foo: T, path: P, validator: (value: R) => boolean): R;
// declare function useInputExplicit<T, R>(
//   foo: T,
//   keySelector: KeySelector<T, R>,
//   validator: (value: R) => boolean
// ): R;
// const r = useInputExplicit(
//   null as any as Foo,
//   (v) => v.baz!.bob,
//   (v: number | null) => true
// );

// declare function useInputImplicit<T>(
//   path: string,
//   validator?: (value: T) => boolean
// ): T;
// declare function useInputImplicit<T, R>(
//   path: Key<T, Paths<T>, R>,
//   validator: (value: R) => boolean
// ): R;
// declare function useInputImplicit<T, R>(
//   keySelector: KeySelector<T, R>,
//   validator: (value: R) => boolean
// ): R;
// const kf = createKeyFn<Foo>();
// const r2 = useInputImplicit(kf("baz.bob"), (v) => true);

// declare function useValuesExplicit<T, P extends Paths<T>[]>(
//   foo: T,
//   ...paths: P
// ): { [K in keyof P]: ValueOfPath<T, P[K]> };
// declare function useValuesExplicit<T, R extends ReadonlyArray<any>>(
//   foo: T,
//   keySelectors: KeysSelector<T, R>
// ): R;
// const r3 = useValuesExplicit(null as any as Foo, "bar", "baz.bob");
// const r4 = useValuesExplicit(null as any as Foo, (v) => [v.bar, v.baz?.bob]);

// declare function useValuesImplicit(
//   ...paths: string[]
// ): any[];
// declare function useValuesImplicit<P extends Key<any, any, any>[]>(
//   ...keys: P
// ): { [K in keyof P]: P[K] extends Key<any, any, infer R> ? R : unknown };
// declare function useValuesImplicit<T, R extends ReadonlyArray<any>>(
//   keySelectors: KeysSelector<T, R>
// ): R;
// const r5 = useValuesImplicit("bar", "baz.bob");
// const r6 = useValuesImplicit(kf('bar'), kf('baz.bob'));
// const r7 = useValuesImplicit((v: Foo) => [v.bar, v.baz!.bob] as const);

export const getKey = (keySelector: KeySelector<any, any>): string => {
  if (typeof keySelector === "string") return keySelector;
  const proxy = new Proxy({ path: "" }, getProxyHandler());
  const result = keySelector(proxy);
  if (!(PATH_RESULT in result)) {
    throw new Error(
      `You must return a value from the argument in the selector function`
    );
  }
  return result[PATH_RESULT];
};
export const getKeys = (keysSelector: KeysSelector<any, any[]>): string[] => {
  if (typeof keysSelector === "object") return keysSelector;
  const proxy = new Proxy({ path: "" }, getProxyHandler());
  const result = keysSelector(proxy);
  if (result.some((r) => !(PATH_RESULT in r))) {
    throw new Error(
      `You must return a value from the argument in the selector function`
    );
  }
  return result.map((r) => r[PATH_RESULT]);
};

/// UTILS ///
export const getMapValue = (key: string, map: Map<string, State<any>>) => {
  if (!map.has(key)) {
    map.set(key, new State<any>());
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return map.get(key)!;
};

export const getKeyValues = (input: any) => {
  const result: Record<string, any> = {};
  if (!input) {
    return result;
  }

  if (typeof input !== "object") {
    throw new Error("Model must be an object");
  }
  const prefix = Array.isArray(input)
    ? (k: string) => `[${k}]`
    : (k: string) => k;
  Object.entries(input).forEach(([key, value]) => {
    const prefixValue = prefix(key);
    if ((isPlainObject(value) || Array.isArray(value)) && isSubfield(value)) {
      const inner = getKeyValues(value);
      Object.entries(inner).forEach(([innerKey, innerValue]) => {
        const chain = innerKey.startsWith("[") ? "" : ".";
        result[prefixValue + chain + innerKey] = innerValue;
      });
    } else {
      result[prefixValue] = value;
    }
  });

  return result;
};

export const buildObject = (propValues: Record<string, any>) => {
  const ret: any = {};
  for (const key in propValues) {
    setProp(ret, key, propValues[key]);
  }
  return ret;
};
const setProp = (obj: any, key: string, value: any): void => {
  if (key.startsWith("[")) {
    const end = key.indexOf("]");
    const num = Number(key.substring(1, end));
    const remaining = key.substring(end + 1);
    if (remaining.length) {
      if (remaining.startsWith(".")) {
        obj[num] = obj[num] || {};
        return setProp(obj[num], remaining.slice(1), value);
      }
      obj[num] = obj[num] || [];
      return setProp(obj[num], remaining, value);
    }
    obj[num] = value;
    return;
  }

  const propType = getPropType(key);
  switch (propType) {
    case "array": {
      const firstBracket = key.indexOf("[");
      const prop = key.substring(0, firstBracket);
      const remaining = key.substring(firstBracket);
      obj[prop] = obj[prop] || [];
      return setProp(obj[prop], remaining, value);
    }
    case "object": {
      const firstDot = key.indexOf(".");
      const prop = key.substring(0, firstDot);
      const remaining = key.substring(firstDot + 1);
      obj[prop] = obj[prop] || {};
      return setProp(obj[prop], remaining, value);
    }
    case "terminal": {
      obj[key] = value;
      return;
    }
  }
};
const getPropType = (key: string) => {
  const firstDot = key.indexOf(".");
  const firstBracket = key.indexOf("[");
  if (firstDot < 0 && firstBracket < 0) {
    return "terminal" as const;
  }
  if (firstDot < 0) {
    return "array" as const;
  }
  if (firstBracket < 0) {
    return "object" as const;
  }

  if (firstDot < firstBracket) {
    return "object" as const;
  }
  return "array" as const;
};

const isPlainObject = (value: any) =>
  value !== null &&
  typeof value === "object" &&
  value.__proto__ === Object.prototype;
