import { Observable, ReplaySubject, Subject } from 'rxjs';

export type Consumer<T> = (aValue: T) => void;

export const createSingleSubject = <T>() => new ReplaySubject<T>(1);

export const createConsumerOnSubject = <T>(
  aSubject: Subject<T>
): Consumer<T> => (aValue) => aSubject.next(aValue);

/**
 * Converts a subject to an observable
 *
 * @param subject  - the subject
 * @returns the observable
 */
export const asObservable: <T>(aSubject: Subject<T>) => Observable<T> = (
  subject
) => subject.asObservable();
