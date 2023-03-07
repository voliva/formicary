import "@testing-library/jest-dom/extend-expect";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { isNumber, pipeValidators, useErrors, useForm, useInput } from "../src";
import { isAtMost } from "../src/validators";

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
        ref={useInput(form, (v) => v.min, {
          initialValue: "0",
          validator: pipeValidators(isNumber(), isAtMost("max")),
        })}
      />
      <input
        placeholder="max"
        name="max"
        ref={useInput(form, (v) => v.max, {
          initialValue: "10",
          validator: isNumber(),
        })}
      />
      <div data-testid="errors">{Object.keys(errors).join(" ")}</div>
    </div>
  );
};

describe("useForm", () => {
  it("starts with default values", () => {
    const { getByPlaceholderText } = render(<Form />);

    expect(getByPlaceholderText("min")).toHaveValue("0");
    expect(getByPlaceholderText("max")).toHaveValue("10");
  });

  it("validates fields by their own", async () => {
    const { getByPlaceholderText, getByTestId } = render(<Form />);

    expect(getByTestId("errors")).toHaveTextContent("");
    userEvent.type(getByPlaceholderText("min"), "12");
    userEvent.tab();

    // Wait for error to propagate
    await act(async () => {});

    expect(getByTestId("errors")).toHaveTextContent("min");
  });

  it("refreshes validation on fields that depend on it", async () => {
    const { getByPlaceholderText, getByTestId } = render(<Form />);

    expect(getByTestId("errors")).toHaveTextContent("");
    userEvent.type(getByPlaceholderText("min"), "12");
    userEvent.tab();

    // Wait for error to propagate
    await act(async () => {});

    expect(getByTestId("errors")).toHaveTextContent("min");
    userEvent.type(getByPlaceholderText("max"), "15");
    expect(getByTestId("errors")).toHaveTextContent("");
  });
});
