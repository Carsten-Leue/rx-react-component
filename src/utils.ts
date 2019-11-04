import {
  Observable,
  Observer,
  ReplaySubject,
  Subject,
  UnaryFunction
} from 'rxjs';

export const createSingleSubject = <T>() => new ReplaySubject<T>(1);

export const bindNext = <T>(aSubject: Observer<T>): UnaryFunction<T, void> =>
  aSubject.next.bind(aSubject);

/**
 * Converts a subject to an observable
 *
 * @param subject  - the subject
 * @returns the observable
 */
export const asObservable: <T>(
  aSubject: Subject<T>
) => Observable<T> = subject => subject.asObservable();
