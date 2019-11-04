import { storiesOf } from '@storybook/react';
import * as React from 'react';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { bindNext, rxComponent } from '../../public_api';
import { ControlledCounter } from './controlled.counter';

const StoryHolder = rxComponent(
  () => {
    const increment = new BehaviorSubject(0);
    const onValue = bindNext(increment);
    return increment.pipe(map(value => ({ value, onValue })));
  },
  props => <ControlledCounter {...props}></ControlledCounter>
);

storiesOf('ControlledCounter', module).add('with initial value', () => (
  <StoryHolder />
));
