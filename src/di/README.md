In this article we discuss how to efficiently make use of dependency injection in a [React](https://reactjs.org/docs/react-component.html) library.

## Introduction

When designing and implementing libraries the ideas of reusability and composability are among the main design goals. Ideally a shared component should have a well-defined, narrow purpose, so it can be used for several different use-cases (do-one-thing-but-do-it-well).

In practice if often happens that such a modular component is not fully self-contained but requires external `services`. A common example is `logging`. How should a shared component decide what service to use to implement a certain functionality, e.g. what logging framework to use.

- the easiest approach is tight-coupling. The shared component just takes a decision and explicitly pulls in a particular service or logging framework. This approach on the other hand is also the least desirable for a consumer of the component, since it can lead to pull in a large set of external dependencies. If shared components from different sources are used, dependencies can even become incompatible or pull in different implementations for logically the same functionality.
- with the [service locator pattern](https://en.wikipedia.org/wiki/Service_locator_pattern) we can achieve a form of loose-coupling of our components. Instead of pulling in an explicit implementation the component asks service locator for an implementation based on an abstraction (interface) of the service. The actual implementation can then be provided at runtime by the application that pulls all components together. While this pattern provides a strong modularization it still leaves the service registry as a central service and all components need to use the same service registry.
- the [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) (DI) pattern is a different approach to loose-coupling. Instead of having a component lookup a particular service, we would pass in an implementation of that service into the component. This allows a shared component to be implemented self-contained without any explicit reference to central services, such as a service registry. Staying with the example of a `logger`, a shared component would only define a logger interface and leave it to its callers to provide an implementation.

We will explore how the [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) pattern can be used to implement modular [React](https://reactjs.org/docs/react-component.html) components.

While competing frameworks such as [Angular](https://angular.io/guide/dependency-injection) have DI built in, there is no obvious support for DI in [React](https://reactjs.org/docs/react-component.html). The reason is that you can consider the [JSX composition](https://marmelab.com/blog/2019/03/13/react-dependency-injection.html) pattern a suitable DI container. Dependencies can be passed on as properties from one component to another. So there is just no need for an extra implementation.

On larger systems however, passing dependencies via properties easily becomes cumbersome, since the number of dependencies typically grows with the size of the system. And dependencies required by a transitively used component would surface in the properties of components along the parent chain. This is why React has the concept of [Context](https://reactjs.org/docs/context.html). Such contexts allow to provide a services to components in the JSX tree without having to pass them via the components' properties. This is a very convenient way to implement DI and it is supported as part of the React core without the need for additional libraries.

## Challenge to Solve

The challenge with using [Context](https://reactjs.org/docs/context.html) (that we will address in this article) comes in when we consider how a context is provided. Since the system is based on nested JSX components, we need one nesting level per provided context. And this nesting needs to occur in the correct dependency order.

Take as an example a system that provides two services, a logging service and a data service (fetching data via REST). Our components needs both services, since it needs to fetch data and also want to log. The data service however also requires the logging service to do its own logging.

This means that we have to provide the logger service before we can provide the data service, since we need the logger in order to instantiate it.

While this is simple with two services it becomes very complex and error prone if more services are involved. We basically have to provide the services in their reverse topological order wrt. their dependencies. There is no built-in way to assist us with this task.

**Summary**: dependency injection is a powerful way to decouple reusable components, e.g. for libraries. With the concept of a [Context](https://reactjs.org/docs/context.html), React offers a convenient way to _consume_ these contexts, but there is no convenient way to _provide_ them in a non trivial system in the correct order.
