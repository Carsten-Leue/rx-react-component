import * as React from 'react';
import { MouseEvent } from 'react';
import { EMPTY, merge, Observable, Subject, UnaryFunction } from 'rxjs';
import { map, switchMapTo, withLatestFrom } from 'rxjs/operators';

import { rxComponent } from '../../rx.hoc';
import { bindNext, prop } from '../../utils';

export interface ControlledCounterProps {
  value: number;
  onIncrement: UnaryFunction<number, void>;
}

export interface ControlledCounterState {
  counter: number;
  onClick: UnaryFunction<MouseEvent, void>;
}

/**
 * The view only component
 */
const viewOnly = ({ counter, onClick }: ControlledCounterState) => (
  <div>
    <div>ControlledCounter {counter}</div>
    <button onClick={onClick}>Increment</button>
  </div>
);

function bloc(
  props$: Observable<ControlledCounterProps>
): Observable<ControlledCounterState> {
  // the controlled input
  const value$ = props$.pipe(prop('value'));

  const clickSubject = new Subject<any>();
  const onClick = bindNext(clickSubject);

  const click$ = clickSubject.pipe(
    withLatestFrom(value$, props$),
    map(([, value, { onIncrement }]) => onIncrement(value + 1)),
    switchMapTo(EMPTY)
  );

  return merge(value$, click$).pipe(map(counter => ({ counter, onClick })));
}

export const ControlledCounter = rxComponent<
  ControlledCounterProps,
  ControlledCounterState
>(bloc, viewOnly);
