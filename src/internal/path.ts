import { State } from "derive-state";
import { isSubfield } from "./subfield";

export type KeySelector<TValues, T> = string | ((values: TValues) => T);
export type KeysSelector<TValues> = string[] | ((values: TValues) => any[]);

const path = Symbol("path");
export const getKey = (keySelector: KeySelector<any, any>): string => {
  if (typeof keySelector === "string") return keySelector;
  const proxy = new Proxy({ path: "" }, getProxyHandler(false));
  const result = keySelector(proxy);
  if (result !== proxy) {
    throw new Error(
      `You must return a value from the argument in the selector function`
    );
  }
  return result[path];
};
export const getMapValue = (
  keySelector: KeySelector<any, any>,
  map: Map<string, State<any>>
) => {
  const key = getKey(keySelector);
  if (!map.has(key)) {
    map.set(key, new State<any>());
  }
  return map.get(key)!;
};

export const getKeys = (keysSelector: KeysSelector<any>): string[] => {
  if (typeof keysSelector === "object") return keysSelector;
  const proxy = new Proxy({ path: "" }, getProxyHandler(true));
  const result = keysSelector(proxy);
  // if (result.some(r => !(r instanceof Proxy))) {
  //   throw new Error(
  //     `You must return a value from the argument in the selector function`
  //   );
  // }
  return result.map((r) => r[path]);
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

const getProxyHandler = (
  preserveRoot: boolean
): ProxyHandler<{ path: string }> => {
  const handler: ProxyHandler<{ path: string }> = {
    get: (target, prop, receiver) => {
      if (prop === path) {
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

      if (preserveRoot && target.path.length === 0)
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

const isPlainObject = (value: any) =>
  value !== null &&
  typeof value === "object" &&
  value.__proto__ === Object.prototype;
