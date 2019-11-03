import { storiesOf } from '@storybook/react';
import * as React from 'react';
import { Counter } from './counter';
storiesOf('Counter', module).add('with initial value', () => (
  <Counter initial={10} />
));
