import { FormEvent } from 'react';
import { Validator } from './validators';

export type SetPropTypes<O, T> = {
  [K in keyof O]: T;
};

export interface Control<T> {
  setValue: (value: T) => void;
  subscribe: (cb: (value: T) => void) => () => void;
}

export type RegisterControlOptions<TValues, T> = {
  key: KeySelector<TValues, T>;
  initialValue: T;
  validator?: Validator<T, TValues>;
};
export type RegisterOptions<TValues, T> = {
  key: KeySelector<TValues, T>;
  initialValue: T;
  validator?: Validator<T, TValues>;
  elementProp?: string;
  eventType?: 'input' | 'onChange';
} & (
  | {
      serializer: (value: T) => any;
      deserializer: (serialized: any) => T;
    }
  | {}
);

export interface UseFormOptions<TValues> {
  onSubmit: (
    values: TValues,
    isValid: boolean | 'pending'
  ) => void | Promise<void | Record<string, string[]>>;
}
export interface UseWatch<TValues> {
  <T>(key: KeySelector<TValues, T>): T | undefined;
  <T>(key: KeySelector<TValues, T>, defaultValue: T): T;
}
export interface UseForm {
  <TValues extends Record<string, any>>(options: UseFormOptions<TValues>): {
    registerControl: <T>(
      options: RegisterControlOptions<TValues, T>
    ) => Control<T>;
    errors: Record<string, string[]>;
    isValid: boolean | 'pending';
    onSubmit: (event?: FormEvent) => void;
    useWatch: UseWatch<TValues>;

    register: <T>(
      options: RegisterOptions<TValues, T>
    ) => (element: HTMLInputElement | null) => void;
  };
}

export type KeySelector<TValues, T> = string | ((values: TValues) => T);
