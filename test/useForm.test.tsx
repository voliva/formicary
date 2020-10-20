import * as React from 'react';
import { isNumber, pipeValidators, useForm } from '../src';
import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import { isAtMost } from '../src/validators';

const Form = () => {
  const { register, errors } = useForm({
    default: {
      min: 0,
      max: 10,
    },
    onSubmit: () => {},
  });

  return (
    <div>
      <input
        placeholder="min"
        ref={register({
          key: 'min',
          validator: pipeValidators(isNumber, isAtMost('max')),
        })}
      />
      <input
        placeholder="max"
        ref={register({ key: 'max', validator: isNumber })}
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

  it('validates fields by their own', async () => {
    const { getByPlaceholderText, getByTestId } = render(<Form />);

    expect(getByTestId('errors')).toHaveTextContent('');
    await act(async () => {
      // pipeValidators turns validation into an async task, so it triggers async results
      userEvent.type(getByPlaceholderText('min'), '12');
    });
    expect(getByTestId('errors')).toHaveTextContent('min');
  });

  it('refreshes validation on fields that depend on it', async () => {
    const { getByPlaceholderText, getByTestId } = render(<Form />);

    expect(getByTestId('errors')).toHaveTextContent('');
    await act(async () => {
      userEvent.type(getByPlaceholderText('min'), '12');
    });
    expect(getByTestId('errors')).toHaveTextContent('min');
    await act(async () => {
      userEvent.type(getByPlaceholderText('max'), '15');
    });
    expect(getByTestId('errors')).toHaveTextContent('');
  });
});
