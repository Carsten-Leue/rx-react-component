In this article we discuss a lossless backpressure approach using the [RxJS](https://rxjs-dev.firebaseapp.com/api) framework.

## Introduction

[Reactive programming](http://reactivex.io/) is a powerful way to implement event driven algorithms. This is in particular true for event driven user interfaces in the browser, where [RxJS](https://rxjs-dev.firebaseapp.com/api) is a commonly used implementation.

One common challenge in event driven programming is to deal with situations in which the event source produces events faster than the event consumer can consume them. Solutions for this scenario are called [backpressure](http://reactivex.io/documentation/operators/backpressure.html). We distinguish between lossy backpressure and lossless backpressure. In the lossy case the strategy is to dismiss certain source events, so the resulting event rate matches the rate the consumer can cope with. Examples including [sampling](https://rxjs-dev.firebaseapp.com/api/operators/sample), or [throttling](https://rxjs-dev.firebaseapp.com/api/operators/throttle)/[debouncing](https://rxjs-dev.firebaseapp.com/api/operators/debounce). For the lossless case we have [buffering](https://rxjs-dev.firebaseapp.com/api/operators/buffer) or [windowing](https://rxjs-dev.firebaseapp.com/api/operators/window), which group source events together into a buffer and pass that buffer downstream (e.g. every `n` seconds).

Both approaches have in common that they assume that the rate of the source events cannot be controlled. This is typically true for UI driven events such as the rate a user interacts with an application but might not be true for system driven events such as the read-rate of a file. If we can control the source rate, then lossless backpressure can be implemented by pausing the event source until the consumer is able to consume events, again. [Kevin Ghadyani](https://itnext.io/lossless-backpressure-in-rxjs-b6de30a1b6d4) describes an interesting approach to implement this in [RxJS](https://rxjs-dev.firebaseapp.com/api).

In this article we will discuss a variation of the [buffering](https://rxjs-dev.firebaseapp.com/api/operators/buffer) strategy assuming that for our usecase we cannot control the rate of events.

## Example Usecase

In our usecase we show a web application that display a form, e.g. including text input boxes, dropdowns or spinners. The form is backed by a database accessible via REST.

Whenever the user makes a change to one of the fields we would like to persist that change immediately, i.e. we do NOT want to have the user hit a `save` button to persist the changes.

In this scenario it can easily happen that change occure more quickly than our REST service can handle them. In particular consider a spinner control that allows to increase an integer by clicking onto an arrow. Changes can happen much more frequently than any backend could persist them.

A common approach to deal with this situation is [debouncing](https://rxjs-dev.firebaseapp.com/api/operators/debounce), i.e. we would configure some timeout such that a REST call would only happen if no interaction occurred within this timeout. This saves us from bursts of changes but leaves us with the open question how to select that timeout value. If it is too high we risk to lose changes if the application was closed before that timeout. A value too small might still overwhelm the backend.

## Solution Approach

Our solution approach is based on the idea that our REST backend is able to handle **batches of save operations** more efficiently than individual save operations. This is plausible because ...

- ... many databases that we can use to back our form offer batch insert or batch update operations that are more efficient than their single value counterparts.
- ... sending data as a batch to the REST backend saves the overhead of individual HTTP requests (this might be less of a factor for HTTP/2).
- ... the batch can be thinned out before executing it. In the spinner example above one batch of operations would contain many incremenets of the same number value. It is sufficient to only persist the latest of these updates. If a batch consists of updates to multiple fields, only their latest value has to be persisted, thus significantly reducing the size of the payload.

With the assumption of a more efficient batch processing in mind, our solution is as follows:

- we track if the consumer is busy or idle (i.e. if a save operation is in progress or not)
- if the consumer is idle, then we pass on a batch of size `1` with the current event
- if the consumer is busy we buffer all incoming events until the consumer is idle. At that point we immediately pass on a new batch with the buffered values (if any).

With this approach we guarantee to handle the source events as timely as possible, without having to control the input rate and without overwhelming the consumer.

The approach only makes sense if we can handle batches more efficiently than individual item, otherwise the approach is just a `noop`.

## Implementation

We implement this approach as the operator `batch(delegate)` where `delegate` is of type `UnaryFunction<T[], Observable<R>>`, i.e. a function that accepts a batch of source events and (optionally) produces emissions of result events. We consider the consumer to be idle when the observable of the result emissions for a batch has completed or erred (no matter of how many results the operation produced).

The following diagram visualizes the flow of events.


A reference implementation of the operator can be found [here](https://github.com/Carsten-Leue/rx-react-component/blob/master/src/backpressure/backpressure.ts). I'd be happy to get suggestions for a more elegant implementation.

## Usage

This section contains examples of how the operator might be used.

### Use REST to persist

Assume that we have a web form that a user can edit. Each edit produces an event that contains the field name and the updated value. We want to persist these edits as quickly as the system can handle them.
