import { Paths, ValueOfPath } from "./internal/path";

const validatorMessages = {
  isNumber: () => "Expected a number",
  isInteger: () => "Expected an integer",
  isRequired: () => "Required",
  isAtLeast: (threshold: number) => "Expected a value of at least " + threshold,
  isGreaterThan: (threshold: number) =>
    "Expected a value greater than " + threshold,
  isAtMost: (threshold: number) => "Expected a value of at most " + threshold,
  isLessThan: (threshold: number) => "Expected a value less than " + threshold,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
export type Validator<T, TValues = any> = (
  value: T,
  getValue: <P extends Paths<TValues>>(key: P) => ValueOfPath<TValues, P>
) => true | string[] | Promise<true | string[]>;

type ValidatorParam<T> = T | ((getValue: (key: string) => any) => T);

export const isNumber =
  (message?: string): PureValidator<any> =>
  (value) => {
    if (isNil(value)) return true;
    if (isNaN(value)) {
      return [message ?? validatorMessages.isNumber()];
    }
    return true;
  };

export const isInteger =
  (message?: string): PureValidator<any> =>
  (value) => {
    if (isNil(value)) return true;
    if (parseInt(value) !== parseFloat(value)) {
      return [message ?? validatorMessages.isInteger()];
    }
    return true;
  };

export const isRequired =
  (message?: string): PureValidator<any> =>
  (value) =>
    isNil(value) || value === ""
      ? [message ?? validatorMessages.isRequired()]
      : true;

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
  ): Validator<Nilable<number>> =>
  (value, getValue) => {
    if (isNil(value)) return true;
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
  ): Validator<Nilable<number>> =>
  (value, getValue) => {
    if (isNil(value)) return true;
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
  ): Validator<Nilable<number>> =>
  (value, getValue) => {
    if (isNil(value)) return true;
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
  ): Validator<Nilable<number>> =>
  (value, getValue) => {
    if (isNil(value)) return true;
    const thresholdValue = parseNumericParam(threshold, getValue);
    if (Number(value) >= thresholdValue) {
      return [message ?? validatorMessages.isLessThan(thresholdValue)];
    }
    return true;
  };

export const matches =
  (regex: RegExp, message?: string): PureValidator<Nilable<string>> =>
  (value) => {
    if (isNil(value)) return true;
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
  <TValues>(...validators: Array<Validator<any, TValues>>): Validator<
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
    getValue: <P extends Paths<TValues>>(key: P) => ValueOfPath<TValues, P>
  ) => boolean,
  validator: PureValidator<T> | Validator<T, TValues>
): Validator<T, TValues> {
  return (value, getValue) => {
    if (condition(value, getValue)) {
      return validator(value, getValue);
    }
    return true;
  };
}

export const noopValidator: PureValidator<any> = () => true;

const validationResultIsAsync = (
  result: ReturnType<Validator<any>>
): result is Promise<any> =>
  typeof result === "object" && !Array.isArray(result);

type Nilable<T> = T | undefined | null;
const isNil = <T>(v: Nilable<T>): v is null | undefined => v == null;
