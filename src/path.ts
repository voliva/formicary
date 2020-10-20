type MappedKey<K, V> = K extends string | number ? `${K}${V extends Record<string, any> ? '' | `.${Paths<V>}` : ''}` : '';
type KeyMap<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? never : MappedKey<K, T[K]>
}
export type Paths<T> = KeyMap<T>[keyof T];

type Numbers = `${number}`;
export type PropType<T, Path> = // Adapted from an example in the PR itself https://github.com/microsoft/TypeScript/pull/40336
    string extends Path ? unknown :
    Path extends keyof T ? T[Path] :
    Path extends Numbers ? T extends Record<number, any> ? T[0] : unknown:
    Path extends `${infer K}.${infer R}` ? K extends keyof T ? PropType<T[K], R> : unknown :
    unknown;

interface MyInterface {
  someString: string;
  someArray: string[];
  someObject: {
    objectValue: string;
    date: Date
  }
  nestedArray: {
    arrayValue: number
  }[];
}

function navigate<T extends Record<string|number, any>>(value: T) {
  return <K extends Paths<T>>(key: K): PropType<T, K> => {
    return null as any;
  }
}

type R = Paths<MyInterface>

const navigator = navigate(null as any as MyInterface)
const result = navigator<any>("someArray.asdfasdf")
const date = navigator('someObject.date')