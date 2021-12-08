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
