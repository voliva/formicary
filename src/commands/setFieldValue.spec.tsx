import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useForm } from '../hooks/useForm';
import { useInput } from '../hooks/useInput';
import { useIsValid } from '../hooks/useIsValid';
import { readForm } from './readForm';
import { setFieldValue } from './setFieldValue';

const Form = ({ onSubmit, initialValue, validator }: any) => {
  const form = useForm({
    initialValue,
  });
  const isValid = useIsValid(form);

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSubmit(readForm(form));
      }}
    >
      <input type="text" name="value" ref={useInput(form, { validator })} />
      <input type="text" name="nested.value" ref={useInput(form)} />
      <div data-testid="isValid">{String(isValid)}</div>
      <input type="submit" value="Submit" />
      <button
        data-testid="setFieldValue"
        type="button"
        onClick={() => setFieldValue(form, 'value', 'value set')}
      ></button>
      <button
        data-testid="setMultiple"
        type="button"
        onClick={() =>
          setFieldValue(form, v => v, {
            nested: {
              value: 'multiple set 0',
            },
            value: 'multiple set 1',
          })
        }
      ></button>
      <button
        data-testid="setMultipleIgnore"
        type="button"
        onClick={() =>
          setFieldValue(form, v => v, {
            nested: {
              value: 'ignoring some',
            },
          })
        }
      ></button>
    </form>
  );
};

describe('setFieldValue', () => {
  it('sets the value of individual fields', () => {
    const onSubmit = jest.fn();
    const { container, getByTestId } = render(<Form onSubmit={onSubmit} />);
    userEvent.click(container.querySelector('input[type="submit"]')!);
    expect(onSubmit).toHaveBeenCalledWith({
      nested: {
        value: '',
      },
      value: '',
    });

    userEvent.click(getByTestId('setFieldValue'));
    userEvent.click(container.querySelector('input[type="submit"]')!);
    expect(onSubmit).toHaveBeenCalledWith({
      nested: {
        value: '',
      },
      value: 'value set',
    });
  });

  it('sets the value of multiple fields', () => {
    const onSubmit = jest.fn();
    const { container, getByTestId } = render(<Form onSubmit={onSubmit} />);
    userEvent.click(getByTestId('setMultiple'));
    userEvent.click(container.querySelector('input[type="submit"]')!);
    expect(onSubmit).toHaveBeenCalledWith({
      nested: {
        value: 'multiple set 0',
      },
      value: 'multiple set 1',
    });
  });

  it('ignores fields not explicitely passed in', () => {
    const onSubmit = jest.fn();
    const { container, getByTestId } = render(<Form onSubmit={onSubmit} />);
    userEvent.click(getByTestId('setMultipleIgnore'));
    userEvent.type(
      container.querySelector('input[name="value"]')!,
      'typed in value'
    );
    userEvent.click(container.querySelector('input[type="submit"]')!);
    expect(onSubmit).toHaveBeenCalledWith({
      nested: {
        value: 'ignoring some',
      },
      value: 'typed in value',
    });
  });
});
