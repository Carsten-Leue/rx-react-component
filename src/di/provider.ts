import { Context, createElement, FC, ReactNode } from 'react';
import { UnaryFunction } from 'rxjs';

import { ReactModule, ReactModuleProps } from './module';

/**
 * Declares a react provider. The provider declares the provided
 * context and its dependencies.
 *
 * Refer to https://reactjs.org/docs/context.html
 */
export interface ReactProvider<T> {
  /**
   * React component that implements the provider. The component
   * consumes the dependencies and the optional dependencies
   * and provides the specified context.
   */
  module: ReactModule;
  /**
   * Provided context
   */
  provides: Context<T>;
  /**
   * Required contexts, will be consumed when the module gets instantiated
   */
  dependencies?: Array<Context<any>>;
  /**
   * optional contexts
   */
  optionalDependencies?: Array<Context<any>>;
}

/**
 * Constructs an instance of a provider
 *
 * @param module - the module
 * @param provides - the context the module provides
 * @param dependencies - dependencies
 * @param optionalDependencies - optional dependencies
 *
 * @returns the provider instance
 */
export const createReactProvider = <T>(
  module: ReactModule,
  provides: Context<T>,
  dependencies?: Array<Context<any>>,
  optionalDependencies?: Array<Context<any>>
): ReactProvider<T> => ({
  module,
  provides,
  dependencies,
  optionalDependencies
});

declare type Edges<K, V> = UnaryFunction<V, K[]>;
declare type Value<K, V> = UnaryFunction<K, V[]>;

function internalTopoSort<K, V>(
  aKey: K,
  aNodes: Value<K, V>,
  aEdges: Edges<K, V>,
  aCycle: Set<K>
): V[] {
  // tests for cycles
  if (!aCycle.has(aKey)) {
    // register
    aCycle.add(aKey);
    // locate the nodes
    const nodes = aNodes(aKey);
    return nodes.reduce(
      (dst, node) => topoSort(dst, aEdges(node), aNodes, aEdges, aCycle),
      nodes
    );
  }
  // nothing to return
  return [];
}

const topoSort = <K, V>(
  aDst: V[],
  aKeys: K[],
  aNodes: Value<K, V>,
  aEdges: Edges<K, V>,
  aCycle: Set<K>
): V[] =>
  aKeys.reduce(
    (dst, key) => internalTopoSort(key, aNodes, aEdges, aCycle).concat(dst),
    aDst
  );

/**
 * Creates a new module from a provider
 *
 * @param aChildren - the children
 * @param aProvider - the  provider
 *
 * @returns the new element
 */
const reduceModule = (aChildren: ReactNode, { module }: ReactProvider<any>) =>
  createElement(module, null, aChildren);

/**
 * Constructs a module from a topological list of providers
 *
 * @param aProviders - the topological list
 * @returns the component
 */
function createProviderModule(
  aProviders: Array<ReactProvider<any>>
): FC<ReactModuleProps> {
  // extract the start module and the providers
  const [root, ...providers] = aProviders;
  // construct the component tree
  return ({ children }) =>
    providers.reduce(reduceModule, reduceModule(children, root));
}

/**
 * Returns the outbound dependencies of a provider. The result
 * is sorted, so we have a reproducible graph
 *
 * @param aProvider - the provider
 * @returns the dependencies
 */
const getEdges = ({
  dependencies = [],
  optionalDependencies = []
}: ReactProvider<any>): Array<Context<any>> => [
  ...dependencies,
  ...optionalDependencies
];

declare type ProviderMap = Map<Context<any>, Array<ReactProvider<any>>>;

/**
 * Registers a provider with the provider map
 *
 * @param aDst - target map
 * @param aProvider - the provider to register
 *
 * @returns the map
 */
const addProvider = (
  aDst: ProviderMap,
  aProvider: ReactProvider<any>
): ProviderMap => {
  // the provider key
  const { provides } = aProvider;
  return aDst.set(provides, [...(aDst.get(provides) || []), aProvider]);
};

/**
 * Creates a topological sort of the providers
 *
 * @param aProviders - the providers
 * @returns the sorted list
 */
function createTopologicalOrder(
  aProviders: Array<ReactProvider<any>>
): Array<ReactProvider<any>> {
  // organize the providers as a map
  const registry = aProviders.reduce(addProvider, new Map());
  // callback to get the provider from a key
  const getProvider = (aCtx: Context<any>) => registry.get(aCtx)!;
  // result
  return topoSort(
    [],
    Array.from(registry.keys()),
    getProvider,
    getEdges,
    new Set()
  );
}

/**
 * Constructs a module component that includes the referenced
 * providers in topological order
 *
 * @param aProviders - the set of providers
 * @returns the component
 */
export const createModuleFromProvider = (
  aProviders: Array<ReactProvider<any>> = []
): ReactModule => createProviderModule(createTopologicalOrder(aProviders));
