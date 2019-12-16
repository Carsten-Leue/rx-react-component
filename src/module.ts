import { ReactNode } from 'react';

import { DelegateComponent } from './rx.component';

export interface ReactModuleProps {
  children?: ReactNode;
}

export type ReactModule = DelegateComponent<ReactModuleProps>;
