import { createReactContext } from '../../di/context';
import { DelegateComponent } from '../../components/rx.component';

export type ComponentProps = {};

export const COMPONENT_CONTEXT = createReactContext<
  DelegateComponent<ComponentProps>
>('Component');
