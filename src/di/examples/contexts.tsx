import { createContext, FC } from 'react';
import { useContext } from 'react';
import * as React from 'react';
import { noop } from 'rxjs';

import { Logger } from '../../stories/di/logger.api';
import { Service } from '../../stories/di/service.api';
import { createInjectableReactProvider } from '../module.provider';
import { createModuleFromProvider, ReactProvider } from '../provider';

// construct the react contexts
const LOGGER_CONTEXT = createContext<Logger>(noop);
const SERVICE_CONTEXT = createContext<Service>(() => '');
const COMPONENT_CONTEXT = createContext<FC>(() => <div></div>);

// component to provide the logger
const LoggerImpl: FC = ({ children }) => (
  <LOGGER_CONTEXT.Provider value={data => console.log(data)}>
    {children}
  </LOGGER_CONTEXT.Provider>
);

// component to provide the service
const ServiceImpl: FC = ({ children }) => {
  // resolve the dependencies
  const logger = useContext(LOGGER_CONTEXT);
  // the service
  const service: Service = () => {
    logger('invoke service');
    return 'somedata';
  };
  // provide the dependency
  return (
    <SERVICE_CONTEXT.Provider value={service}>
      {children}
    </SERVICE_CONTEXT.Provider>
  );
};

const SERVICE_PROVIDER: ReactProvider<Service> = {
  module: ServiceImpl,
  provides: SERVICE_CONTEXT,
  optionalDependencies: [LOGGER_CONTEXT]
};

const LOGGER_PROVIDER: ReactProvider<Logger> = {
  module: LoggerImpl,
  provides: LOGGER_CONTEXT
};

// our component
const MyComponent: FC = ({ children }) => {
  // resolve the dependencies
  const logger = useContext(LOGGER_CONTEXT);
  const service = useContext(SERVICE_CONTEXT);

  logger('rendering ...');

  // produce some markup
  return <div>{service()}</div>;
};

const MyApp: FC = () => (
  <LoggerImpl>
    <ServiceImpl>
      <MyComponent></MyComponent>
    </ServiceImpl>
  </LoggerImpl>
);

const MyApplication = createModuleFromProvider([
  SERVICE_PROVIDER,
  LOGGER_PROVIDER
]);

const createService = ([]: [], [logger = noop]: [Logger?]): Service => () => {
  logger('invoke service');
  return 'somedata';
};

const SERVICE_PROVIDER1 = createInjectableReactProvider(
  createService,
  SERVICE_CONTEXT,
  undefined,
  [LOGGER_CONTEXT]
);

const createComponent = (
  [service]: [Service],
  [logger = noop]: [Logger?]
): FC => {
  // here we could do some heavy computations
  logger('constructing component ...');

  // this is the component implementation
  return () => {
    logger('rendering ...');

    // produce some markup
    return <div>{service()}</div>;
  };
};

const COMPONENT_PROVIDER = createInjectableReactProvider(
  createComponent,
  COMPONENT_CONTEXT,
  [SERVICE_CONTEXT],
  [LOGGER_CONTEXT]
);
