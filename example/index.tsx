import * as React from "react";
import { useEffect, useState } from "react";
import "react-app-polyfill/ie11";
import * as ReactDOM from "react-dom";
import {
  createKeyFn,
  FormicaryContext,
  FormRef,
  isAtMost,
  isNumber,
  isRequired,
  pipeValidators,
  readForm,
  setFieldError,
  useControl,
  useErrors,
  useFieldValue,
  useForm,
  useInput,
  useIsPristine,
  useIsValid,
} from ".././src";

interface FormValue {
  min: string;
  max: string;
  subcontrol: {
    foo: string;
    bar: unknown;
  };
  array: Array<{
    foo: "what";
  }>;
}

const key = createKeyFn<FormValue>();
key("array.0.foo");

const Form = () => {
  const form = useForm<FormValue>({
    initialValue: {
      min: "1",
      max: "5",
      subcontrol: {
        foo: "",
        bar: 3,
      },
      array: [],
    },
  });

  const control = useControl(form, {
    key: "subcontrol",
    initialValue: {
      foo: "asdf",
      bar: "haha",
    },
  });

  const control2 = useControl({
    key: key("subcontrol"),
    initialValue: undefined,
  });

  const ref = useInput(form, "subcontrol", {
    initialValue: true,
  });

  const ref2 = useInput(key("subcontrol"), {
    initialValue: true,
  });

  const ref3 = useInput("subcontrol", {
    initialValue: true,
  });

  const errors = useErrors(form);
  const minField = useInput(form, "min", {
    initialValue: "0",
    validator: pipeValidators(isRequired(), isNumber(), isAtMost("max")),
  });
  const maxField = useInput(form, "max", {
    initialValue: "0",
    validator: pipeValidators(isRequired(), isNumber()),
  });

  const min = useFieldValue(form, "subcontrol");
  // const min2 = useFieldValue(key("min"));
  const pristine = useIsPristine(form);
  const isValid = useIsValid(form);

  const [showMax, setShowMax] = useState(false);
  useEffect(() => {
    setTimeout(() => setShowMax(true), 1000);
  }, []);

  return (
    <FormicaryContext.Provider value={form}>
      <div>
        <input placeholder="min" ref={minField} />
        {showMax && <input placeholder="max" ref={maxField} />}
        <div>minErrors: {errors.min}</div>
        <div>maxErrors: {errors.max}</div>
        <div>Minimum: {min}</div>
        <div>{pristine ? "pristine" : "dirty"}</div>
        <div>{isValid ? "valid" : "invalid"}</div>
        {pristine ? null : <SubComponent />}
        <button
          onClick={() => {
            const value = readForm(form);
            console.log(value);
            setFieldError(form, "max", [
              `value ${value.max} is invalid (trololo)`,
            ]);
          }}
        >
          Submit
        </button>
      </div>
    </FormicaryContext.Provider>
  );
};

const SubComponent = () => {
  const control = useControl({
    initialValue: "something",
    key: key("min"),
  });

  return <div>{control.value}</div>;
};

const App = () => {
  return (
    <div>
      <Form />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));

enum E1 {
  e10 = "e10", // Doesn't work if number only...
  e20 = "e20",
}

type T1 = Record<E1, boolean>;
interface T2 {
  t20: string;
  t21: boolean;
  t23: Array<number>;
}
type T3 = T1 & Omit<T2, "t23">;

type _ = typeof E1.e10 extends keyof T3 ? true : false;

const form = useForm({
  initialValue: {} as T3,
});

function whatever(v: E1) {
  const result = useControl(form, {
    key: v,
    initialValue: true,
  });
}

/****/

function foo<T>(form: FormRef<T>, key: keyof T & string) {
  const input = useInput(form, key);
}

/****/

const formA = useForm<{ name: string; age: number }>();
const formB: FormRef<{ name: string }> = formA; // Error

/*****/

const formC = useForm<any>();
useErrors(formC, ["name"]); // Error

/*****/

const formD = useForm<{ foo: boolean; bar: number }>();

const inputRef = useInput(formD, "bar", {
  validator: (value: number) => true, // Error?? happening on alpha
});

/****/

const { setValue, value, touch } = useControl(formD, {
  initialValue: undefined, // Error: Used   work, not anymore. What's the policy on undefined values?
  key: "bar",
});
