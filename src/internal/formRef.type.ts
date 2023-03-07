import { State, Stateless, StateObservable } from "derive-state";
import { Validator } from "../validators";
import { Paths } from "./path";

export interface ControlOptions<TValues, T> {
  key: string;
  initialValue: T;
  validator?: Validator<T, TValues>;
}

export interface FormRef<TValues> {
  defaultTouched: boolean;
  registeredKeys: State<Set<Paths<TValues>>>;
  registerControl: (options: ControlOptions<TValues, any>) => void;
  unregisterControl: (key: string) => void;
  initialValues: Map<string, State<any>>;
  values: Map<string, State<any>>;
  controlStates: Map<string, State<ControlState<any>>>;
  dispose: () => void;
}

export interface FormRefOptions<TValue> {
  initialValue?: TValue;
  touchedBehavior?: "auto" | "always" | "never";
}

export type ErrorResult = string[] | "pending" | false;
export interface ControlState<T> {
  touched: boolean;
  validator: Validator<T>;
  manualError: Stateless<ErrorResult>;
  error$: StateObservable<ErrorResult>;
}
