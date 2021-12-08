## Features

- Validators
  - All validator constructors have a consistent shape: They are functions that return a validator (e.g. `isRequired()` `isAtLeast(5)`)
  - Validation error messages can now be customized through `setValidatorMessages` or through an optional parameter when creating it.
  - Clarified the return type of a validator: It either returns true (value is valid) or a list of error messages.
- Context
  - Added `FormicaryContext.Provider` to avoid prop-drilling if desired
  - Now every hook optionally can have the `formRef` parameter omitted. If it's omitted, it will grab the formRef from the context instead.
  - To help with typescript support, there's a new helper method `createKeyFn<FormModel>()` that will give a function that should autocomplete the paths for `FormModel`, plus providing the correct type for each parameter.
- Key selectors
  - String-based key selectors have now typescript support. Typescript should auto-complete the paths when using them.
  - `useErrors` will now return a type-safe dictionary of elements when using the paths overload (e.g. `useErrors(form, 'name', 'age')` returns type `{ name: Error, age: Error }`).
- Undefined values
  - `useControl` and `useControlStateless` now don't require an initial value: The value will be `undefined` by default.
  - All methods that set the value of a field accept `undefined` to reset them as empty.
  - All methods that get a value of a field can potentially return `undefined` for type safety, except `getFormValue` to make matters simple. Be aware some values could be `undefined`, although it should not happen if validation rules are set up and form is marked as valid.
- new hook `useFieldChanges(key, cb: (value, isInitial) => void)` that will call the call-back every time that the field changes its value (it will also call it with the initial value setting `isInitial` to true)
- Now the type for `FormRef<FormModel>` is assignable to another variable with a subtype. This is particularly useful for subcomponents that only take a few properties of the whole model.

## Breaking

- `useInput`
  - `useInput` now requires the key. It will ignore the `name` attribute of the element it gets attached to.
  - This provides better type safety with validators, and make it easier to understand what property the input is going to be attached to.
- Hooks with multiple key selectors (`useErrors`, ).
  - To improve type safety, now hooks that took arrays of keys should have them spread as parameters. E.g. `useError(form, ['name', 'age'])` should become `useErrors(form, 'name', 'age')`.
  - The selector function validator is unaffected from this change (E.g. `useError(form, v => [v.name, v.age]))` is alright, but won't have the new enhanced type safety.
- Validators
  - `isRequired`, `isNumber` and `isInteger` must now be called to get the actual validator.
  - Validators that are not `isRequired` will now return the value is valid if the value is nil, otherwise it would not be possible to make e.g. an optional numeric field. To migrate, they can be composed with `pipeValidators(isRequired(), {{validator}})`.
  - Validators can't return `false` now when the value is invalid. On that case they must return a list of errors messages.
- Renames
  - `useWatch` renamed to `useFieldValue` - Reason: it's more descriptive of what it's returning.
  - `useFormChanges` renamed to `useFormValue` - Reason: it's more descriptive of what it's returning.
  - `useControlSubscription` renamed to `useControlStateless` - Reason: the name was misleading, it's not creating a Subscription, but returning something that you can subscribe to without using a state.
  - `readField` renamed to `getFieldValue` - Reason: More descriptive and consistent with the `setFieldValue` counterpart.
  - `readForm` renamed to `getFormValue` - Reason: More descriptive and consistent with the `setFormValue` counterpart.
- The type for `FormRef` is now opaque. Use exported methods instead.

## TODO

- getInitialValue
- getAllErrors
- investigate arrays
- add test to verify initialValue on useForm prevails over initialValue on useInput
- Define what happens when a field gets unmounted: Is it saved? validators still apply? is it removed?
  -> By default, value is retained. Option to have it removed on unmount.

=> keys as strings are still quite hard to get right and working with all possible variations
let's completely drop that idea and roll back to proxy-based key selector, with optional key-based (maybe?)

=> useInput is too smart. react-hook-forms@v3 removed the optional key grabbing it from the name, do the same.

=> initialValue is always optional, and defaults to undefined
-> all fields can potentially return undefined when read.
-> all fields can be set to undefined
-> null will be handled by the consumer (setting it as a possible value)
-> reading the form will return the original object interface, without adding undefineds.
---> It's consumer's responsibility to add validation rules and check validation before submit.
