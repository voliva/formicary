# React Reactive Form

Build forms with reactive validations between forms.

Proof of concept - API heavily inspired from [react-hook-form](https://react-hook-form.com/)

## Usage

```tsx
import {
  useForm,
  pipeValidators,
  isNumber,
  isAtMost,
  isRequired,
} from '@voliva/react-reactive-form';

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
          key: v => v.min, // Same as 'min', but typesafe
          initialValue: 0,
          validator: pipeValidators(isRequired, isNumber, isAtMost('max')),
        })}
      />
      <input
        placeholder="max"
        ref={register({
          key: 'max', // Could also do `v => v.max`
          initialValue: 10,
          validator: pipeValidators(isRequired, isNumber),
        })}
      />
      <div>{Object.keys(errors).join(' ')}</div>
    </div>
  );
};
```

Example: [CodeSandbox](https://codesandbox.io/s/react-reactive-form-xuomt?file=/src/App.tsx)

## Validators

The main purpose of this library is to provide an easy way of defining validations for every field, even if they depend on others.

React Reactive Form currently exposes some common validators to make things less verbose, but it's fairly simple to build your own validator. The definition of a validator is:

```tsx
type Validator<T> = (
  value: T,
  getValue: (key: string) => any
) => boolean | string[] | Promise<boolean | string[]>;
```

A validator must return either a boolean (true means validation passes, false means it fails) or a list of error messages. It can also be async, in case there are validations that need it.

It will be called with the latest value of the field every time it changes, along with a function to get the value from any other field. When using this function, internally it will create a dependency to that field, re-evaluating the validation when that one changes.

Validators are composable. This library exposes two utilities to compose them easily:

- `pipeValidators` takes any number of validators and runs them one-by-one, bailing out when one of them reports an error.
- `mergeValidators` takes any number of validators and runs them simultaneously, returning the list of all errors reported if there were any.
