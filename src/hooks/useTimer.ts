import { useEffect, useReducer, type Dispatch } from 'react';

export type TimerState = {
  durationSeconds: number;
  secondsRemaining: number;
  isRunning: boolean;
  isFinished: boolean;
};

export type TimerAction =
  | { type: 'TICK' }
  | { type: 'TOGGLE_RUNNING' }
  | { type: 'RESET' }
  | { type: 'SET_DURATION_FROM_MINUTES'; minutes: number };

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'TICK': {
      if (!state.isRunning) return state;
      if (state.secondsRemaining <= 1) {
        return {
          ...state,
          secondsRemaining: 0,
          isRunning: false,
          isFinished: true,
        };
      }
      return {
        ...state,
        secondsRemaining: state.secondsRemaining - 1,
      };
    }
    case 'TOGGLE_RUNNING': {
      if (state.secondsRemaining <= 0) return state;
      return {
        ...state,
        isRunning: !state.isRunning,
        isFinished: false,
      };
    }
    case 'RESET':
      return {
        ...state,
        isRunning: false,
        isFinished: false,
        secondsRemaining: state.durationSeconds,
      };
    case 'SET_DURATION_FROM_MINUTES': {
      const next = Math.max(0, action.minutes * 60);
      return {
        ...state,
        durationSeconds: next,
        secondsRemaining: next,
        isRunning: false,
        isFinished: false,
      };
    }
    default:
      return state;
  }
}

function createInitialState(initialDurationSeconds: number): TimerState {
  return {
    durationSeconds: initialDurationSeconds,
    secondsRemaining: initialDurationSeconds,
    isRunning: false,
    isFinished: false,
  };
}

/** Shared countdown logic for the game clock and per-team penalty timers. */
export function useTimer(initialDurationSeconds: number) {
  const [state, dispatch] = useReducer(
    timerReducer,
    initialDurationSeconds,
    createInitialState
  );

  useEffect(() => {
    if (!state.isRunning) return;

    const id = window.setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);

    return () => clearInterval(id);
  }, [state.isRunning]);

  return [state, dispatch] as const;
}

/** One timer instance: state + dispatch. */
export type TimerBundle = readonly [TimerState, Dispatch<TimerAction>];

/**
 * Two independent penalty clocks for one team. Hooks must be fixed at compile time
 * (not called in a loop), so this composes two `useTimer` calls.
 */
export function useTimerPair(initialDurationSeconds: number): readonly [TimerBundle, TimerBundle] {
  const first = useTimer(initialDurationSeconds);
  const second = useTimer(initialDurationSeconds);
  return [first, second] as const;
}
