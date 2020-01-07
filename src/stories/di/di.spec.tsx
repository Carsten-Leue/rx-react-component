import { render } from '@testing-library/react';
import React, { FC, useContext } from 'react';
import { SERVICE_PROVIDER } from './service.impl';
import { LOGGER_PROVIDER } from './logger.impl';
import { COMPONENT_PROVIDER } from './component.impl';
import { createModuleFromProvider } from '../../di/provider';
import { COMPONENT_CONTEXT } from './component.api';
import { MULTI1_PROVIDER, MULTI2_PROVIDER } from './multi.impl';
import { COMPONENT_MULTI_PROVIDER } from './multi.component.impl';

describe('di', () => {
  it('renders a component with a multi provider', () => {
    const PROVIDERS = [
      MULTI1_PROVIDER,
      MULTI2_PROVIDER,
      LOGGER_PROVIDER,
      COMPONENT_MULTI_PROVIDER
    ];

    const Module = createModuleFromProvider(PROVIDERS);

    const App: FC = () => {
      const Component = useContext(COMPONENT_CONTEXT);
      return <Component />;
    };

    const { getByTestId } = render(
      <Module>
        <App />
      </Module>
    );

    // get the text content

    const text = new Set(JSON.parse(getByTestId('test').textContent!));
    expect(text.has('multi1')).toBeTruthy();
    expect(text.has('multi2')).toBeTruthy();
  });

  it('renders a provided component', () => {
    const PROVIDERS = [SERVICE_PROVIDER, COMPONENT_PROVIDER, LOGGER_PROVIDER];

    const Module = createModuleFromProvider(PROVIDERS);

    const App: FC = () => {
      const Component = useContext(COMPONENT_CONTEXT);
      return <Component />;
    };

    const { getByTestId } = render(
      <Module>
        <App />
      </Module>
    );

    expect(getByTestId('test')).toHaveTextContent('Service');
  });
});
