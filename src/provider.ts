import { Context, createElement, FC, ReactElement } from 'react';
import { selectDisplayName } from './context';
import { ReactModule, ReactModuleProps } from './module';
import { DelegateComponent } from './rx.component';

export type ReactModuleType = DelegateComponent<ReactModuleProps>;

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
  module: ReactModuleType;
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
export function createReactProvider<T>(
  module: ReactModuleType,
  provides: Context<T>,
  dependencies?: Array<Context<any>>,
  optionalDependencies?: Array<Context<any>>
): ReactProvider<T> {
  return { module, provides, dependencies, optionalDependencies };
}

declare type Edges<K, V> = (aValue: V) => K[];
declare type Value<K, V> = (aKey: K) => V;

function internalTopoSort<K, V>(
  aDst: V[],
  aKey: K,
  aNodes: Value<K, V>,
  aEdges: Edges<K, V>,
  aCycle: Set<K>
) {
  // tests for cycles
  if (!aCycle.has(aKey)) {
    // register
    aCycle.add(aKey);
    // get the outbound edges
    const value = aNodes(aKey);
    if (value != null) {
      // get the edges
      const edges = aEdges(value);
      if (edges) {
        // iterate
        topoSort(aDst, edges, aNodes, aEdges, aCycle);
      }
      // register this node
      aDst.push(value);
    }
  }
}

function topoSort<K, V>(
  aDst: V[],
  aKeys: K[],
  aNodes: Value<K, V>,
  aEdges: Edges<K, V>,
  aCycle: Set<K>
) {
  // iterate over the keys
  aKeys.forEach(aKey => internalTopoSort(aDst, aKey, aNodes, aEdges, aCycle));
}

const createModule = (
  aChildren: ReactElement,
  aProvider: ReactProvider<any>
): ReactElement => createElement(aProvider.module, null, aChildren);

/**
 * Constructs a module from a topological list of providers
 *
 * @param aProviders - the topological list
 * @returns the component
 */
function createProviderModule(
  aProviders: Array<ReactProvider<any>>
): FC<ReactModuleProps> {
  // do not mutate
  const providers = [...aProviders];
  const top = providers.shift()!;
  // construct the component tree
  return ({ children }) =>
    providers.reduce(createModule, createElement(top.module, null, children));
}

/**
 * Compares two strings
 *
 * @param aLeft  - left string
 * @param aRight - right string
 *
 * @returns result of the comparison
 */
const cmpStrings = (aLeft?: string, aRight?: string) =>
  aLeft === aRight
    ? 0
    : aLeft == null
    ? -1
    : aRight == null
    ? +1
    : aLeft.localeCompare(aRight);

/**
 * Compare the contexts by display name
 *
 * @param aLeft  - left context
 * @param aRight - right context
 * @returns the comparison result
 */
const compareByContext = (aLeft: Context<any>, aRight: Context<any>): number =>
  cmpStrings(selectDisplayName(aLeft), selectDisplayName(aRight));

/**
 * Compare the providers by display name
 *
 * @param aLeft  - left provider
 * @param aRight - right provider
 * @returns the comparison result
 */
const compareByProvider = (
  aLeft: ReactProvider<any>,
  aRight: ReactProvider<any>
): number => compareByContext(aLeft.provides, aRight.provides);

/**
 * Sort the providers by display name of the contexts they provide, so we
 * produce a reproducible topological sort
 *
 * @param aProviders - the providers
 * @returns the sorted list
 */
const createLexicalSort = (
  aProviders: Set<ReactProvider<any>>
): Array<ReactProvider<any>> => Array.from(aProviders).sort(compareByProvider);

/**
 * Returns the outbound dependencies of a provider. The result
 * is sorted, so we have a reproducible graph
 *
 * @param aProvider - the provider
 * @returns the dependencies
 */
function getEdges({
  dependencies = [],
  optionalDependencies = []
}: ReactProvider<any>): Array<Context<any>> {
  // merge
  return [...dependencies, ...optionalDependencies].sort(compareByContext);
}

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
  const registry = aProviders.reduce<Map<Context<any>, ReactProvider<any>>>(
    (aDst, aProvider) => aDst.set(aProvider.provides, aProvider),
    new Map()
  );
  // get all entry nodes
  const nodes = aProviders.map(aProvider => aProvider.provides);
  // callback to get the provider from a key
  const getProvider = (aCtx: Context<any>) => registry.get(aCtx)!;
  // result
  const result: Array<ReactProvider<any>> = [];
  topoSort(result, nodes, getProvider, getEdges, new Set());
  // ok
  return result.reverse();
}

/**
 * Constructs a module component that includes the referenced
 * providers in topological order
 *
 * @param aProviders - the set of providers
 * @returns the component
 */
export const createModuleFromProvider = (
  aProviders: Array<ReactProvider<any>>
): ReactModule =>
  createProviderModule(
    createTopologicalOrder(createLexicalSort(new Set(aProviders)))
  );
