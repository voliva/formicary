export { readForm } from './readForm';
export { resetForm } from './resetForm';
export { setFieldValue } from './setFieldValue';
export { setInitialValue } from './setInitialValue';
export { useControl } from './useControl';
export { useControlState } from './useControlState';
export { useErrors } from './useErrors';
export { useForm } from './useForm';
export { useInput } from './useInput';
export { useIsPristine } from './useIsPristine';
export { useIsValid } from './useIsValid';
export { useWatch } from './useWatch';
export { touchFields } from './touchFields';
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
} from './validators';
export { FormRef } from './internal/formRef';

/* TODO
- Global validations
- On submit validations
- Remove/cleanup unused fields (need refcount?)
- Better control of touched
  * show error if a dependency causes that field to go on error, even when left untouched
- Custom typings for FormRef (as an opaque token)
- Default validators to give an error type instead of a localised message
*/
