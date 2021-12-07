/**
 * This fake form ref addresses the fact that:
 * -> The original FormRef is all an implementational detail and should not be used directly by consumers.
 * -> The types of their properties prevent assigning refs to subtypes that should be compatible.
 *
 * For example, if we have a FormRef<{ name: string, age: number, likesCookies: boolean }>
 * we might have a subcomponent that only deals with the user details `name` and `age`.
 * In that case, we want to declare that the component takes a FormRef<{ name: string, age: number }>
 * and we expect that the original ref type should be assignable to this one.
 *
 * With the complex internal structure, typescript won't allow this. But with this simplified
 * one, it does:
 */

const internal = Symbol();
export interface FormRef<T extends Record<string, any>> {
  [internal]: T;
}

const formA: FormRef<{ name: string; age: number; likesCookies: boolean }> =
  null as any;
const formB: FormRef<{ name: string }> = formA; // Should OK
// @ts-expect-error formA doesn't have property gender: string
const formC: FormRef<{ gender: string }> = formA; // Should Err
