import {
  Observer,
  OperatorFunction,
  pipe,
  ReplaySubject,
  UnaryFunction
} from 'rxjs';
import { distinctUntilChanged, pluck } from 'rxjs/operators';

export const createSingleSubject = <T>() => new ReplaySubject<T>(1);

/**
 * Returns a function that triggers the `next` method
 * on the provided observer.
 *
 * @param aSubject - the observer
 * @returns a bound next function
 */
export const bindNext = <T>(aSubject: Observer<T>): UnaryFunction<T, void> =>
  aSubject.next.bind(aSubject);

/**
 * Extracts a property and checks if the property did not change
 *
 * @param aKey  - the key to extract
 * @param aCmp  - optional comparator function for the value
 *
 * @returns the unique sequence for the property
 */
export const prop = <T, K extends keyof T>(
  aKey: K,
  aCmp?: (x: T[K], y: T[K]) => boolean
): OperatorFunction<T, T[K]> => pipe(pluck(aKey), distinctUntilChanged(aCmp));

/**
 * Pushes a value to an array
 *
 * @param aValue - the value
 * @param aArray - the array
 * @returns the array
 */
export const arrayPush = <T>(aValue: T, aArray: T[]): T[] => {
  aArray.push(aValue);
  return aArray;
};
