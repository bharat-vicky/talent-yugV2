import { useState, useCallback, useRef } from 'react';

export function useHistory<T>(initialState: T) {
  const [state, setState] = useState<{
    past: T[];
    present: T;
    future: T[];
  }>({
    past: [],
    present: initialState,
    future: [],
  });

  const lastPushTime = useRef<number>(0);

  const set = useCallback((value: T | ((prev: T) => T)) => {
    setState((curr) => {
      const nextPresent = typeof value === 'function' ? (value as (prev: T) => T)(curr.present) : value;
      
      if (JSON.stringify(curr.present) === JSON.stringify(nextPresent)) {
        return curr;
      }

      const now = Date.now();
      // If the last history push was less than 500ms ago, group the change
      // by just updating the present state and NOT pushing the intermediate state to past.
      if (now - lastPushTime.current < 500) {
        lastPushTime.current = now; // keep extending the window while dragging
        return {
          ...curr,
          present: nextPresent,
        };
      }

      // Otherwise, it's a new distinct change. Push current to past.
      lastPushTime.current = now;
      return {
        past: [...curr.past, curr.present],
        present: nextPresent,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((curr) => {
      if (curr.past.length === 0) return curr;
      
      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);
      
      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((curr) => {
      if (curr.future.length === 0) return curr;
      
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((toState?: T) => {
    setState({
      past: [],
      present: toState !== undefined ? toState : initialState,
      future: [],
    });
    lastPushTime.current = 0;
  }, [initialState]);

  const replace = useCallback((value: T | ((prev: T) => T)) => {
    setState((curr) => {
      const nextPresent = typeof value === 'function' ? (value as (prev: T) => T)(curr.present) : value;
      return {
        ...curr,
        present: nextPresent,
      };
    });
  }, []);

  const commit = useCallback(() => {
    // No-op for compatibility
  }, []);

  return {
    state: state.present,
    set,
    replace,
    commit,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
