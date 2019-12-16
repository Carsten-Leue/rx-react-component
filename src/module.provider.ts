import { Context, createElement, FC } from 'react';
import { identity, ObservableInput, UnaryFunction } from 'rxjs';

import { BaseProvider } from './base.provider';
import { assertProvider } from './context';
import { DynamicProvider } from './dynamic.provider';
import { createReactProvider, ReactProvider } from './provider';
import { DelegateComponent } from './rx.component';

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
 * Reducer that will create a new function with the result of consuming an additional dependency
 *
 * @param aCreator  - creator function of the next resolution level
 * @param aAssert   - function that asserts the existence of a dependency
 * @param aContext  - the context to consume as a dependency
 *
 * @return a component that consumes a dependency
 */
const reduceDependency = (
  aCreator: UnaryFunction<any[], DelegateComponent<any>>,
  aAssert: (aValue: any, aCtx: Context<any>) => any,
  aContext: Context<any>
): UnaryFunction<any[], DelegateComponent<any>> => (aDeps: any[]) => props =>
  createElement(aContext.Consumer, null, (ctx: any) =>
    createElement(aCreator([aAssert(ctx, aContext), ...aDeps]), props)
  );

const reduceRequiredDependency = (
  aCreator: UnaryFunction<any[], DelegateComponent<any>>,
  aContext: Context<any>
): UnaryFunction<any[], DelegateComponent<any>> =>
  reduceDependency(
    aCreator,
    (value, ctx) => assertProvider(value, ctx, aContext),
    aContext
  );

const reduceOptionalDependency = (
  aCreator: UnaryFunction<any[], DelegateComponent<any>>,
  aContext: Context<any>
): UnaryFunction<any[], DelegateComponent<any>> =>
  reduceDependency(aCreator, identity, aContext);

/**
 * Constructs the actual react provider for the value
 *
 * @param ctx - the context to provide
 * @param value - the value to provide
 *
 * @returns the react provider
 */
const createProvider = <T>(ctx: Context<T>, value: T): FC => ({ children }) =>
  createElement(BaseProvider, { ctx, value }, children);

/**
 * Constructs the actual react provider for the value
 *
 * @param ctx - the context to provide
 * @param value - the value to provide
 *
 * @returns the react provider
 */
const createDynamicProvider = <T>(
  ctx: Context<T>,
  value: ObservableInput<T>
): FC => ({ children }) =>
  createElement(DynamicProvider, { ctx, value }, children);

declare type ProviderFactory<T> = (aReq: any[], aOpt: any[]) => FC;

/**
 * Simpler typing for implementation purposes
 */
const genericCreateInjectableReactProvider = <T>(
  fct: ProviderFactory<T>,
  ctx: Context<T>,
  req: Array<Context<any>> = [],
  opt: Array<Context<any>> = []
): ReactProvider<T> => {
  // add optional dependencies
  const optDependencies = (aReq: any[]) =>
    opt.reduce(reduceOptionalDependency, (aOpt: any[]) => fct(aReq, aOpt));

  // add required dependencies
  const reqDependencies = req.reduce(reduceRequiredDependency, (aReq: any[]) =>
    optDependencies(aReq)([])
  );

  // returns the provider
  return createReactProvider(reqDependencies([]), ctx, req, opt);
};

/**
 * Simpler typing for implementation purposes
 */
const internalCreateInjectableReactProvider = <T>(
  fct: (aReq: any[], aOpt: any[]) => T,
  ctx: Context<T>,
  req: Array<Context<any>>,
  opt: Array<Context<any>>
): ReactProvider<T> =>
  genericCreateInjectableReactProvider(
    (aReq, aOpt) => createProvider(ctx, fct(aReq, aOpt)),
    ctx,
    req,
    opt
  );
/**
 * Simpler typing for implementation purposes
 */
const internalCreateDynamicReactProvider = <T>(
  fct: (aReq: any[], aOpt: any[]) => ObservableInput<T>,
  ctx: Context<T>,
  req: Array<Context<any>>,
  opt: Array<Context<any>>
): ReactProvider<T> =>
  genericCreateInjectableReactProvider(
    (aReq, aOpt) => createDynamicProvider(ctx, fct(aReq, aOpt)),
    ctx,
    req,
    opt
  );

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
