# React RxJS Form

Build forms with reactive validations between forms and a composable API.

Experimental

## Usage

```tsx
import {
  useForm,
  useInput,
  pipeValidators,
  isNumber,
  isAtMost,
  isRequired,
  errors,
} from 'react-rxjs-form';

const Form = () => {
  const form = useForm<{
    min: number;
    max: number;
  }>();
  const errors = useErrors(form);

  const minRef = useInput(form, {
    initialValue: 0,
    validator: pipeValidators(isRequired, isNumber, isAtMost('max')),
  });
  const maxRef = useInput(form, {
    initialValue: 0,
    validator: pipeValidators(isRequired, isNumber),
  });

  return (
    <div>
      <input name="min" placeholder="min" ref={minRef} />
      <input name="max" placeholder="max" ref={maxRef} />
      <div>{Object.keys(errors).join(' ')}</div>
    </div>
  );
};
```

Primitive Example: [CodeSandbox](https://codesandbox.io/s/react-reactive-form-xuomt?file=/src/App.tsx)

### Motivation

## API

The main purpose of this library is to provide an easy way of defining validations for every field, specially when they depend on others.

Because this library is thought in reactivity in mind, it just makes the recomputations necessary when changing values on fields:

- It doesn't use react's state to track the values of the fields. It treats them as uncontrolled, so that on every keystroke it doesn't generate a re-render.
- It only uses react's state where it's needed. Only the components that are subscribed to the specified parts of the model will update.
- Field-level validators will evaluate only when their value changes, or one of its dependencies change.

### Validators

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

And it provides with a set of useful built-in validators:

- `isNumber`: Value can be parsed as a number. Correct `['0','12.123']`, Incorrect `['abc', '12a']`
- `isInteger`: Value doesn't have decimals. Correct: `['1', '1.00']`, Incorrect: `['1.12', '0.1']`
- `isRequired`: Value is not empty. Incorrect: `['']`
- `isAtLeast(valueOrRef)`: Value is >= than valueOrRef.
- `isGreaterThan(valueOrRef)`: Value is > than valueOrRef.
- `isAtMost(valueOrRef)`: Value is <= than valueOrRef.
- `isLessThan(valueOrRef)`: Value is < than valueOrRef.
- `matches(RegExp)`: Value matches RegExp

In these built-in validators, `valueOrRef` can either take directly a static value or reference another field by passing in the key of the one that it depends on.

### KeySelectors

In many places throughout this library, you need to specify a key to select one field - This key is the stringified version of the path through the model. If our form model is:

```tsx
interface FormModel {
  interval: {
    min: number;
    max: number;
  };
  quantity: number;
}
```

Then the key selector for `min` field is `"interval.min"`, and for quantity `"quantity"`.

In these places, you can pass in a function instead which usually makes things easier if you're using Typescript. The function-version of the example above would be `model => model.interval.min` and `model => model.quantity` respectively.

Keep in mind that these functions are a replacement of a stringified key, so you can't do fancy stuff with this. In reality, `model` is not the object itself, but a `Proxy` designed to capture the path that's being returned from the function.

Some of the utilities takes in an array of keys. This can be supplied either with a simple array: `['quantity', 'interval.min']` or, again, as a function: `model => [model.quantity, model.interval.min]`

### form

#### useForm

```ts
// ... in a function component
const form = useForm<ModelType>();
```

Entry point of this library. Takes no parameters, but the FormModel as a generic type when using typescript. Returns an object that can be shared with children components used to manage the form.

The properties of this object are internal and shouldn't be used. Use some of the provided utilities or please, raise a new feature request.

### useInput

```tsx
const inputRef = useInput(form, {
  key?: KeySelector<TValues, T>;
  initialValue?: string | boolean;
  validator?: Validator<T, TValues>;
  elementProp?: string;
  eventType?: 'input' | 'onChange';
})

<input name="quantity" ref={inputRef} />
```

Registers an input, and returns a ref to be passed into an `input`-like element: It will add the required event listeners and synchronize the model with its value.

All parameters are optional:

- `key`: model key to bind this input to. If omitted, it will grab the key from the element's `.name` property.
- `initialValue`: Initial value to set to this field. Defaults to `''`.
- `validator`: optional validator to use for this input.
- `elementProp`: element's value property. Defaults to `value` but can be set to `checked` for checkboxes.
- `eventType`: event to listen for changes. Defaults to `input`.

### useControl

```ts
const {
  setValue: (value: T) => void,
  subscribe: (cb: (value: T) => void) => () => void,
  touch: () => void,
} = useControl(form, {
  key: KeySelector;
  initialValue: T;
  validator?: Validator<T>;
})
```

For custom form components that don't use a simple input-like element, this is more versatile than `useInput`. Returns:

- `setValue`: Function to set the value of this field in the form model.
- `subscribe`: Function that will callback whenever the form model changes. Returns a function that needs to be called to unsubscribe (designed to work easily within `useEffect`).
- `touch`: Marks the field as touched. Usually bound to "onBlur" or similar.

Parameters:

- `key`: model key to bind this field to.
- `initialValue`: Initial value to set to this field.
- `validator`: optional validator to use for this field.

### useIsValid

```ts
const isValid: boolean | 'pending' = useIsValid(form);
```

Returns whether the Form Model is valid according to the validation rules of all fields, or `'pending'` if any of the fields' validation is async and hasn't resolved yet.

Can take an optional parameter `keysSelector` to restrict the check to the specified keys.

### useErrors

```ts
const errors: {
  [key]: string[] | 'pending';
} = useErrors(form);
```

Returns a keyed object containing all errors by stringified key. These errors will show up per each field only if that field is marked as touched (as usually you only want to show errors after the user has gone through that field).

Can take an optional parameter `keysSelector` to restrict the check to the specified keys.

### touchFields

```ts
const handleSubmit = () => {
  if (!isValid) {
    return touchFields(form);
  }
};
```

Marks all fields in the form as touched. Useful if you don't disable the `submit` button when invalid and want to highlight the errors instead when the user presses on it.

Can take an optional parameter `keysSelector` to restrict the effect to the specified keys.

### readForm

```ts
const handleSubmit = () => {
  const model = readForm(form);
};
```

Returns the latest value of the form model.

### useWatch

```ts
const value = useWatch(form, keySelector);
```

Binds to the field specified by `keySelector`, so that it will update the value whenever it changes (causing a re-render)

### useIsPristine

```ts
const isPristine: boolean = useIsPristine(form);
```

Returns whether all the fields in the form have the same value as their initial value.

### resetForm

```ts
resetForm(form);
```

Resets all the fields in the form to their initial value.

Can take an optional parameter `keysSelector` to restrict the effect to the specified keys.

### setFieldValue

```ts
setFieldValue(form, keySelector, value);
```

Sets the value of the specified field.
