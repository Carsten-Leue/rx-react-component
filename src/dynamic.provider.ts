import { Context } from 'react';
import { combineLatest, ObservableInput } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

import { BaseProvider, BaseProviderProps } from './base.provider';
import { rxComponent, StateFunction } from './rx.component';

export interface DynamicProviderProps {
  value: ObservableInput<any>;
  ctx: Context<any>;
}

// controller that decodes the state
const controller: StateFunction<
  DynamicProviderProps,
  BaseProviderProps
> = props$ => {
  // extract the values
  const value$ = props$.pipe(
    switchMap(props => props.value),
    distinctUntilChanged()
  );
  const ctx$ = props$.pipe(map(prop => prop.ctx));
  const children$ = props$.pipe(map(prop => prop.children));
  // merge
  return combineLatest([value$, ctx$, children$]).pipe(
    map(([value, ctx, children]) => ({
      value,
      ctx,
      children
    }))
  );
};

/**
 * Implementation of a provider that provides the value
 * issued by an observable.
 */
export const DynamicProvider = rxComponent(controller, BaseProvider);
