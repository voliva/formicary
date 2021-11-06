import { KeySelector } from "./internal/path";

const validatorMessages = {
  isNumber: () => "Expected a number",
  isInteger: () => "Expected an integer",
  isRequired: () => "Required",
  isAtLeast: (threshold: number) => "Expected a value of at least " + threshold,
  isGreaterThan: (threshold: number) =>
    "Expected a value greater than " + threshold,
  isAtMost: (threshold: number) => "Expected a value of at most " + threshold,
  isLessThan: (threshold: number) => "Expected a value less than " + threshold,
  matches: (regex: RegExp) => "Invalid Value",
};

export const setValidatorMessages = (
  messages: Partial<typeof validatorMessages>
) => {
  Object.entries(messages).forEach(
    ([key, value]) => ((validatorMessages as any)[key] = value)
  );
};

export type PureValidator<T> = (
  value: T
) => true | string[] | Promise<true | string[]>;
export type FieldValidator<T, TValues = any> = (
  value: T,
  getValue: (key: KeySelector<TValues, T>) => any
) => true | string[] | Promise<true | string[]>;

type ValidatorParam<T> = T | ((getValue: (key: string) => any) => T);

export const isNumber =
  (message?: string): PureValidator<any> =>
  (value) => {
    if (isNaN(value)) {
      return [message ?? validatorMessages.isNumber()];
    }
    return true;
  };

export const isInteger =
  (message?: string): PureValidator<any> =>
  (value) => {
    if (parseInt(value) !== parseFloat(value)) {
      return [message ?? validatorMessages.isInteger()];
    }
    return true;
  };

export const isRequired =
  (message?: string): PureValidator<any> =>
  (value) =>
    value != null && value !== ""
      ? true
      : [message ?? validatorMessages.isRequired()];

const parseNumericParam = (
  value: string | ValidatorParam<number>,
  getValue: (key: string) => any
) =>
  typeof value === "function"
    ? value(getValue)
    : typeof value === "string"
    ? Number(getValue(value))
    : value;

export const isAtLeast =
  (
    threshold: string | ValidatorParam<number>,
    message?: string
  ): FieldValidator<number> =>
  (value, getValue) => {
    const thresholdValue = parseNumericParam(threshold, getValue);
    if (Number(value) < thresholdValue) {
      return [message ?? validatorMessages.isAtLeast(thresholdValue)];
    }
    return true;
  };

export const isGreaterThan =
  (
    threshold: string | ValidatorParam<number>,
    message?: string
  ): FieldValidator<number> =>
  (value, getValue) => {
    const thresholdValue = parseNumericParam(threshold, getValue);
    if (Number(value) <= thresholdValue) {
      return [message ?? validatorMessages.isGreaterThan(thresholdValue)];
    }
    return true;
  };

export const isAtMost =
  (
    threshold: string | ValidatorParam<number>,
    message?: string
  ): FieldValidator<number> =>
  (value, getValue) => {
    const thresholdValue = parseNumericParam(threshold, getValue);
    if (Number(value) > thresholdValue) {
      return [message ?? validatorMessages.isAtMost(thresholdValue)];
    }
    return true;
  };

export const isLessThan =
  (
    threshold: string | ValidatorParam<number>,
    message?: string
  ): FieldValidator<number> =>
  (value, getValue) => {
    const thresholdValue = parseNumericParam(threshold, getValue);
    if (Number(value) >= thresholdValue) {
      return [message ?? validatorMessages.isLessThan(thresholdValue)];
    }
    return true;
  };

export const matches =
  (regex: RegExp, message?: string): PureValidator<string> =>
  (value) => {
    if (regex.test(value)) {
      return true;
    }
    return [message ?? validatorMessages.matches(regex)];
  };

const recPipeValidators =
  (validators: Array<any>, i: number): any =>
  (...args: any) => {
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

export const mergeValidators: ValidatorComposer =
  (...validators: any[]) =>
  (...args: any[]) => {
    const syncResults = validators.map((validate) =>
      (validate as any)(...args)
    );

    const processResult = (results: (true | string[])[]) => {
      const flattenedResults = results.flatMap((result) =>
        result === true ? [] : result
      );
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
  typeof result === "object" && !Array.isArray(result);
