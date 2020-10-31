import { shareLatest } from '@react-rxjs/core';
import { createListener } from '@react-rxjs/utils';
import { Observable, EMPTY } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  scan,
  startWith,
  switchMap,
  take,
} from 'rxjs/operators';
import { getKey } from '../path';
import {
  Control,
  ControlOptions,
  createControl,
  SyncObservable,
} from './control';
import { getSyncValue } from './util';

export interface FormRef<T extends Record<string, any>> {
  registerControl: (options: ControlOptions<T, any>) => void;
  getControl: (
    key: string
  ) => {
    setValue: (value: any) => void;
    subscribe: (cb: (value: any) => void) => () => void;
  };
  value$: Observable<Map<string, SyncObservable<any>>>;
  error$: Observable<Map<string, Observable<boolean | string[] | 'pending'>>>;
  dispose: () => void;
}

export const createFormRef = <
  TValues extends Record<string, any> = Record<string, any>
>(): FormRef<TValues> => {
  const [newControl$, registerControl] = createListener<
    ControlOptions<TValues, any>
  >();

  const controls$ = newControl$.pipe(
    scan((controls, controlUpdate$) => {
      const key = getKey(controlUpdate$.key);
      const control = controls.get(key);
      if (control) {
        control.replaceInitialValue(controlUpdate$.initialValue);
        control.replaceValidator(controlUpdate$.validator);
      } else {
        controls.set(
          key,
          createControl(
            {
              ...controlUpdate$,
              key,
            },
            key => controls.get(key)
          )
        );
      }
      return controls;
    }, new Map<string, Control<TValues, any>>()),
    startWith(new Map<string, Control<TValues, any>>()),
    distinctUntilChanged((a, b) => a.size === b.size),
    shareLatest()
  );
  const sub = controls$.subscribe();

  return {
    registerControl,
    getControl: (key: string) => {
      const control$ = controls$.pipe(
        map(controls => controls.get(key)!),
        filter(control => !!control),
        take(1)
      );

      return {
        setValue: (value: TValues) => {
          try {
            getSyncValue(control$).setValue(value);
          } catch (ex) {
            console.warn(
              `Can't set value: Control "${key}" hasn't been registered yet.`
            );
          }
        },
        subscribe: (cb: (value: TValues) => void) => {
          const sub = control$
            .pipe(switchMap(control => control.value$))
            .subscribe(cb);
          return () => {
            sub.unsubscribe();
          };
        },
      };
    },
    value$: controls$.pipe(
      map(
        control =>
          new Map(
            Array.from(control.entries()).map(
              ([key, control]) => [key, control.value$] as const
            )
          )
      )
    ),
    error$: controls$.pipe(
      map(
        control =>
          new Map(
            Array.from(control.entries()).map(
              ([key, control]) => [key, control.error$] as const
            )
          )
      )
    ),
    dispose: () => {
      controls$.pipe(take(1)).subscribe(controls => {
        Array.from(controls.values()).forEach(control => control.dispose());
      });
      sub.unsubscribe();
    },
  };
};
