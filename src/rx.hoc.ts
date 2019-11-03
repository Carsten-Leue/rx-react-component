import { ComponentClass, createElement, FunctionComponent } from 'react';
import { Observable } from 'rxjs';

import { RxComponent } from './rx.component';

export type StateFunction<P, S> = (
  props$: Observable<Readonly<P>>,
  init$: Observable<undefined>,
  done$: Observable<undefined>
) => Observable<Readonly<S>>;

export type DelegateComponent<S, DS = any> =
  | FunctionComponent<S>
  | ComponentClass<S, DS>;

export function rxComponent<P, S, DS = any>(
  aStateFct: StateFunction<P, S>,
  aDelegate: DelegateComponent<S, DS>
): ComponentClass<P, S> {
  return class extends RxComponent<P, S> {
    /**
     * Initialize our new component
     *
     * @param aInitial - the initial props
     */
    constructor(aInitial: Readonly<P>) {
      super(aInitial);
      // connect the state
      const { props$, init$, done$ } = this;
      this.connectState(aStateFct(props$, init$, done$));
    }

    render() {
      const { state } = this;
      return state ? createElement(aDelegate, state) : null;
    }
  };
}
