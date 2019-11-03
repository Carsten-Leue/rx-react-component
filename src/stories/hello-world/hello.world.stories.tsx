import { storiesOf } from '@storybook/react';
import * as React from 'react';
import { HelloWorld } from './hello.world';
storiesOf('HelloWorld', module).add('with text', () => (
  <HelloWorld name="Carsten" />
));
