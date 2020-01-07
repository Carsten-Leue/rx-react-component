import { createReactContext } from '../../di/context';

export type Service = () => string;

export const SERVICE_CONTEXT = createReactContext<Service>('Service');
