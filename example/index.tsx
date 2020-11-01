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
} from '.././src';

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

  return (
    <div>
      <input name="min" placeholder="min" ref={minField} />
      <input name="max" placeholder="max" ref={maxField} />
      <div>minErrors: {errors.min}</div>
      <div>maxErrors: {errors.max}</div>
      <div>Minimum: {min}</div>
      <div>{pristine ? 'pristine' : 'dirty'}</div>
      <div>{isValid ? 'valid' : 'invalid'}</div>
      <button
        onClick={() => {
          console.log(readForm(form));
        }}
      >
        Submit
      </button>
    </div>
  );
};

const App = () => {
  return (
    <div>
      <Form />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
