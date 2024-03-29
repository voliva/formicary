import { KeySelector } from './internal/path';

export type PureValidator<T> = (
  value: T
) => boolean | string[] | Promise<boolean | string[]>;
export type FieldValidator<T, TValues = any> = (
  value: T,
  getValue: (key: KeySelector<TValues, T>) => any
) => boolean | string[] | Promise<boolean | string[]>;

type ValidatorParam<T> = T | ((getValue: (key: string) => any) => T);

export const isNumber: PureValidator<any> = value => {
  if (isNaN(value)) {
    return ['Expected a number'];
  }
  return true;
};

export const isInteger: PureValidator<any> = value => {
  if (parseInt(value) !== parseFloat(value)) {
    return ['Expected an integer'];
  }
  return true;
};

export const isRequired: PureValidator<any> = value =>
  value != null && value !== '' ? true : ['required'];

const parseNumericParam = (
  value: string | ValidatorParam<number>,
  getValue: (key: string) => any
) =>
  typeof value === 'function'
    ? value(getValue)
    : typeof value === 'string'
    ? Number(getValue(value))
    : value;

export const isAtLeast = (
  threshold: string | ValidatorParam<number>
): FieldValidator<number> => (value, getValue) => {
  const thresholdValue = parseNumericParam(threshold, getValue);
  if (Number(value) < thresholdValue) {
    return ['Expected a value of at least ' + thresholdValue];
  }
  return true;
};

export const isGreaterThan = (
  threshold: string | ValidatorParam<number>
): FieldValidator<number> => (value, getValue) => {
  const thresholdValue = parseNumericParam(threshold, getValue);
  if (Number(value) <= thresholdValue) {
    return ['Expected a value greater than ' + thresholdValue];
  }
  return true;
};

export const isAtMost = (
  threshold: string | ValidatorParam<number>
): FieldValidator<number> => (value, getValue) => {
  const thresholdValue = parseNumericParam(threshold, getValue);
  if (Number(value) > thresholdValue) {
    return ['Expected a value of at most ' + thresholdValue];
  }
  return true;
};

export const isLessThan = (
  threshold: string | ValidatorParam<number>
): FieldValidator<number> => (value, getValue) => {
  const thresholdValue = parseNumericParam(threshold, getValue);
  if (Number(value) >= thresholdValue) {
    return ['Expected a value less than ' + thresholdValue];
  }
  return true;
};

export const matches = (
  regex: RegExp,
  message?: string
): PureValidator<string> => value => {
  if (regex.test(value)) {
    return true;
  }
  return [message ?? 'Invalid value'];
};

const recPipeValidators = (validators: Array<any>, i: number): any => (
  ...args: any
) => {
  if (i >= validators.length) {
    return true;
  }
  const syncResult = validators[i](...args);

  const processResult = (result: boolean | string[]) => {
    if (result !== true) {
      return result;
    }
    return recPipeValidators(validators, i + 1)(...args);
  };

  if (validationResultIsAsync(syncResult)) {
    return syncResult.then(processResult);
  }
  return processResult(syncResult);
};

interface ValidatorComposer {
  (...validators: Array<PureValidator<any>>): PureValidator<any>;
  <TValues>(...validators: Array<FieldValidator<any, TValues>>): FieldValidator<
    any,
    TValues
  >;
}
export const pipeValidators: ValidatorComposer = (...validators: any[]) =>
  recPipeValidators(validators, 0);

export const mergeValidators: ValidatorComposer = (...validators: any[]) => (
  ...args: any[]
) => {
  const syncResults = validators.map(validate => (validate as any)(...args));

  const processResult = (results: (boolean | string[])[]) => {
    const flattenedResults = results.flatMap(result =>
      typeof result === 'boolean' ? [] : result
    );
    if (flattenedResults.length === 0) {
      return !results.some(result => result === false);
    }
    return flattenedResults;
  };

  if (syncResults.some(validationResultIsAsync)) {
    return Promise.all(syncResults).then(processResult);
  }
  return processResult(syncResults as any);
};

export function conditionalValidator<T, TValues>(
  condition: (
    value: T,
    getValue: (key: KeySelector<TValues, T>) => any
  ) => boolean,
  validator: PureValidator<T> | FieldValidator<T, TValues>
): FieldValidator<T, TValues> {
  return (value, getValue) => {
    if (condition(value, getValue)) {
      return validator(value, getValue);
    }
    return true;
  };
}

export const noopValidator: PureValidator<any> = () => true;

const validationResultIsAsync = (
  result: ReturnType<FieldValidator<any>>
): result is Promise<any> =>
  typeof result === 'object' && !Array.isArray(result);
