import { render } from '@testing-library/react';
import React, { PureComponent } from 'react';
import { distinctUntilChanged, map, pluck } from 'rxjs/operators';

import { RxComponent } from './rx.component';
import { rxComponent } from './rx.hoc';

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
    return <div data-testid="sample-id">{state.sampleState}</div>;
  }
}

const ViewApp = (aProps: SampleState) => (
  <div data-testid="sample-id">{aProps.sampleState}</div>
);

describe('app', () => {
  it('renders HOC', () => {
    const MyApp = rxComponent<SampleProps, SampleState>(
      (props$) =>
        props$.pipe(
          pluck('sampleInput'),
          distinctUntilChanged(),
          map((prop) => ({ sampleState: `computed ${prop}` }))
        ),
      ViewApp
    );
    const { getByTestId } = render(<MyApp sampleInput={'Carsten'} />);
    expect(getByTestId('sample-id')).toHaveTextContent('computed Carsten');
  });

  it('renders without crashing', () => {
    const { getByTestId } = render(<SampleApp sampleInput={'Carsten'} />);
    expect(getByTestId('sample-id')).toHaveTextContent('computed Carsten');
  });
});
