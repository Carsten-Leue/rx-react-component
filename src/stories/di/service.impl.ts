import { noop } from 'rxjs';

import { createInjectableReactProvider } from '../../di/module.provider';
import { Logger, LOGGER_CONTEXT } from './logger.api';
import { Service, SERVICE_CONTEXT } from './service.api';

const createService = (
  req: never,
  [logger = noop]: [Logger?]
): Service => () => {
  logger('Service');
  return 'Service';
};

export const SERVICE_PROVIDER = createInjectableReactProvider(
  createService,
  SERVICE_CONTEXT,
  undefined,
  [LOGGER_CONTEXT]
);
