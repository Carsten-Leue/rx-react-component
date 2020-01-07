import { createInjectableReactProvider } from '../../di/module.provider';
import { Multi, MULTI_CONTEXT } from './multi.api';

const createMulti1 = (req: never, [multi = []]: [Multi[]?]): Multi[] => [
  ...multi,
  () => 'multi1'
];
const createMulti2 = (req: never, [multi = []]: [Multi[]?]): Multi[] => [
  ...multi,
  () => 'multi2'
];

export const MULTI1_PROVIDER = createInjectableReactProvider(
  createMulti1,
  MULTI_CONTEXT,
  undefined,
  [MULTI_CONTEXT]
);

export const MULTI2_PROVIDER = createInjectableReactProvider(
  createMulti2,
  MULTI_CONTEXT,
  undefined,
  [MULTI_CONTEXT]
);
