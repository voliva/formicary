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
} from '.././src';

const Form = () => {
  const form = useForm<{
    min: number;
    max: number;
  }>();
  const [minField, minErrors] = useInput(form, {
    key: v => v.min,
    initialValue: '0',
    validator: pipeValidators(isRequired, isNumber, isAtMost('max')),
  });
  const [maxField, maxErrors] = useInput(form, {
    key: v => v.max,
    initialValue: '0',
    validator: pipeValidators(isRequired, isNumber),
  });
  const min = useWatch(form, v => v.min);
  const pristine = useIsPristine(form);

  return (
    <div>
      <input placeholder="min" ref={minField} />
      <input placeholder="max" ref={maxField} />
      <div>minErrors: {minErrors}</div>
      <div>maxErrors: {maxErrors}</div>
      <div>Minimum: {min}</div>
      <div>{pristine ? 'pristine' : 'dirty'}</div>
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
