import { Context, createElement, PureComponent } from 'react';
import { Unsubscribable } from 'rxjs';

const selectUnsubscribe = (aValue: any) => aValue && aValue.unsubscribe;

/**
 * Tests if we have an unsubscribable object that requires teardown
 *
 * @param aValue - the value to check
 * @returns true if the value is unsubscribable
 */
function isUnsubscribable(aValue: any): aValue is Unsubscribable {
  return typeof selectUnsubscribe(aValue) === 'function';
}

/**
 * Safely unsubscribe the value
 *
 * @param aValue - the value in questions
 */
const unsubscribe = (aValue: any) =>
  isUnsubscribable(aValue) && aValue.unsubscribe();

export interface BaseProviderProps {
  value: any;
  ctx: Context<any>;
}

/**
 * We use a class instead of a function component, since we need to know about
 * the lifecycle of the provided value.
 *
 * The class provides the given value and unsubscribes from a potential previous value
 */
export class BaseProvider extends PureComponent<BaseProviderProps> {
  /**
   * Initialize the provider
   *
   * @param aProps - props, including the actual value and the context
   */
  constructor(aProps: Readonly<BaseProviderProps>) {
    super(aProps);
  }

  componentWillUnmount() {
    unsubscribe(this.props.value);
  }

  componentDidUpdate(aPrevProps: BaseProviderProps) {
    // check if the props change, so we can destroy the provider
    const {
      props: { value: newValue }
    } = this;
    const { value: oldValue } = aPrevProps;
    // sanity check
    if (oldValue !== newValue) {
      // unsubscribe the old value
      unsubscribe(oldValue);
    }
  }

  render() {
    // decompose
    const {
      props: {
        value,
        ctx: { Provider },
        children
      }
    } = this;
    // create the actual provider
    return createElement(Provider, { value }, children);
  }
}
