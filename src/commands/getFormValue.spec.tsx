/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { render, renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { useForm } from "../hooks/useForm";
import { useInput } from "../hooks/useInput";
import { subfield } from "../internal/subfield";
import { getFormValue } from "./getFormValue";

const Form = ({ onSubmit, initialValue, validator }: any) => {
  const form = useForm({
    initialValue,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(getFormValue(form));
      }}
    >
      <input
        type="text"
        name="value"
        ref={useInput(form, "value", { validator })}
      />
      <input
        type="text"
        name="nested.value"
        ref={useInput(form, "nested.value")}
      />
      <input type="submit" value="Submit" />
    </form>
  );
};

describe("readForm", () => {
  it("returns an empty object if no value has been set yet", () => {
    const hookResult = renderHook(() => useForm());
    const result = getFormValue(hookResult.result.current);
    expect(result).toEqual({});
    hookResult.unmount();
  });

  it("returns the nested value of the form", async () => {
    const onSubmit = jest.fn();
    const { container } = render(<Form onSubmit={onSubmit} />);
    await userEvent.type(
      container.querySelector('input[name="value"]')!,
      "shallowValue"
    );
    await userEvent.type(
      container.querySelector('input[name="nested.value"]')!,
      "nestedValue"
    );
    await userEvent.click(container.querySelector('input[type="submit"]')!);

    expect(onSubmit).toHaveBeenCalledWith({
      value: "shallowValue",
      nested: {
        value: "nestedValue",
      },
    });
  });

  it("doesn't change the value once read", async () => {
    const onSubmit = jest.fn<
      void,
      [{ value: string; nested: { value: string } }]
    >();
    const { container } = render(
      <Form
        onSubmit={onSubmit}
        initialValue={{
          value: "initial0",
          nested: subfield({
            value: "initial1",
          }),
        }}
      />
    );
    await userEvent.click(container.querySelector('input[type="submit"]')!);
    const [result] = onSubmit.mock.calls[0];

    await userEvent.type(
      container.querySelector('input[name="value"]')!,
      "shallowValue"
    );
    await userEvent.type(
      container.querySelector('input[name="nested.value"]')!,
      "nestedValue"
    );
    await userEvent.click(container.querySelector('input[type="submit"]')!);

    expect(result.value).toBe("initial0");
    expect(result.nested.value).toBe("initial1");
  });

  it("returns all fields, even if they're invalid", async () => {
    const onSubmit = jest.fn<
      void,
      [{ value: string; nested: { value: string } }]
    >();
    const { container } = render(
      <Form
        onSubmit={onSubmit}
        initialValue={{
          value: "will this value work?",
        }}
        validator={() => ["nah NEVER! ;P"]}
      />
    );

    await userEvent.click(container.querySelector('input[type="submit"]')!);
    const [result] = onSubmit.mock.calls[0];
    expect(result).toEqual({
      value: "will this value work?",
      nested: {
        value: "",
      },
    });
  });
});
