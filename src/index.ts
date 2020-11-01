export { readForm } from './readForm';
export { resetForm } from './resetForm';
export { setFieldValue } from './setFieldValue';
export { useControl } from './useControl';
export { useErrors } from './useErrors';
export { useForm } from './useForm';
export { useFormValue } from './useFormValue';
export { useInput } from './useInput';
export { useIsPristine } from './useIsPristine';
export { useIsValid } from './useIsValid';
export { useWatch } from './useWatch';
export {
  Validator,
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
  * use case "I don't disable submit button, but when the user presses I want to show all fields with validation errors even if untouched"
  * show error if a dependency causes that field to go on error, even when left untouched
  => I need touched to be higher up, so I can provide a hook "useTouchedErrors"
- Custom typings for FormRef (as an opaque token)
- Default validators to give an error type instead of a localised message
*/
