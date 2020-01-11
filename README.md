## Batch Backpressure

Implementation of a [RxJS](https://rxjs-dev.firebaseapp.com/api) backpressure operator that is useful if the consumer can consume batches of data more efficiently than individual item.

### Usage

```typescript
function batch<T, R>(
  delegate: UnaryFunction<T[], Observable<R>>
): OperatorFunction<T, R>;
```

Where `delegate` processes batches of data and the operator buffers incoming events as long as the returned observable produces data.

Refer to [Lossless Back-Pressure for RxJS using Batches of Data](https://medium.com/javascript-in-plain-english/lossless-back-pressure-for-rxjs-using-batches-of-data-534752fda666) for an more detailed discussion of the concept.

## Reactive React Component

Implementation of a [React](https://reactjs.org/docs/react-component.html) component based on the [RxJS](https://rxjs-dev.firebaseapp.com/api) framework.

### Usage

```typescript
export function rxComponent<P, S, DS = any>(
  stateFct: StateFunction<PropsWithChildren<P>, S>,
  viewDelegate: DelegateComponent<S, DS>
): ComponentClass<P, S> {
```

Where `stateFct` represents the business logic component and transforms the input properties into state. This state is then the input to the view layer represented by `viewDelegate`.

Refer to [Make Use of RxJS to Create Efficient React Components With Ease](https://medium.com/better-programming/make-use-of-rxjs-to-create-efficient-react-components-with-ease-def018644e23) for an more detailed discussion of the concept.

## Dependency Injection

Implementation of utility functions to simplify the provision of components for [dependency injection](https://reactjs.org/docs/context.html) in [React](https://reactjs.org/docs/getting-started.html).

### Usage

```typescript
/**
 * Constructs a module component that includes the referenced
 * providers in topological order
 *
 * @param aProviders - the set of providers
 * @returns the component
 */
export const createModuleFromProvider = (
  aProviders: Array<ReactProvider<any>> = []
): ReactModule

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
export const createInjectableReactProvider: InjectableReactProviderFactory

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
export const createDynamicReactProvider: DynamicReactProviderFactory;
```

Refer to [Embrace Dependency Injection With React](https://medium.com/better-programming/embrace-dependency-injection-for-react-e45ea58ca4f2) for an more detailed discussion of the concept.
