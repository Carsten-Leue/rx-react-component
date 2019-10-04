import {
  ComponentClass,
  createElement,
  FunctionComponent,
  ReactNode
} from 'react';
import { Observable, UnaryFunction } from 'rxjs';

import { RxComponent } from './rx.component';

export type StateFunction<P, S> = (
  props$: Observable<Readonly<P>>,
  init$: Observable<undefined>,
  done$: Observable<undefined>
) => Observable<Readonly<S>>;

export type RenderFunction<P> = UnaryFunction<Readonly<P>, ReactNode>;

export type DelegateComponent<S, DS = any> =
  | FunctionComponent<S>
  | ComponentClass<S, DS>
  | RenderFunction<S>;

/**
 * Checks if a value is a function
 *
 * @param aValue - the value
 * @returns true if the value is a function, else false
 */
const isRenderFunction = (aValue: any): aValue is RenderFunction<any> =>
  typeof aValue === 'function' && !aValue.prototype;

export function rxComponent<P, S, DS = any>(
  aStateFct: StateFunction<P, S>,
  aDelegate: DelegateComponent<S, DS>
): ComponentClass<P, S> {
  /**
   * Construct the renderer
   */
  const render: RenderFunction<S> = isRenderFunction(aDelegate)
    ? aDelegate
    : (aProps: S) => (aProps ? createElement(aDelegate, aProps) : null);

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
      return render(this.state);
    }
  };
}
