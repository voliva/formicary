import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isAtMost, isNumber, isRequired, pipeValidators, useForm } from '../.';

const Form = () => {
  const { register, errors } = useForm<{
    min: number;
    max: number;
  }>({
    onSubmit: () => {},
  });

  return (
    <div>
      <input
        placeholder="min"
        ref={register({
          key: v => v.min,
          initialValue: 0,
          validator: pipeValidators(isRequired, isNumber, isAtMost('max')),
        })}
      />
      <input
        placeholder="max"
        ref={register({
          key: v => v.max,
          initialValue: 10,
          validator: pipeValidators(isRequired, isNumber),
        })}
      />
      <div data-testid="errors">
        {Object.keys(errors)
          .map(key => `${key}: ${errors[key]!.join(', ')}`)
          .join('; ')}
      </div>
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
