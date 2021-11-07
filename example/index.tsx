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
} from ".././src";
import { useState } from "react";
import { useEffect } from "react";

interface FormValue {
  min: number;
  max: number;
  bar: string;
}

// const key = createKeyFn<FormValue>();

const Form = () => {
  const form = useForm<FormValue>();
  const errors = useErrors(form);
  const minField = useInput(form, {
    initialValue: "0",
    validator: pipeValidators(isRequired(), isNumber(), isAtMost("max")),
  });
  const maxField = useInput(form, {
    initialValue: "0",
    validator: pipeValidators(isRequired(), isNumber()),
  });

  const min = useFieldValue(form, "min");
  // const min2 = useFieldValue(key("min"));
  const pristine = useIsPristine(form);
  const isValid = useIsValid(form);

  const [showMax, setShowMax] = useState(false);
  useEffect(() => {
    setTimeout(() => setShowMax(true), 1000);
  }, []);

  return (
    <div>
      <input name="min" placeholder="min" ref={minField} />
      {showMax && <input name="max" placeholder="max" ref={maxField} />}
      <div>minErrors: {errors.min}</div>
      <div>maxErrors: {errors.max}</div>
      <div>Minimum: {min}</div>
      <div>{pristine ? "pristine" : "dirty"}</div>
      <div>{isValid ? "valid" : "invalid"}</div>
      {pristine ? null : <SubComponent formRef={form} />}
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
  );
};

const SubComponent = ({ formRef }) => {
  const control = useControl(formRef, {
    initialValue: "something",
    key: "subcontrol",
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
