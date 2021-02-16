import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useForm } from '../hooks/useForm';
import { useInput } from '../hooks/useInput';
import { subfield } from '../internal/subfield';
import { readForm } from './readForm';

const Form = ({ onSubmit, initialValue, validator }: any) => {
  const form = useForm({
    initialValue,
  });

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSubmit(readForm(form));
      }}
    >
      <input type="text" name="value" ref={useInput(form, { validator })} />
      <input type="text" name="nested.value" ref={useInput(form)} />
      <input type="submit" value="Submit" />
    </form>
  );
};

describe('readForm', () => {
  it('returns an empty object if no value has been set yet', () => {
    const hookResult = renderHook(() => useForm());
    const result = readForm(hookResult.result.current);
    expect(result).toEqual({});
    hookResult.unmount();
  });

  it('returns the nested value of the form', () => {
    const onSubmit = jest.fn();
    const { container } = render(<Form onSubmit={onSubmit} />);
    userEvent.type(
      container.querySelector('input[name="value"]')!,
      'shallowValue'
    );
    userEvent.type(
      container.querySelector('input[name="nested.value"]')!,
      'nestedValue'
    );
    userEvent.click(container.querySelector('input[type="submit"]')!);

    expect(onSubmit).toHaveBeenCalledWith({
      value: 'shallowValue',
      nested: {
        value: 'nestedValue',
      },
    });
  });

  it("doesn't change the value once read", () => {
    const onSubmit = jest.fn<
      void,
      [{ value: string; nested: { value: string } }]
    >();
    const { container } = render(
      <Form
        onSubmit={onSubmit}
        initialValue={{
          value: 'initial0',
          nested: subfield({
            value: 'initial1',
          }),
        }}
      />
    );
    userEvent.click(container.querySelector('input[type="submit"]')!);
    const [result] = onSubmit.mock.calls[0];

    userEvent.type(
      container.querySelector('input[name="value"]')!,
      'shallowValue'
    );
    userEvent.type(
      container.querySelector('input[name="nested.value"]')!,
      'nestedValue'
    );
    userEvent.click(container.querySelector('input[type="submit"]')!);

    expect(result.value).toBe('initial0');
    expect(result.nested.value).toBe('initial1');
  });

  it("returns all fields, even if they're invalid", () => {
    const onSubmit = jest.fn<
      void,
      [{ value: string; nested: { value: string } }]
    >();
    const { container } = render(
      <Form
        onSubmit={onSubmit}
        initialValue={{
          value: 'will this value work?',
        }}
        validator={() => ['nah NEVER! ;P']}
      />
    );

    userEvent.click(container.querySelector('input[type="submit"]')!);
    const [result] = onSubmit.mock.calls[0];
    expect(result).toEqual({
      value: 'will this value work?',
      nested: {
        value: '',
      },
    });
  });
});
