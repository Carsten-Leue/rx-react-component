In this article we discuss a pattern to implement efficient [React](https://reactjs.org/docs/react-component.html) components using the [RxJS](https://rxjs-dev.firebaseapp.com/api) framework.

## Introduction

React components are based on the concept of [properties](https://reactjs.org/docs/components-and-props.html) and [state](https://reactjs.org/docs/state-and-lifecycle.html). While properties represent the input values from other (host) components, state represents the internal condition of a component. State can be derived from properties or even be computed asynchronously, e.g. as a result of making HTTP calls. 

The react library makes sure to re-render a component when updates to properties or state will have a visual effect.

From a performance perspective we want make sure:

- the execution of the `render` method of a component should be as fast as possible, i.e. we want to avoid doing expensive computations or object allocations 
- the number of times the `render` method is invoked should be as [small as possible](https://reactjs.org/docs/optimizing-performance.html#avoid-reconciliation). Each time `render` is called, React has to run its [reconciliation](https://reactjs.org/docs/reconciliation.html) algorithm to compare the virtual DOMs of the update vs the existing state. Although this is implemented very efficiently, it is even more efficient to avoid [reconciliation](https://reactjs.org/docs/reconciliation.html) altogether.

### Minimizing Render Time

We minimize the time spent in the `render` method by pre-computing all required data structures beforehand. This includes potentially expensive computations as well as object allocations. We use RxJS operators to react to changes of the input and use the `state` concept to carry the result of our computations and object creations over to the `render` method.

### Avoiding Reconciliation

It is in the responsibility of the component developer to tell if a modification of a property or state results in a re-rendering of the application. This is typically done by overriding the `shouldComponentUpdate` method or by deriving from `PureComponent` for simple use-cases.

Per default, React will re-render a component if a property or the state changes. Deriving from [PureComponent](https://reactjs.org/docs/react-api.html#reactpurecomponent) improves this a bit by doing a shallow comparison of the properties assuming immutability of the objects themselves. Still this approach can lead to undesired re-render operations, because:

- the rendering of the component might not depend directly on a property but rather on derived information of that property. And that might stay stable despite the property changing.
- for controlled components we often pass in callback functions via properties. We can sometimes observe the (anti)pattern that host components bind member functions to callbacks inside their `render` calls or that they use lambda functions generated during render. This will create new function objects each time the host renders, causing an uneccessary re-render of the child component.

So in order to avoid these issues our strategy is to make sure that the rendering of the component does NOT use properties directly, but only information from the `state`. This is information the component developer has full control of. 
We also mandate that objects carried in the component `state` are [immutable](https://reactjs.org/docs/optimizing-performance.html#the-power-of-not-mutating-data), so we can tell by a simple equals check if the state changed or not. 

### Separation of Concerns

The discussed optimization patterns pivot around the idea to compute the ideal `state` for the rendering of a component. This gives us the opportunity to separate the task for computing this state into a [business logic only component (BLoC)](https://www.raywenderlich.com/4074597-getting-started-with-the-bloc-pattern) and the actual rendering into a view only component.

## Example

Before we start to explain the approach let's add a very simply hello world example:

```tsx
import * as React from 'react';
import { pipe } from 'rxjs';
import { map, pluck, distinctUntilChanged } from 'rxjs/operators';

import { rxComponent } from 'rx-react-component';

export interface HelloWorldProps {
  name: string;
}

export interface HelloWorldState {
  text: string;
}

// 1
export const HelloWorld = rxComponent<HelloWorldProps, HelloWorldState>(
  // 2
  pipe(
    pluck('name'),
    distinctUntilChanged(),
    map(name => ({ text: `Hello ${name}` }))
  ),
  // 3
  ({ text }) => <div>{text}</div>
);

```

Explanation: 

1. Constructing a component with `HelloWorldProps` as input. The component will implement some simple business logic (prefix the input with `'Hello'`) and then pass the result to a view-only component.
2. The business logic layer that transforms the input properties to state. Note how the [distinctUntilChanged](https://rxjs-dev.firebaseapp.com/api/operators/distinctUntilChanged) operator makes sure to update the state only if the input has really changed.
3. The view-only component realized as a function component. 

## Approach

We implement an anonymous class for our performance optimized reactive component. The purpose of this class is to:

- expose a reactive RxJS way to compute the `state` from properties, including reactive access to life cycle methods
- minimize [reconciliation](https://reactjs.org/docs/reconciliation.html) by implementing the `shouldComponentUpdate` method

### Minimizing Render Time

We represent the [React lifecycle methods](https://reactjs.org/docs/react-component.html) as [Observables](https://rxjs-dev.firebaseapp.com/guide/observable) and derive the component state using [reactive operators](https://rxjs-dev.firebaseapp.com/guide/operators).

The abstract class takes a function to convert the properties into a state observable.  It will then make sure to correctly hook into the life cycle methods to subscribe and unsubscribe.

The caller the `state$` observable based on input properties (via the `props$` observable) or by using RxJS mechanisms to compute state asynchronously.

#### Initial state

All state that is emitted by the `state$` observable before the `componentDidMount` method is invoked is considered initialization state automatically. You might e.g. use the [startWith](https://rxjs-dev.firebaseapp.com/api/operators/startWith) operator to make sure such state exist. There is no need (and no way) to set `this.state` explicitly.

#### Input from the host component

Our React component will receive its input via [properties](https://reactjs.org/docs/components-and-props.html) from its host. These properties are made available via the `props$` observable.

Use operators such as [pluck](https://rxjs-dev.firebaseapp.com/api/operators/pluck) and [distinctUntilChanged](https://rxjs-dev.firebaseapp.com/api/operators/distinctUntilChanged) to access individual properties and to change the state only if these properties change.

#### Input from child components

Communication between from a child component into the parent component typically works by passing a callback function as an event handler via a property into the child. 

We distinguish between [controlled](https://reactjs.org/docs/forms.html#controlled-components) or uncontrolled components. A controlled component delegates its state to its host component and expects state changes to be mirrored back via its properties. An uncontrolled component maintains its on state.

Since we split our component into a BLoC and a view-only component, the view-only component should always be controlled by the BLoC, whereas the BLoC can be controlled or uncontrolled.

**Controlling the view-only component**: we define callback functions for the view-component's state changes and manage them in the state of the BLoC. These functions are bound `next` calls on a [Subject](https://rxjs-dev.firebaseapp.com/api/index/class/Subject) which allows the BLoC to integrate these callbacks into the observable pipe.

**Uncontrolled BLoC**: The uncontrolled BLoC typically maintains its state via a [scan](https://rxjs-dev.firebaseapp.com/api/operators/scan) operator. 

*Example*:  Imagine a component that maintains a counter value. The view component displays the value and renders a button to increment it.

```tsx
/**
 * Properties of the final component
 */
export interface CounterProps {
  // some initial counter value
  initial: number;
}

/**
 * Properties of the view-only component
 */
export interface CounterViewProps {
  // the current counter value
  counter: number;
  // callback that allows to increment the counter
  onClick: UnaryFunction<MouseEvent, void>;
}

/**
 * The view only component
 */
const viewOnly = ({ counter, onClick }: CounterViewProps) => (
  <div>
    <div>Counter {counter}</div>
    <button onClick={onClick}>Increment</button>
  </div>
);

/**
 * The business logic component
 */
function bloc(props$: Observable<CounterProps>): Observable<CounterViewProps> {
  // extract the initial value from the props
  const initial$ = props$.pipe(prop('initial'));

  // subject to react to button clicks
  const clickSubject = new Subject<any>();
  const click$ = initial$.pipe(
    /* here we maintain the component state, each time the 
     * button is clicked, the subject fires and the counter
     * is incremented */
    switchMap(initial => clickSubject.pipe(scan(value => value + 1, initial)))
  );
  // for convenience we bind the next function
  const onClick = bindNext(clickSubject);

  const value$ = merge(initial$, click$);

  // map the counter value to the input props of the view component
  return value$.pipe(map(counter => ({ counter, onClick })));
}

export const Counter = rxComponent<CounterProps, CounterViewProps>(
  bloc,
  viewOnly
);
```

**Controlled BLoC**: The uncontrolled BLoC delegates state management to its host via a callback function in its properties. 

Example: Again we have a counter with a button to increment it. This example uses the identical view implementation compared to the previous sample.

```tsx
/**
 * Properties of the final component
 */
export interface ControlledCounterProps {
  // counter, maintained by the host component
  value: number;
  // callback to send a new value
  onValue: UnaryFunction<number, void>;
}

/**
 * The business logic component
 */
function bloc(
  props$: Observable<ControlledCounterProps>
): Observable<CounterViewProps> {
  // the controlled input
  const value$ = props$.pipe(prop('value'));

  // subject to react to button clicks
  const clickSubject = new Subject<any>();
  const onClick = bindNext(clickSubject);

  const click$ = clickSubject.pipe(
    /* A click will update the current value
     * and will use the current callback function */
    withLatestFrom(value$, props$),    
    map(([, value, { onValue }]) => onValue(value + 1)),
    // this keeps the sequence live but does not emit anything
    switchMapTo(EMPTY)
  );

  /**
   * We merge the clicks with the values to keep the pipe
   * alive. Since click$ will never emit anything, this
   * does not mess up our state.
   */
  return merge(value$, click$).pipe(map(counter => ({ counter, onClick })));
}

export const ControlledCounter = rxComponent<
  ControlledCounterProps,
  CounterViewProps
>(bloc, viewOnly);
```

### Avoiding Reconciliation

The abstract class implements `shouldComponentUpdate` and compares the new state against the current state using a simple `equals` check. Properties are ignored completely. This works, because

- objects are immutable
- all information derived from properties should be converted to `state` via the `state$` observable.

### Separation of Concerns

We use the `rxComponent` function to create our component. This function accepts a function to compute the `state$` observable from the properties and lifecylce observable and a reference to a view-only component that accepts the state as its input properties.

This approach has the following advantages:

- clearly separates business logic from rendering logic
- no need to create a custom class per component, thus reducing the overall application size

## API

Invoke the method `rxComponent<P, S>(stateFct, delegate)` to create a reactive React component, where:

- `stateFct`: a function that gets `props$`, `init$`, `done$` as an input and that returns a state observable as a result. In case your transform only depends on the `props$` stream, you can simply use the [pipe](https://rxjs-dev.firebaseapp.com/api/index/function/pipe) function.
- `delegate`: a react component that receives the state as input properties. Often this would be a [function component](https://reactjs.org/docs/components-and-props.html).

### Utility Functions

- `bindNext`: this helper takes an [Observer](https://rxjs-dev.firebaseapp.com/api/index/interface/Observer) and converts it into a simple function callback that invokes the `next` method. This is ideal for passing the result as a callback from the `BLoC` component to the `view-only` component.
- `prop`: helper that takes the name of a property and returns an [OperatorFunction](https://rxjs-dev.firebaseapp.com/api/index/interface/OperatorFunction) that picks the property and returns a distinct stream of the result.


## Comparison of Concepts

The following table presents a quick comparison of concepts.

| React | Reactive Component | Purpose |
|---	|---	|---	|
| `this.state = {...}`	| `startWith`	| Initialize the state before the component is mounted	|
| `this.setState(...)`	| `pipe`	| Update the state based on properties or context	|
| `<Child onClick='clickHandler'>`	| `<Child onClick='clickSubject'>`	| Pass a callback into a child component	|
| `componentDidMount`	| `init$` | Perform initialization after the component has been mounted |
| `componentWillUnmount`	| `done$` | Peform cleanup |
| `shouldComponentUpdate`	| `distinctUntilChanged()` | Check if changes to the properties or state should lead to a re-rendering. |
| `componentDidUpdate`	| n/a | Recompute state when properties have changed |