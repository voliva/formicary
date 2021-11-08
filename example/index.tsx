import "react-app-polyfill/ie11";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  isAtMost,
  isNumber,
  isRequired,
  pipeValidators,
  readForm,
  useInput,
  useForm,
  useFieldValue,
  useErrors,
  useIsPristine,
  useIsValid,
  setFieldError,
  useControl,
  FormicaryContext,
  createKeyFn,
} from ".././src";
import { useState } from "react";
import { useEffect } from "react";

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
    initialValue: null,
  });

  const ref = useInput(form, {
    key: "subcontrol",
    initialValue: true,
  });

  const ref2 = useInput({
    key: key("subcontrol"),
    initialValue: true,
  });

  const ref3 = useInput({
    key: "subcontrol",
    initialValue: true,
  });

  const errors = useErrors(form);
  const minField = useInput(form, {
    initialValue: "0",
    validator: pipeValidators(isRequired(), isNumber(), isAtMost("max")),
  });
  const maxField = useInput(form, {
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
        <input name="min" placeholder="min" ref={minField} />
        {showMax && <input name="max" placeholder="max" ref={maxField} />}
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
