import { KeySelector } from './path';

export type Validator<T, TValues = any> = (
  value: T,
  getValue: (key: KeySelector<TValues, T>) => any
) => boolean | string[] | Promise<boolean | string[]>;

type ValidatorParam<T> = T | ((getValue: (key: string) => any) => T);

export const isNumber: Validator<any> = value => {
  if (isNaN(value)) {
    return ['Expected a number'];
  }
  return true;
};

export const isInteger: Validator<any> = value => {
  if (parseInt(value) !== parseFloat(value)) {
    return ['Expected an integer'];
  }
  return true;
};

export const isRequired: Validator<any> = value =>
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
): Validator<number> => (value, getValue) => {
  const thresholdValue = parseNumericParam(threshold, getValue);
  if (Number(value) < thresholdValue) {
    return ['Expected a value of at least ' + thresholdValue];
  }
  return true;
};

export const isGreaterThan = (
  threshold: string | ValidatorParam<number>
): Validator<number> => (value, getValue) => {
  const thresholdValue = parseNumericParam(threshold, getValue);
  if (Number(value) <= thresholdValue) {
    return ['Expected a value greater than ' + thresholdValue];
  }
  return true;
};

export const isAtMost = (
  threshold: string | ValidatorParam<number>
): Validator<number> => (value, getValue) => {
  const thresholdValue = parseNumericParam(threshold, getValue);
  if (Number(value) > thresholdValue) {
    return ['Expected a value of at most ' + thresholdValue];
  }
  return true;
};

export const isLessThan = (
  threshold: string | ValidatorParam<number>
): Validator<number> => (value, getValue) => {
  const thresholdValue = parseNumericParam(threshold, getValue);
  if (Number(value) >= thresholdValue) {
    return ['Expected a value less than ' + thresholdValue];
  }
  return true;
};

const recPipeValidators = (
  validators: Array<Validator<any>>,
  i: number
): Validator<any> => (value, getValue) => {
  if (i >= validators.length) {
    return true;
  }
  const syncResult = validators[i](value, getValue);

  const processResult = (result: boolean | string[]) => {
    if (result !== true) {
      return result;
    }
    return recPipeValidators(validators, i + 1)(value, getValue);
  };

  if (validationResultIsAsync(syncResult)) {
    return syncResult.then(processResult);
  }
  return processResult(syncResult);
};

export const pipeValidators = <TValue>(
  ...validators: Array<Validator<any, TValue>>
): Validator<any, TValue> => recPipeValidators(validators, 0);

export const mergeValidators = <TValue>(
  ...validators: Array<Validator<any, TValue>>
): Validator<any, TValue> => (value, getValue) => {
  const syncResults = validators.map(validate => validate(value, getValue));

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

const validationResultIsAsync = (
  result: ReturnType<Validator<any>>
): result is Promise<any> =>
  typeof result === 'object' && !Array.isArray(result);
