In this article we discuss how to efficiently make use of dependency injection in a [React](https://reactjs.org/docs/react-component.html) library.

## Introduction

When designing and implementing libraries the ideas of reusability and composability are among the main design goals. Ideally a shared component should have a well-defined, narrow purpose, so it can be used for several different use-cases (do-one-thing-but-do-it-well).

In practice if often happens that such a modular component is not fully self-contained but requires external `services`. A common example is `logging`. 

There exist serveal ways how a shared component would decide what service to use to implement a certain functionality, e.g. what logging framework to use.

- the easiest approach is tight-coupling. The shared component just takes a decision and explicitly pulls in a particular service or logging framework. This approach on the other hand is also the least desirable for a consumer of the component, since it can lead to pull in a large set of external dependencies. If shared components from different sources are used, dependencies can even become incompatible or pull in different implementations for logically the same functionality.
- with the [service locator pattern](https://en.wikipedia.org/wiki/Service_locator_pattern) we can achieve a form of loose-coupling of our components. Instead of pulling in an explicit implementation the component asks a service locator for an implementation based on an abstraction (interface) of the service. The actual implementation can then be provided at runtime by the application that pulls all components together. While this pattern provides a strong modularization it still leaves the service registry as a central point of access and all components need to use the same service registry.
- the [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) (DI) pattern is a different approach to loose-coupling. Instead of having a component lookup a particular service, we would pass in an implementation of that service into the component. This allows a shared component to be implemented self-contained without any explicit reference to central services, such as a service registry. Staying with the example of a `logger`, a shared component would only define a logger interface and leave it to its callers to provide an implementation.

We will explore how the [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) pattern can be used to implement modular [React](https://reactjs.org/docs/react-component.html) components.

While competing frameworks such as [Angular](https://angular.io/guide/dependency-injection) have dependency injection built in, there is no obvious support for it in [React](https://reactjs.org/docs/react-component.html). The reason is that you can consider the [JSX composition](https://marmelab.com/blog/2019/03/13/react-dependency-injection.html) pattern a suitable DI container. Dependencies can be passed on as properties from one component to another. So there is just no need for an extra implementation.

On larger systems however, passing dependencies via properties easily becomes cumbersome, since the number of dependencies typically grows with the size of the system. And dependencies required by a transitively used component would surface in the properties of components along the parent chain. This is why React has the concept of [Context](https://reactjs.org/docs/context.html). Such contexts allow to provide a services to components in the JSX tree without having to pass them via the components' properties. This is a very convenient way to implement DI and it is supported as part of the React core without the need for additional libraries.

## Challenge to Solve

The challenge with using [Context](https://reactjs.org/docs/context.html) (that we will address in this article) comes in when we consider how a context is provided. Since the system is based on nested JSX components, we need one nesting level per provided context. And this nesting needs to occur in the correct dependency order.

Take as an example a system that provides two services, a logging service and a data service (fetching data via REST). Our components needs both services, since it needs to fetch data and also want to log. The data service however also requires the logging service to do its own logging.

TODO add image of dependencies

This means that we have to provide the logger service before we can provide the data service, since we need the logger in order to instantiate it.

While this is simple with two services it becomes very complex and error prone if more services are involved. We basically have to provide the services in their reverse topological order wrt. their dependencies. There is no built-in way to assist us with this task.

**Summary**: dependency injection is a powerful way to decouple reusable components, e.g. for libraries. With the concept of a [Context](https://reactjs.org/docs/context.html), React offers a convenient way to _consume_ these contexts, but there is no convenient way to _provide_ them in a non trivial system in the correct order.

## Declaration of Dependencies

In order to simplify the provision of [Context](https://reactjs.org/docs/context.html)s we introduce a data structure to declare the dependencies of a context provider with the following fields:

* `provides: Context<T>`: is the context that the structure provides
* `dependencies?: Array<Context<any>>`: is an array of required contexts
* `optionalDependencies?: Array<Context<any>>`: is an array of optional contexts
* `module`: is the [React Component](https://reactjs.org/docs/react-component.html) that actually provides the context.

```typescript
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
```

With this structure we can tell that the required and the optional contexts have to be provided before the `module` component can be used (which provides the context described by the structure).

We differentiate between optional and required dependencies to make it easier to bootstrap the component, since only the required dependencies have to be provided. A good example for an optional dependency is a logger service. In the absence of a logger service a module can always fallback to a noop logger. But if a consumer decides to use logging, it can provide the logger as a dependency, the module would work in either case.

The implementation of the module that provides the context is a simple JSX component that first consumes the required and optional dependencies and then uses them to provide the service, e.g. like this:

```typescript
const ServiceImpl: FC = ({ children }) => {
  // resolve the dependencies
  const logger = useContext(LOGGER_CONTEXT);
  // the service
  const service: Service = () => {
    logger('invoke service');
    return 'somedata';
  };
  // provide the dependency
  return (
    <SERVICE_CONTEXT.Provider value={service}>
      {children}
    </SERVICE_CONTEXT.Provider>
  );
};
```

It is important that the implementation uses the [children](https://reactjs.org/docs/react-component.html#props) property to allow for nesting.

The declaration of the service's dependencies would then look like this:

```typescript
const SERVICE_PROVIDER: ReactProvider<Service> = {
  module: ServiceImpl,
  provides: SERVICE_CONTEXT,
  optionalDependencies: [LOGGER_CONTEXT]
};
```

and the JSX component finally consuming both the logger and the service would be (using [React Hooks](https://reactjs.org/docs/hooks-intro.html)):

```tsx
const MyComponent: FC = ({ children }) => {
  // resolve the dependencies
  const logger = useContext(LOGGER_CONTEXT);
  const service = useContext(SERVICE_CONTEXT);

  logger('rendering ...');

  // produce some markup
  return <div>{service()}</div>;
};
```

## Finding the Correct Order

Given our declarative description of dependencies all we have to do is to sort them in [topological order](https://en.wikipedia.org/wiki/Topological_sorting) and then create a nested hierarchy of providers in that order. 

For our simple example the rendering order would be:

```tsx
const MyApp: FC = () => (
  <LoggerImpl>
    <ServiceImpl>
      <MyComponent></MyComponent>
    </ServiceImpl>
  </LoggerImpl>
);
```

We note that we need one nesting level per provided service and the order of nesting is in topological order. Depending on how many dependencies we use in our application this nesting can get quite deep and we'd like to automate its bootstrap process.

Using our dependency declaration we already have sufficient information to implement the nesting automatically and generically, e.g. by using the reference implementation [createModuleFromProvider](https://www.npmjs.com/package/rx-react-component). This method accepts an unsorted list of `ReactProvider` structures, sorts them in topological order and creates a JSX component that implements the required nesting. As a bonus this implementation would also warn if a required dependencies had not been provided. 

For our example we'd use:

```tsx
const Module = createModuleFromProvider([SERVICE_PROVIDER, LOGGER_PROVIDER]);

const MyApp: FC = () => (
    <Module>
        <MyComponent></MyComponent>
    <Module>
);
```

Note that ordering and nesting is hidden completely within the the implementation of `Module`, a dynamically constructed JSX component.

## Simplify the Creation of Provider Components

The implementation of provider components always follows the identical pattern:

* resolve the dependencies required to implement the provider. Optionally bail out or warn if a required dependency is missing
* instantiate the provided service
* provide the service using a [Context Provider](https://reactjs.org/docs/context.html#contextprovider)

like in our sample service above

```typescript
const ServiceImpl: FC = ({ children }) => {
  // resolve the dependencies
  const logger = useContext(LOGGER_CONTEXT);
  // instantiate the service
  const service: Service = () => {
    logger('invoke service');
    return 'somedata';
  };
  // provide the service
  return (
    <SERVICE_CONTEXT.Provider value={service}>
      {children}
    </SERVICE_CONTEXT.Provider>
  );
};
```

These steps are repetitive and also error prone, since we need to make sure that the contexts used in the implementation are those declared as dependencies in our `ReactProvider` and that the component actually provides the declared context.

So for simplification and safety purposes we introduce the helper function [createInjectableReactProvider](https://www.npmjs.com/package/rx-react-component). This function accepts the following parameters:

* `provides: Context<T>`: the context to provide
* `dependencies?: Array<Context<any>>`: an array of required contexts
* `optionalDependencies?: Array<Context<any>>`: an array of optional contexts
* `fct: Function`: a factory function that accepts the **resolved** dependencies and that returns the provided service. In typescript we can express the signature of the function such that type of the resolved dependencies matches the type of the declared contexts, so the compiler makes sure that declaration and implementation are in sync.

The result of `createInjectableReactProvider` is a `ReactProvider` structure. The `module` field, i.e. the JSX component, is a dynamically generated component that will first collect the dependencies, then call the factory function and then provide the result. 

The example above then simplifies to:

```typescript
const createService = ([]: [], [logger = noop]: [Logger?]): Service => () => {
  logger('invoke service');
  return 'somedata';
};

export const SERVICE_PROVIDER = createInjectableReactProvider(
  createService,
  SERVICE_CONTEXT,
  undefined,
  [LOGGER_CONTEXT]
);

```

Note that the `createService` factory function uses [ES6 Array Destructuring](https://www.typescriptlang.org/docs/handbook/variable-declarations.html#destructuring) as a short and typesafe way to access its dependencies.

## JSX UI Components as Injected Dependencies

So far we have used dependency injection to inject services, e.g. the logger service or the data service in our example. We can however fully embrace the pattern and also consider our UI components services as well. 

**Q:** Why would we want to do that? **A:** Separation of Concern!

So far our UI component that consumes the services looks like this:

```tsx
const MyComponent: FC = ({ children }) => {
  // resolve the dependencies
  const logger = useContext(LOGGER_CONTEXT);
  const service = useContext(SERVICE_CONTEXT);

  logger('rendering ...');

  // produce some markup
  return <div>{service()}</div>;
};
```

This implementation mixes two concerns because it resolves the dependencies as part of the **rendering** process of the component. Conceptually however we do not expect the dependencies to change with every rendering - in contrast to potential [properties](https://reactjs.org/docs/components-and-props.html) of our component, which do have a direct influence on rendering. If we were to represent the component as a class, our dependencies would ideally flow into the constructor, not into the render method.

We can separate these concerns more cleanly - and also introduce a performance optimization - by generating our component class dynamically via `createInjectableReactProvider` and a factory function. The dependencies would then only be resolved when the component class is constructed via the factory, but not at rendering time. This has the performance benefit that we can implement computations that only depend on the dependencies, once at construction time instead of many times are rendering time. Using this pattern our component would be:

```tsx
const createComponent = (
  [service]: [Service],
  [logger = noop]: [Logger?]
): FC => {
  // here we could do some heavy computations
  logger('constructing component ...');

  // this is the component implementation
  return () => {
    logger('rendering ...');

    // produce some markup
    return <div>{service()}</div>;
  };
};

const COMPONENT_PROVIDER = createInjectableReactProvider(
  createComponent,
  COMPONENT_CONTEXT,
  [SERVICE_CONTEXT],
  [LOGGER_CONTEXT]
);
```

This provider can then be used with `createModuleFromProvider` to provide not only  services but also UI components in their correct topological order. And of course if a UI component would make use of another UI component it would let the system inject that component, thus achieving complete decoupling between UI components.

The later is not always required though, in particular if we know that a UI component does not have dependencies and that it is not dynamic, there is no need to represent it as a dynamic, injectable component. But it would also not hurt.

## Summary

In this article we hold the view that [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) is a valuable pattern to create modular UI components, in particular for the use in libraries. [React](https://reactjs.org/docs/context.html) offers a suitable way to consume dependencies but lacks an easy way to provide them for non trivial scenarios.

We introduce a concept and a [reference implementation](https://www.npmjs.com/package/rx-react-component) to declare relationships between injectable dependencies and show how to use them to create modular components and services with just a few lines of code.