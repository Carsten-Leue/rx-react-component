## Batch Backpressure

Implementation of a [RxJS](https://rxjs-dev.firebaseapp.com/api) backpressure operator that is useful if the consumer can consume batches of data more efficiently than individual item.

### Usage

```typescript
function batch<T, R>(
  delegate: UnaryFunction<T[], Observable<R>>
): OperatorFunction<T, R>;
```

Where `delegate` processes batches of data and the operator buffers incoming events as long as the returned observable produces data.

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
