import { createReactContext } from '../../di/context';

export type Multi = () => string;

export const MULTI_CONTEXT = createReactContext<Multi[]>('Multi');
