import { ReactNode } from 'react';

import { DelegateComponent } from '../components/rx.component';

export interface ReactModuleProps {
  children?: ReactNode;
}

export type ReactModule = DelegateComponent<ReactModuleProps>;
