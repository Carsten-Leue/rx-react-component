import { FC } from 'react';
import * as React from 'react';
import { noop, pipe } from 'rxjs';
import { map, mapTo, tap } from 'rxjs/operators';

import {
  DelegateComponent,
  rxComponent,
  StateFunction
} from '../../components/rx.component';
import { createInjectableReactProvider } from '../../di/module.provider';
import { COMPONENT_CONTEXT, ComponentProps } from './component.api';
import { Logger, LOGGER_CONTEXT } from './logger.api';
import { Service, SERVICE_CONTEXT } from './service.api';

const createComponent = (
  [service]: [Service],
  [logger = noop]: [Logger?]
): DelegateComponent<ComponentProps> => {
  interface ViewProps {
    data: string;
  }

  // business layer
  const bloc: StateFunction<ComponentProps, ViewProps> = pipe(
    mapTo(service()),
    map(data => ({ data })),
    tap(state => logger(JSON.stringify(state)))
  );

  // view layer
  const view: FC<ViewProps> = ({ data }) => (
    <div data-testid="test">{data}</div>
  );

  return rxComponent(bloc, view);
};

export const COMPONENT_PROVIDER = createInjectableReactProvider(
  createComponent,
  COMPONENT_CONTEXT,
  [SERVICE_CONTEXT],
  [LOGGER_CONTEXT]
);
