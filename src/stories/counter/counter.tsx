import * as React from 'react';
import { MouseEvent } from 'react';
import { merge, Observable, Subject, UnaryFunction } from 'rxjs';
import { map, scan, switchMap } from 'rxjs/operators';

import { bindNext, prop, rxComponent } from '../../public_api';

export interface CounterProps {
  initial: number;
}

export interface CounterViewProps {
  counter: number;
  onClick: UnaryFunction<MouseEvent, void>;
}

/**
 * The view only component
 */
const viewOnly = ({ counter, onClick }: CounterViewProps) => (
  <div>
    <div>Counter {counter}</div>
    <button onClick={onClick}>Increment</button>
  </div>
);

function bloc(props$: Observable<CounterProps>): Observable<CounterViewProps> {
  const initial$ = props$.pipe(prop('initial'));

  const clickSubject = new Subject<any>();
  const click$ = initial$.pipe(
    switchMap(initial => clickSubject.pipe(scan(value => value + 1, initial)))
  );

  const onClick = bindNext(clickSubject);

  const value$ = merge(initial$, click$);

  return value$.pipe(map(counter => ({ counter, onClick })));
}

export const Counter = rxComponent<CounterProps, CounterViewProps>(
  bloc,
  viewOnly
);
