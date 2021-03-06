import * as React from 'react';
import { pipe } from 'rxjs';
import { map } from 'rxjs/operators';

import { prop, rxComponent } from '../../public_api';

export interface HelloWorldProps {
  name: string;
}

export interface HelloWorldState {
  text: string;
}

export const HelloWorld = rxComponent<HelloWorldProps, HelloWorldState>(
  pipe(
    prop('name'),
    map(name => ({ text: `Hello ${name}` }))
  ),
  ({ text }) => <div>{text}</div>
);
