# Reactive Form

Build forms with reactive validations between forms.

Experimental - API heavily inspired from [react-hook-form](https://react-hook-form.com/)

## Usage

```tsx
import {
  useForm,
  pipeValidators,
  isNumber,
  isAtMost,
} from '@voliva/react-reactive-form';

const Form = () => {
  const { register, errors } = useForm({
    default: {
      min: 0,
      max: 10,
    },
    onSubmit: () => {},
  });

  return (
    <div>
      <input
        placeholder="min"
        ref={register({
          key: 'min',
          validator: pipeValidators(isNumber, isAtMost('max')),
        })}
      />
      <input
        placeholder="max"
        ref={register({ key: 'max', validator: isNumber })}
      />
      <div>{Object.keys(errors).join(' ')}</div>
    </div>
  );
};
```

Example: [CodeSandbox](https://codesandbox.io/s/react-reactive-form-xuomt?file=/src/App.tsx)
