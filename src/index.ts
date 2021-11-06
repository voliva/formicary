export { getFieldChanges } from './commands/getFieldChanges';
export { readField } from './commands/readField';
export { readForm } from './commands/readForm';
export { resetForm } from './commands/resetForm';
export { setFieldValue, setFormValue } from './commands/setFieldValue';
export {
  setInitialValue,
  setFormInitialValue,
} from './commands/setInitialValue';
export { touchFields } from './commands/touchFields';
export { setFieldError } from './commands/setFieldError';
export { useControlSubscription } from './hooks/useControlSubscription';
export { useControl } from './hooks/useControl';
export { useErrors } from './hooks/useErrors';
export { useForm } from './hooks/useForm';
export { useFormChanges } from './hooks/useFormChanges';
export { useInput } from './hooks/useInput';
export { useIsPristine } from './hooks/useIsPristine';
export { useIsValid } from './hooks/useIsValid';
export { useWatch } from './hooks/useWatch';
export {
  FieldValidator as Validator,
  isAtLeast,
  isGreaterThan,
  isInteger,
  isNumber,
  isAtMost,
  isLessThan,
  isRequired,
  mergeValidators,
  pipeValidators,
  matches,
  conditionalValidator,
} from './validators';
export { FormRef } from './internal/formRef';
export { subfield } from './internal/subfield';
export { KeySelector } from './internal/path';

/* TODO
- Context provider
- Derived changes
- Remove/cleanup unused fields (need refcount?)
- getErrors command
  => Investigate scroll into view after touch fields
- Array fields
- Better control of touched
  * show error if a dependency causes that field to go on error, even when left untouched
- Global validations
- On submit validations
- Custom typings for FormRef (as an opaque token)
*/
