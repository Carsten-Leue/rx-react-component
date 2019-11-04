import * as React from 'react';
import { MouseEvent } from 'react';
import { Subject, UnaryFunction } from 'rxjs';
import { map, scan, startWith } from 'rxjs/operators';

import { RxComponent } from '../../rx.component';

export interface CounterProps {
  initial: number;
}

export interface CounterState {
  value: number;
}

export class Counter extends RxComponent<CounterProps, CounterState> {
  private readonly onClick: UnaryFunction<MouseEvent, void>;

  constructor(aProps: Readonly<CounterProps>) {
    super(aProps);

    const clickSubject = new Subject<any>();
    const value$ = clickSubject.pipe(
      startWith(null),
      scan(value => value + 1, aProps.initial - 1)
    );

    this.onClick = clickSubject.next.bind(clickSubject);

    const state$ = value$.pipe(map(value => ({ value })));

    this.connectState(state$);
  }

  render() {
    const { value } = this.state;
    return (
      <div>
        <div>Counter {value}</div>
        <button onClick={this.onClick}>Increment</button>
      </div>
    );
  }
}
