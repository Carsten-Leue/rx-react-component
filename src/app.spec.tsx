import { render } from '@testing-library/react';
import React, { PureComponent } from 'react';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, pluck, startWith } from 'rxjs/operators';

import { rxComponent } from './public_api';

interface SampleProps {
  sampleInput: string;
}

interface SampleState {
  sampleState: string;
}

const sampleAppView = (aProps: SampleState) => {
  const { sampleState } = aProps;
  return <div data-testid="sample-id">{sampleState}</div>;
};

const sampleAppBloc = (props$: Observable<SampleProps>) => {
  const DEFAULT_STATE: SampleState = { sampleState: 'initial' };

  return props$.pipe(
    pluck('sampleInput'),
    distinctUntilChanged(),
    startWith(DEFAULT_STATE),
    map(prop => ({ sampleState: `computed ${prop}` }))
  );
};

const SampleApp = rxComponent(sampleAppBloc, sampleAppView);

const ViewApp = (aProps: SampleState) => (
  <div data-testid="sample-id">{aProps.sampleState}</div>
);

describe('app', () => {
  it('renders HOC', () => {
    const MyApp = rxComponent<SampleProps, SampleState>(
      props$ =>
        props$.pipe(
          pluck('sampleInput'),
          distinctUntilChanged(),
          map(prop => ({ sampleState: `computed ${prop}` }))
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
