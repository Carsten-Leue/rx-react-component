Utility functions to express a [React](https://reactjs.org/) component using [RXJS](https://rxjs-dev.firebaseapp.com/) principles.

## Introduction

React components are based on the concept of properties and state. It is in the responsibility of the developer to tell if a modification of a property or state results in a re-rendering of the application. This is typically done by overriding the `shouldComponentUpdate` method or by deriving from `PureComponent` for simple use-cases.

Using reactive streams instead of implementing the `shouldComponentUpdate` using a sequence of conditional statements is clean and effective way to implement a change detection strategy. It also works well for asynchronous use-cases.

## Approach

We represent the [React lifecycle methods](https://reactjs.org/docs/react-component.html) as [Observables](https://rxjs-dev.firebaseapp.com/guide/observable) and derive the component state using [reactive operators](https://rxjs-dev.firebaseapp.com/guide/operators).

### Input from the host component

Our React component will receive its input via [properties](https://reactjs.org/docs/components-and-props.html) from its host. These properties are made available via the `props$` member observable.

### Input from child components

Communication between from a child component into the parent component typically works by passing a callback function as an event handler via a property into the child. In the reactive pattern we pass an [Observer](https://rxjs-dev.firebaseapp.com/api/index/interface/Observer) as the callback. This has the following advantages:

- the component can use a [Subject](https://rxjs-dev.firebaseapp.com/api/index/class/Subject) to implement the callback handler and directly use that subject in its own state stream.
- the child component can use the [Observer](https://rxjs-dev.firebaseapp.com/api/index/interface/Observer) directly in its own reactive implementation to trigger the events.


## API

The library exposes two equivalent ways to implements a reactive React component, via subclassing and as a higher order component.

### Baseclass `RxComponent`

Derive your component from `RxComponent<P, S>` and implement a custom constructor and the `render` method. The baseclass will expose the following member properties:

- `props$`: the property stream. Will start with the initial set of properties and then get an update for every property modification.
- `init$`: the initialization event corresponding to `componentDidMount`. Behaves like `ReplaySubject(1)`.
- `done$`: the destruction event corresponding to `componentWillUnmount`. Behaves like `ReplaySubject(1)`.

Subclassed setup the state stream in the `constructor` and then call `this.connectState(state$)` to attach that stream to the baseclass. The baseclass will make sure to subscribe and unsubscribe to the state stream.

### Higher-order Component

You would use a higher-order component to cleanly separate between the active component that deals with computing the state and a *dumb* component that only visualizes the result.


Invoke the method `rxComponent<P, S>(stateFct, delegate)` to create a reactive React component, where:

- `stateFct`: a function that gets `props$`, `init$`, `done$` as an input and that returns a state observable as a result.
- `delegate`: a react component that receives the state as input properties.

### Utility Functions

- `observerAsConsumer`: this helper takes an [Observer](https://rxjs-dev.firebaseapp.com/api/index/interface/Observer) and converts into an [Observer](https://rxjs-dev.firebaseapp.com/api/index/interface/Observer) with an additional call signature. This allows the user of the consumer to either trigger a callback via the [Observer](https://rxjs-dev.firebaseapp.com/api/index/interface/Observer) methods (e.g. inside a `subscribe` call) or to directly invoke the object as a function, which is equivalent to invoke the `next` method on the observer.


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