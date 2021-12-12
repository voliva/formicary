import { State } from "derive-state";
import { ControlState, FormRef } from "../internal/formRef";
import { buildObject } from "../internal/path";

export function getFormErrors(formRef: FormRef<any>) {
  return buildObject(
    Object.fromEntries(
      Array.from(formRef.controlStates.entries()).map(([key, state]) => [
        key,
        getControlStateError(state),
      ])
    )
  );
}

function getControlStateError(state: State<ControlState<any>>) {
  try {
    return state.getValue().error$.getValue();
  } catch (ex) {
    return false;
  }
}
