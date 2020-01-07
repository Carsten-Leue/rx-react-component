import { createInjectableReactProvider } from '../../di/module.provider';
import { Logger, LOGGER_CONTEXT } from './logger.api';

const createLogger = (): Logger => value => console.log('Logger', value);

export const LOGGER_PROVIDER = createInjectableReactProvider(
  createLogger,
  LOGGER_CONTEXT
);
