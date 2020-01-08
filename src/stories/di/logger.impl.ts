import { createInjectableReactProvider } from '../../di/module.provider';
import { Logger, LOGGER_CONTEXT } from './logger.api';

export const NOOP_LOGGER: Logger = () => {};

const createLogger = (): Logger => value => console.log('Logger', value);

export const LOGGER_PROVIDER = createInjectableReactProvider(
  createLogger,
  LOGGER_CONTEXT
);
