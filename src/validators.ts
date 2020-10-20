export type Validator<T> = (
  value: T,
  getValue: (key: string) => any
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

export const pipeValidators = (
  ...validators: Array<Validator<any>>
): Validator<any> => async (value, getValue) => {
  for (const validate of validators) {
    const result = await validate(value, getValue);
    if (result !== true) {
      return result;
    }
  }
  return true;
};

export const mergeValidators = (
  ...validators: Array<Validator<any>>
): Validator<any> => async (value, getValue) => {
  const promises = validators.map(validate => validate(value, getValue));
  const results = await Promise.all(promises);
  const flattenedResults = results.flatMap(result =>
    typeof result === 'boolean' ? [] : result
  );
  if (flattenedResults.length === 0) {
    return !results.some(result => result === false);
  }
  return flattenedResults;
};
