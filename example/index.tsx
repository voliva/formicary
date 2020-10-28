import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  isAtMost,
  isNumber,
  isRequired,
  pipeValidators,
  readForm,
  useField,
  useForm,
  useWatch,
  useErrors,
} from '.././src';

const Form = () => {
  console.log('rerender');
  const form = useForm<{
    min: number;
    max: number;
  }>();
  const minField = useField(form, {
    key: v => v.min,
    initialValue: 0,
    validator: pipeValidators(isRequired, isNumber, isAtMost('max')),
  });
  const maxField = useField(form, {
    key: v => v.max,
    initialValue: 0,
    validator: pipeValidators(isRequired, isNumber),
  });
  const min = useWatch(form, v => v.min);
  const errors = useErrors(form);

  return (
    <div>
      <input placeholder="min" ref={minField} />
      <input placeholder="max" ref={maxField} />
      <div data-testid="errors">
        {Object.keys(errors)
          .map(key => `${key}: ${errors[key]!.join(', ')}`)
          .join('; ')}
      </div>
      <div>Minimum: {min}</div>
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
