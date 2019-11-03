import * as React from 'react';

import { RxComponent } from '../../rx.component';

export interface HelloWorldProps {
  name: string;
}

export interface HelloWorldState {
  name: string;
}

export class HelloWorld extends RxComponent<HelloWorldProps, HelloWorldState> {
  constructor(aProps: Readonly<HelloWorldProps>) {
    super(aProps);

    const state$ = this.props$;

    this.connectState(state$);
  }

  render() {
    const { name } = this.state;
    return <div>Hello {name}</div>;
  }
}
