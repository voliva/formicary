import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  isAtMost,
  isNumber,
  isRequired,
  pipeValidators,
  readForm,
  useInput,
  useForm,
  useWatch,
  useErrors,
  useIsPristine,
  useIsValid,
  setFieldError,
  useControl,
} from '.././src';
import { useState } from 'react';
import { useEffect } from 'react';

const Form = () => {
  const form = useForm<{
    min: number;
    max: number;
  }>();
  const errors = useErrors(form);
  const minField = useInput(form, {
    initialValue: '0',
    validator: pipeValidators(isRequired, isNumber, isAtMost('max')),
  });
  const maxField = useInput(form, {
    initialValue: '0',
    validator: pipeValidators(isRequired, isNumber),
  });
  const min = useWatch(form, v => v.min);
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
      <div>{pristine ? 'pristine' : 'dirty'}</div>
      <div>{isValid ? 'valid' : 'invalid'}</div>
      {pristine ? null : <SubComponent formRef={form} />}
      <button
        onClick={() => {
          const value = readForm(form);
          console.log(value);
          setFieldError(form, v => v.max, [
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
    initialValue: 'something',
    key: 'subcontrol',
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

ReactDOM.render(<App />, document.getElementById('root'));
