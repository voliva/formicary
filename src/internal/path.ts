import { State } from "derive-state";
import { isSubfield } from "./subfield";

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
    ?
        | ValueOfPath<NotNil<TValues[Prop]>, Rest>
        // The following line represents optional chaining.
        // We removed the null | undefined with NotNil<T> to be able to chain through
        // So now we must add undefined if T was nil (following the rule of optional chaining)
        | (TValues[Prop] extends undefined | null ? undefined : never)
    : unknown
  : unknown;

// eslint-disable-next-line @typescript-eslint/ban-types
export type Key<T, P extends Paths<T>> = P & {}; // This is actually a TS trick
// the path is going to be just the string. But if we prevent TS from understanding it as a string
// then we can infer the original `T` from that path, so that we can later on work with it
export function createKeyFn<T>() {
  return <P extends Paths<T>>(path: P): Key<T, P> => path;
}

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
