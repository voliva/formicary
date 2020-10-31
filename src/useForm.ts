import { useEffect, useRef } from 'react';
import { createFormRef, FormRef } from './internal/formRef';

export const useForm = <
  TValues extends Record<string, any> = Record<string, any>
>() => {
  const ref = useRef<FormRef<TValues> | null>(null);
  if (!ref.current) {
    ref.current = createFormRef<TValues>();
  }

  useEffect(() => () => ref.current!.dispose(), []);

  return ref.current;
};

/** TODO
 * pristine
 *  -> useIsPristine For a specific field (?... is it useful?), or for all of them. Returns true/false
 *  -> formRef.markPristine()
 * reset: resets each field to its initial value
 *  -> formRef.reset()
 * If I'm moving on this API, then maybe readForm should become formRef.read()
 *
 * Speaking of initial values... think on how to make changing initial values. The example of ADSS:
 * - Select Monthly or Quaterly
 * - User can select the next 12 months from a split [Month] Select and [Year] Select
 * - Quaterly can only choose specific months
 *
 * TODO -> Ability to remove fields. react-hook-form cleans up when a field gets unmounted,
 * I don't want to do that. Cleanup on demand
 *
 * TODO -> Ability to change values, externally (setValue(form, key, value)) and internally (useDerivedValue(form, (getValue, setValue) => {}))
 */
