Features

Breaking

TODO

- getInitialValue
- getAllErrors
- investigate arrays
- add test to verify initialValue on useForm prevails over initialValue on useInput
- Define what happens when a field gets unmounted: Is it saved? validators still apply? is it removed?
  -> By default, value is retained. Option to have it removed on unmount.

=> keys as strings are still quite hard to get right and working with all possible variations
let's completely drop that idea and roll back to proxy-based key selector, with optional key-based (maybe?)

=> useInput is too smart. react-hook-forms@v3 removed the optional key grabbing it from the name, do the same.

=> initialValue is always optional, and defaults to undefined
-> all fields can potentially return undefined when read.
-> all fields can be set to undefined
-> null will be handled by the consumer (setting it as a possible value)
-> reading the form will return the original object interface, without adding undefineds.
---> It's consumer's responsability to add validation rules and check validation before submit.
