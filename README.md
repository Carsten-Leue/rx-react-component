In this article we discuss a pattern to implement efficient [React](https://reactjs.org/docs/react-component.html) components using the [RxJS](https://rxjs-dev.firebaseapp.com/api) framework.

## Introduction

React components are based on the concept of properties and state. While properties represent the input values from other (host) components, state represents the internal condition of a component. State can be derived from properties or even be computed asynchronously, e.g. as a result of making HTTP calls. 

The react library makes sure to re-render a component when updates to properties or state will have a visual effect.

From a performance perspective we want make sure:

- the execution of the `render` method of a component should be as fast as possible, i.e. we want to avoid doing expensive computations or object allocations 
- the number of times the `render` method is invoked should be as [small as possible](https://reactjs.org/docs/optimizing-performance.html#avoid-reconciliation). Each time `render` is called, react has to run its `reconciliation` algorithm to compare the virtual DOMs of the update vs the existing state. Although this is implemented very efficiently, it is even more efficient to avoid `reconciliation` altogether.

### Minimizing Render Time

We minimize the time spent in the `render` method by pre-computing all required data structures beforehand. This includes potentially expensive computations as well as object allocations. We use RxJS operators to react to changes of the input and use the `state` concept to carry the result of our computations and object creations.

### Avoiding Reconciliation

It is in the responsibility of the component developer to tell if a modification of a property or state results in a re-rendering of the application. This is typically done by overriding the `shouldComponentUpdate` method or by deriving from `PureComponent` for simple use-cases.

Per default, react will re-render a component if a property or the state changes. Deriving from [PureComponent](https://reactjs.org/docs/react-api.html#reactpurecomponent) improves this a bit by doing a shallow comparison of the properties assuming immutability of the objects themselves. Still this approach can lead to undesired re-render operations, because:

- the rendering of the component might not depend directly on a property but rather on derived information of that property. And that might stay stable despite the property changing.
- for controlled components we often pass in callback functions via properties. We often see the (anti)pattern that host components bind member functions to callbacks inside their `render` calls or that they use lambda functions generated during render. This will create new function objects each time the host renders, causing an uneccessary re-render of the child component.

So in order to avoid these issues our strategy is to make sure that the rendering of the component does NOT use properties directly, but only information from the `state`. This is information the component developer has full control of. 
We also mandate that objects carried in the component `state` are immutable, so we can tell by a simple equals check if the state changed or not. 

### Separation of Concerns

The discussed optimization patterns pivot around the idea to compute the ideal `state` for the rendering of a component. This gives us the opportunity to separate the task for computing this state into a [business logic only component (BLoC)](https://www.raywenderlich.com/4074597-getting-started-with-the-bloc-pattern) and the actual rendering into a view only component.

## Approach

We implement a base class for our performance optimized reactive component. The purpose of this class is to:

- expose a reactive RxJS way to compute the `state` from properties, including reactive access to life cycle methods
- minimize reconciliation by implementing the `shouldComponentUpdate` method

### Minimizing Render Time

We represent the [React lifecycle methods](https://reactjs.org/docs/react-component.html) as [Observables](https://rxjs-dev.firebaseapp.com/guide/observable) and derive the component state using [reactive operators](https://rxjs-dev.firebaseapp.com/guide/operators).

The base class exposes a `connectState` state method that accepts a `state$` observable. It will then make sure to correctly hook into the life cycle methods to subscribe and unsubscribe.

The subsclass creates the `state$` observable based on input properties (via the `props$` observable) or by using RxJS mechanisms to compute state asynchronously.

#### Initial state

All state that is emitted by the `state$` observable before the `componentDidMount` method is invoked is considered initialization state automatically. You might e.g. use the [startWith](https://rxjs-dev.firebaseapp.com/api/operators/startWith) operator to make sure such state exist. There is no need to set `this.state` explicitly.

#### Input from the host component

Our React component will receive its input via [properties](https://reactjs.org/docs/components-and-props.html) from its host. These properties are made available via the `props$` member observable.

Use operators such as [pluck](https://rxjs-dev.firebaseapp.com/api/operators/pluck) and [distinctUntilChanged](https://rxjs-dev.firebaseapp.com/api/operators/distinctUntilChanged) to access individual properties and to change the state only if these properties change.

#### Input from child components

Communication between from a child component into the parent component typically works by passing a callback function as an event handler via a property into the child. In the reactive pattern we pass an [Observer](https://rxjs-dev.firebaseapp.com/api/index/interface/Observer) as the callback. This has the following advantages:

- the component can use a [Subject](https://rxjs-dev.firebaseapp.com/api/index/class/Subject) to implement the callback handler and directly use that subject in its own state stream.
- the child component can use the [Observer](https://rxjs-dev.firebaseapp.com/api/index/interface/Observer) directly in its own reactive implementation to trigger the events.

### Avoiding Reconciliation

The baseclass implements `shouldComponentUpdate` and compares the new state against the current state using a simple `equals` check. Properties are ignored completely. This works, because

- objects are immutable
- all information derived from properties should be converted to `state` via the `state$` observable.

### Separation of Concerns

Instead of deriving from our reactive base component, use the `rxComponent` function. This function accepts a function to compute the `state$` observable from the properties and lifecylce observable and a reference to a view-only component that accepts the state as its input properties.

This approach has the following advantages:

- clearly separates business logic from rendering logic
- no need to create a custom class per component, thus reducing the overall application size

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