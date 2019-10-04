import { Observable, Observer, ReplaySubject, Subject } from 'rxjs';

export interface Consumer<T> extends Observer<T> {
  (aValue: T): void;
}

export const createSingleSubject = <T>() => new ReplaySubject<T>(1);

export const observerAsConsumer = <T>(aSubject: Observer<T>): Consumer<T> => {
  // hook the methods
  const next = (aValue: T) => aSubject.next(aValue);
  const error = (err: any) => aSubject.error(err);
  const complete = () => aSubject.complete();
  // returns the consumer
  return Object.assign(next, { next, error, complete });
};

/**
 * Converts a subject to an observable
 *
 * @param subject  - the subject
 * @returns the observable
 */
export const asObservable: <T>(aSubject: Subject<T>) => Observable<T> = (
  subject
) => subject.asObservable();
