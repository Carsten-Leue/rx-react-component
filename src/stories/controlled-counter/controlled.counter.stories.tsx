import { storiesOf } from '@storybook/react';
import * as React from 'react';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { rxComponent } from '../../rx.hoc';
import { bindNext } from '../../utils';
import { ControlledCounter } from './controlled.counter';

const StoryHolder = rxComponent(
  () => {
    const increment = new BehaviorSubject(0);
    const onIncrement = bindNext(increment);
    return increment.pipe(map(value => ({ value, onIncrement })));
  },
  props => <ControlledCounter {...props}></ControlledCounter>
);

storiesOf('ControlledCounter', module).add('with initial value', () => (
  <StoryHolder />
));
