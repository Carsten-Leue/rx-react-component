import React from 'react';
import { shallow } from 'enzyme';
import { RxComponent } from './rx.component';
import { pluck, distinctUntilChanged, map } from 'rxjs/operators';

interface SampleProps {
  sampleInput: string;
}

interface SampleState {
  sampleState: string;
}

class SampleApp extends RxComponent<SampleProps, SampleState> {
  constructor(aProps: Readonly<SampleProps>) {
    super(aProps);

    const DEFAULT_STATE: SampleState = { sampleState: 'initial' };

    const state$ = this.props$.pipe(
      pluck('sampleInput'),
      distinctUntilChanged(),
      map((prop) => ({ sampleState: `computed ${prop}` }))
    );

    this.connectState(state$);
  }

  render() {
    const { state } = this;
    return <div>{state.sampleState}</div>;
  }
}

describe('app', () => {
  it('renders without crashing', () => {
    shallow(<SampleApp sampleInput={'Carsten'} />);
  });
});
