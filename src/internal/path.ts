import { State } from "derive-state";
import { isSubfield } from "./subfield";

type MappedKey<K extends string, V> = `${K}${V extends Record<string, any>
  ? `.${Paths<V>}`
  : ""}`;
type KeyMap<T> = {
  [K in keyof T & string]: MappedKey<K, T[K]>;
};
export type Paths<T> = unknown extends T ? string : KeyMap<T>[keyof T & string];

export type ValueOfPath<TValues, Path> = Path extends keyof TValues
  ? TValues[Path]
  : Path extends `${infer Prop}.${infer Rest}`
  ? Prop extends keyof TValues
    ? ValueOfPath<TValues[Prop], Rest>
    : unknown
  : unknown;

export function key<T>(path: Paths<T>) {
  return path;
}
export function createKeyFn<T>() {
  return <P extends Paths<T>>(path: P) => path;
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
