import "@testing-library/jest-dom/extend-expect";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  FormRef,
  isAtMost,
  isNumber,
  pipeValidators,
  useErrors,
  useForm,
  useInput,
  useIsPristine,
} from "../src";

interface FormData {
  min: number;
  max: number;
}

const RemovableInput = ({ form }: { form: FormRef<FormData> }) => {
  const ref = useInput(form, (v) => v.min, {
    initialValue: "0",
    validator: pipeValidators(isNumber(), isAtMost("max")),
    unregisterOnUnmount: true,
  });

  return <input placeholder="min" ref={ref} />;
};

const Form = ({ withMin }: { withMin?: boolean }) => {
  const form = useForm<FormData>();
  const errors = useErrors(form);
  const isPristine = useIsPristine(form);

  return (
    <div>
      {withMin && <RemovableInput form={form} />}
      <input
        placeholder="max"
        name="max"
        ref={useInput(form, (v) => v.max, {
          initialValue: "10",
          validator: isNumber(),
        })}
      />
      <div data-testid="errors">{Object.keys(errors).join(" ")}</div>
      <div data-testid="pristine">{isPristine ? "yes" : "no"}</div>
    </div>
  );
};

describe("unregister", () => {
  it("removes the error state", async () => {
    const { getByPlaceholderText, getByTestId, rerender } = render(
      <Form withMin />
    );

    expect(getByTestId("errors")).toHaveTextContent("");

    await userEvent.type(getByPlaceholderText("min"), "12");
    await userEvent.tab();

    expect(getByTestId("errors")).toHaveTextContent("min");

    rerender(<Form withMin={false} />);

    expect(getByTestId("errors")).toHaveTextContent("");
  });

  it("removes the pristine state", async () => {
    const { getByPlaceholderText, getByTestId, rerender } = render(
      <Form withMin />
    );

    expect(getByTestId("pristine")).toHaveTextContent("yes");

    await userEvent.type(getByPlaceholderText("min"), "5");
    await userEvent.tab();

    expect(getByTestId("pristine")).toHaveTextContent("no");

    rerender(<Form withMin={false} />);

    expect(getByTestId("pristine")).toHaveTextContent("yes");
  });

  it("doesn't crash when unmounting the parent component", () => {
    const { getByTestId, unmount } = render(<Form withMin />);

    expect(getByTestId("pristine")).toHaveTextContent("yes");

    const spy = jest.spyOn(console, "error");

    unmount();

    expect(spy).not.toHaveBeenCalled();
  });
});
