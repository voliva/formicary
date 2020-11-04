import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { isNumber, pipeValidators, useErrors, useForm, useInput } from '../src';
import { isAtMost } from '../src/validators';

const Form = () => {
  const form = useForm<{
    min: number;
    max: number;
  }>();
  const errors = useErrors(form);

  return (
    <div>
      <input
        placeholder="min"
        ref={useInput(form, {
          key: v => v.min,
          initialValue: '0',
          validator: pipeValidators(isNumber, isAtMost('max')),
        })}
      />
      <input
        placeholder="max"
        name="max"
        ref={useInput(form, {
          initialValue: '10',
          validator: isNumber,
        })}
      />
      <div data-testid="errors">{Object.keys(errors).join(' ')}</div>
    </div>
  );
};

describe('useForm', () => {
  it('starts with default values', () => {
    const { getByPlaceholderText } = render(<Form />);

    expect(getByPlaceholderText('min')).toHaveValue('0');
    expect(getByPlaceholderText('max')).toHaveValue('10');
  });

  it('validates fields by their own', () => {
    const { getByPlaceholderText, getByTestId } = render(<Form />);

    expect(getByTestId('errors')).toHaveTextContent('');
    userEvent.type(getByPlaceholderText('min'), '12');
    userEvent.tab();
    expect(getByTestId('errors')).toHaveTextContent('min');
  });

  it('refreshes validation on fields that depend on it', () => {
    const { getByPlaceholderText, getByTestId } = render(<Form />);

    expect(getByTestId('errors')).toHaveTextContent('');
    userEvent.type(getByPlaceholderText('min'), '12');
    userEvent.tab();
    expect(getByTestId('errors')).toHaveTextContent('min');
    userEvent.type(getByPlaceholderText('max'), '15');
    expect(getByTestId('errors')).toHaveTextContent('');
  });
});
