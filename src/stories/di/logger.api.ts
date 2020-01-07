import { createReactContext } from '../../di/context';

export type Logger = (aValue: string) => void;

export const LOGGER_CONTEXT = createReactContext<Logger>('Logger');
