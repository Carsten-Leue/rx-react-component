import {
  Context,
  createElement,
  FC,
  useContext,
  useEffect,
  useState
} from 'react';
import { from, ObservableInput, Unsubscribable } from 'rxjs';

import { assertProvider } from './context';
import { createReactProvider, ReactProvider } from './provider';

// prettier-ignore
export interface InjectableReactProviderFactory {
  // no dependencies
  <T>(fct: (req?: never, opt?: never) => T, ctx: Context<T>): ReactProvider<T>;
  // only required dependencies
  <R1, T>(fct: (req: [R1], opt?: never) => T, ctx: Context<T>, req: [Context<R1>]):  ReactProvider<T>;
  <R1, R2, T>(fct: (req: [R1, R2], opt?: never) => T, ctx: Context<T>, req: [Context<R1>, Context<R2>]):  ReactProvider<T>;
  <R1, R2, R3, T>(fct: (req: [R1, R2, R3], opt?: never) => T, ctx: Context<T>, req: [Context<R1>, Context<R2>, Context<R3>]):  ReactProvider<T>;
  <R1, R2, R3, R4, T>(fct: (req: [R1, R2, R3, R4], opt?: never) => T, ctx: Context<T>, req: [Context<R1>, Context<R2>, Context<R3>, Context<R4>]):  ReactProvider<T>;
  // only optional dependencies
  <O1, T>(fct: (req: never, opt:[O1?]) => T, ctx: Context<T>, req: never, opt:[Context<O1>]):  ReactProvider<T>;
  <O1, O2, T>(fct: (req: never, opt:[O1?, O2?]) => T, ctx: Context<T>, req: never, opt:[Context<O1>, Context<O2>]):  ReactProvider<T>;
  <O1, O2, O3, T>(fct: (req: never, opt:[O1?, O2?, O3?]) => T, ctx: Context<T>, req: never, opt:[Context<O1>, Context<O2>, Context<O3>]):  ReactProvider<T>;
  <O1, T>(fct: (req: [], opt:[O1?]) => T, ctx: Context<T>, req: [], opt:[Context<O1>]):  ReactProvider<T>;
  <O1, O2, T>(fct: (req: [], opt:[O1?, O2?]) => T, ctx: Context<T>, req: [], opt:[Context<O1>, Context<O2>]):  ReactProvider<T>;
  <O1, O2, O3, T>(fct: (req: [], opt:[O1?, O2?, O3?]) => T, ctx: Context<T>, req: [], opt:[Context<O1>, Context<O2>, Context<O3>]):  ReactProvider<T>;
  // one required and optional dependencies
  <R1, O1, T>(fct: (req: [R1], opt:[O1?]) => T, ctx: Context<T>, req: [Context<R1>], opt:[Context<O1>]):  ReactProvider<T>;
  <R1, O1, O2, T>(fct: (req: [R1], opt:[O1?, O2?]) => T, ctx: Context<T>, req: [Context<R1>], opt:[Context<O1>, Context<O2>]):  ReactProvider<T>;
  // two required and optional dependencies
  <R1, R2, O1, T>(fct: (req: [R1, R2], opt:[O1?]) => T, ctx: Context<T>, req: [Context<R1>, Context<R2>], opt:[Context<O1>]):  ReactProvider<T>;
  <R1, R2, O1, O2, T>(fct: (req: [R1, R2], opt:[O1?, O2?]) => T, ctx: Context<T>, req: [Context<R1>, Context<R2>], opt:[Context<O1>, Context<O2>]):  ReactProvider<T>;
  // three required and optional dependencies
  <R1, R2, R3, O1, T>(fct: (req: [R1, R2, R3], opt:[O1?]) => T, ctx: Context<T>, req: [Context<R1>, Context<R2>, Context<R3>], opt:[Context<O1>]):  ReactProvider<T>;
  <R1, R2, R3, O1, O2, T>(fct: (req: [R1, R2, R3], opt:[O1?, O2?]) => T, ctx: Context<T>, req: [Context<R1>, Context<R2>, Context<R3>], opt:[Context<O1>, Context<O2>]):  ReactProvider<T>;
  // four required and optional dependencies
  <R1, R2, R3, R4, O1, T>(fct: (req: [R1, R2, R3, R4], opt:[O1?]) => T, ctx: Context<T>, req: [Context<R1>, Context<R2>, Context<R3>, Context<R4>], opt:[Context<O1>]):  ReactProvider<T>;
  // five required and optional dependencies
  <R1, R2, R3, R4, R5, O1, T>(fct: (req: [R1, R2, R3, R4, R5], opt:[O1?]) => T, ctx: Context<T>, req: [Context<R1>, Context<R2>, Context<R3>, Context<R4>, Context<R5>], opt:[Context<O1>]):  ReactProvider<T>;
}

// prettier-ignore
export interface DynamicReactProviderFactory {
  // no dependencies
  <T>(fct: (req?: never, opt?: never) => ObservableInput<T>, ctx: Context<T>): ReactProvider<T>;
  // only required dependencies
  <R1, T>(fct: (req: [R1], opt?: never) => ObservableInput<T>, ctx: Context<T>, req: [Context<R1>]):  ReactProvider<T>;
  <R1, R2, T>(fct: (req: [R1, R2], opt?: never) => ObservableInput<T>, ctx: Context<T>, req: [Context<R1>, Context<R2>]):  ReactProvider<T>;
  <R1, R2, R3, T>(fct: (req: [R1, R2, R3], opt?: never) => ObservableInput<T>, ctx: Context<T>, req: [Context<R1>, Context<R2>, Context<R3>]):  ReactProvider<T>;
  <R1, R2, R3, R4, T>(fct: (req: [R1, R2, R3, R4], opt?: never) => ObservableInput<T>, ctx: Context<T>, req: [Context<R1>, Context<R2>, Context<R3>, Context<R4>]):  ReactProvider<T>;
  // only optional dependencies
  <O1, T>(fct: (req: never, opt:[O1?]) => ObservableInput<T>, ctx: Context<T>, req: never, opt:[Context<O1>]):  ReactProvider<T>;
  <O1, O2, T>(fct: (req: never, opt:[O1?, O2?]) => ObservableInput<T>, ctx: Context<T>, req: never, opt:[Context<O1>, Context<O2>]):  ReactProvider<T>;
  <O1, O2, O3, T>(fct: (req: never, opt:[O1?, O2?, O3?]) => ObservableInput<T>, ctx: Context<T>, req: never, opt:[Context<O1>, Context<O2>, Context<O3>]):  ReactProvider<T>;
  <O1, T>(fct: (req: [], opt:[O1?]) => ObservableInput<T>, ctx: Context<T>, req: [], opt:[Context<O1>]):  ReactProvider<T>;
  <O1, O2, T>(fct: (req: [], opt:[O1?, O2?]) => ObservableInput<T>, ctx: Context<T>, req: [], opt:[Context<O1>, Context<O2>]):  ReactProvider<T>;
  <O1, O2, O3, T>(fct: (req: [], opt:[O1?, O2?, O3?]) => ObservableInput<T>, ctx: Context<T>, req: [], opt:[Context<O1>, Context<O2>, Context<O3>]):  ReactProvider<T>;
  // one required and optional dependencies
  <R1, O1, T>(fct: (req: [R1], opt:[O1?]) => ObservableInput<T>, ctx: Context<T>, req: [Context<R1>], opt:[Context<O1>]):  ReactProvider<T>;
  <R1, O1, O2, T>(fct: (req: [R1], opt:[O1?, O2?]) => ObservableInput<T>, ctx: Context<T>, req: [Context<R1>], opt:[Context<O1>, Context<O2>]):  ReactProvider<T>;
  // two required and optional dependencies
  <R1, R2, O1, T>(fct: (req: [R1, R2], opt:[O1?]) => ObservableInput<T>, ctx: Context<T>, req: [Context<R1>, Context<R2>], opt:[Context<O1>]):  ReactProvider<T>;
  <R1, R2, O1, O2, T>(fct: (req: [R1, R2], opt:[O1?, O2?]) => ObservableInput<T>, ctx: Context<T>, req: [Context<R1>, Context<R2>], opt:[Context<O1>, Context<O2>]):  ReactProvider<T>;
  // three required and optional dependencies
  <R1, R2, R3, O1, T>(fct: (req: [R1, R2, R3], opt:[O1?]) => ObservableInput<T>, ctx: Context<T>, req: [Context<R1>, Context<R2>, Context<R3>], opt:[Context<O1>]):  ReactProvider<T>;
  <R1, R2, R3, O1, O2, T>(fct: (req: [R1, R2, R3], opt:[O1?, O2?]) => ObservableInput<T>, ctx: Context<T>, req: [Context<R1>, Context<R2>, Context<R3>], opt:[Context<O1>, Context<O2>]):  ReactProvider<T>;
  // four required and optional dependencies
  <R1, R2, R3, R4, O1, T>(fct: (req: [R1, R2, R3, R4], opt:[O1?]) => ObservableInput<T>, ctx: Context<T>, req: [Context<R1>, Context<R2>, Context<R3>, Context<R4>], opt:[Context<O1>]):  ReactProvider<T>;
  // five required and optional dependencies
  <R1, R2, R3, R4, R5, O1, T>(fct: (req: [R1, R2, R3, R4, R5], opt:[O1?]) => ObservableInput<T>, ctx: Context<T>, req: [Context<R1>, Context<R2>, Context<R3>, Context<R4>, Context<R5>], opt:[Context<O1>]):  ReactProvider<T>;
}

/**
 * Tests if we have an unsubscribable object that requires teardown
 *
 * @param aValue - the value to check
 * @returns true if the value is unsubscribable
 */
const isUnsubscribable = (aValue: any): aValue is Unsubscribable =>
  aValue && typeof aValue['unsubscribe'] === 'function';

/**
 * Safely unsubscribe the value
 *
 * @param aValue - the value in questions
 */
const unsubscribe = (aValue: any): any =>
  isUnsubscribable(aValue) && aValue.unsubscribe();

const resolveOptionalDependency = <T>(context: Context<T>) =>
  useContext(context);

const resolveRequiredDependency = (
  aContext: Context<any>,
  aParent: Context<any>
) => assertProvider(useContext(aContext), aContext, aParent);

/**
 * Creates a provider from a statically provided value
 *
 * @param aFct  - the function that creates the value
 * @param aCtx  - the context to provide
 * @param aReq  - the required dependencies
 * @param aOpt  - the optional dependencies
 *
 * @returns the functional component that provides the value
 */
const createStaticProvider = <T>(
  aFct: (req: any[], opt: any[]) => T,
  aCtx: Context<T>,
  aReq: Array<Context<any>> = [],
  aOpt: Array<Context<any>> = []
): FC => ({ children }) => {
  // construct the value using hooks
  const value = aFct(
    aReq.map(dep => resolveRequiredDependency(dep, aCtx)),
    aOpt.map(resolveOptionalDependency)
  );
  // listen for the end of the lifecycle
  useEffect(() => () => unsubscribe(value), []);
  // provide the value
  return createElement(aCtx.Provider, { value }, children);
};

/**
 * Creates a provider from a dynamically provided value
 *
 * @param aFct  - the function that creates an observable of the value
 * @param aCtx  - the context to provide
 * @param aReq  - the required dependencies
 * @param aOpt  - the optional dependencies
 *
 * @returns the functional component that provides the value
 */
const createDynamicProvider = <T>(
  aFct: (req: any[], opt: any[]) => ObservableInput<T>,
  aCtx: Context<T>,
  aReq: Array<Context<any>> = [],
  aOpt: Array<Context<any>> = []
): FC => ({ children }) => {
  // construct the value using hooks
  const value$ = from(
    aFct(
      aReq.map(dep => resolveRequiredDependency(dep, aCtx)),
      aOpt.map(resolveOptionalDependency)
    )
  );
  // use state to represent the value
  const [value, setValue] = useState<T>();
  // the observer
  const next = (aValue?: T) => setValue(prev => unsubscribe(prev) || aValue);
  const error = () => next();
  // listen for value changes
  useEffect(() => {
    // subscribe
    const sub = value$.subscribe(next, error);
    // done
    return () => unsubscribe(sub) || unsubscribe(value);
  }, []);
  // provide the value
  return value != null
    ? createElement(aCtx.Provider, { value }, children)
    : null;
};

/**
 * Simpler typing for implementation purposes
 */
const internalCreateInjectableReactProvider = <T>(
  fct: (req: any[], opt: any[]) => T,
  ctx: Context<T>,
  req: Array<Context<any>>,
  opt: Array<Context<any>>
): ReactProvider<T> =>
  createReactProvider(createStaticProvider(fct, ctx, req, opt), ctx, req, opt);

/**
 * Simpler typing for implementation purposes
 */
const internalCreateDynamicReactProvider = <T>(
  fct: (req: any[], opt: any[]) => ObservableInput<T>,
  ctx: Context<T>,
  req: Array<Context<any>>,
  opt: Array<Context<any>>
): ReactProvider<T> =>
  createReactProvider(createDynamicProvider(fct, ctx, req, opt), ctx, req, opt);

/**
 * Creates a `ReactProvider` that resolves its mandatory
 * and optional elements and delegates the creation of the provided
 * value to a callback function with these dependencies.
 *
 * @param fct - the generator function for the value
 * @param ctx - the context to provider
 * @param req - array of required dependencies
 * @param opt - array of optional dependencies
 *
 * @returns a module that automatically resolves the dependencies before calling the function
 */
export const createInjectableReactProvider: InjectableReactProviderFactory = internalCreateInjectableReactProvider as any;

/**
 * Creates a `ReactProvider` that resolves its mandatory
 * and optional elements and delegates the creation of the provided
 * value to a callback function with these dependencies. The callback
 * returns an observable and the observable sequence will be provided.
 *
 * @param fct - the generator function for the value
 * @param ctx - the context to provider
 * @param req - array of required dependencies
 * @param opt - array of optional dependencies
 *
 * @returns a module that automatically resolves the dependencies before calling the function
 */
export const createDynamicReactProvider: DynamicReactProviderFactory = internalCreateDynamicReactProvider as any;
