import React, { useCallback, useState, useEffect } from 'react';
import CountdownTimer from '../CountdownTimer/CountdownTimer';
import {
  useTimer,
  useTimerPair,
  type TimerAction,
  type TimerState,
} from '../../hooks/useTimer';
import './Scoreboard.css';

const DEFAULT_GAME_DURATION_SECONDS = 1200;
const DEFAULT_PENALTY_DURATION_SECONDS = 0;

/** How many penalty clocks each team has (add another `useTimer` inside `useTimerPair` to scale). */
const PENALTY_SLOTS = 2 as const;

function TimerControlGroup({
  title,
  timer,
  dispatch,
  minutes,
  setMinutes,
  disableToggle = false,
}: {
  title: string;
  timer: TimerState;
  dispatch: React.Dispatch<TimerAction>;
  minutes: number;
  setMinutes: (value: number) => void;
  disableToggle?: boolean;
}) {
  return (
    <section className='timer-control-group'>
      <h3 className='timer-control-group__title'>{title}</h3>
      <div className='timer-control-group__actions'>
        <button
          type='button'
          onClick={() => dispatch({ type: 'TOGGLE_RUNNING' })}
          disabled={disableToggle}
        >
          {timer.isRunning ? 'Pause' : 'Start'}
        </button>
        <button type='button' onClick={() => dispatch({ type: 'RESET' })}>
          Reset
        </button>
        <button
          type='button'
          onClick={() =>
            dispatch({ type: 'SET_DURATION_FROM_MINUTES', minutes })
          }
        >
          Set
        </button>
        <input
          type='number'
          min={0}
          step={1}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          aria-label={`${title} length in minutes`}
        />
      </div>
    </section>
  );
}

/** One numeric input per penalty slot (length must match `PENALTY_SLOTS` / `useTimerPair`). */
function usePenaltyInputMinutes(slotCount: number, defaultMinutes: number) {
  const [minutes, setMinutes] = useState<number[]>(() =>
    Array.from({ length: slotCount }, () => defaultMinutes),
  );
  const setAt = useCallback((slot: number) => {
    return (value: number) => {
      setMinutes((prev) => {
        const next = [...prev];
        next[slot] = value;
        return next;
      });
    };
  }, []);
  return [minutes, setAt] as const;
}

export const Scoreboard = (): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [gameInputMinutes, setGameInputMinutes] = useState(1);
  const [homePenaltyMinutes, setHomePenaltyMinutesAt] = usePenaltyInputMinutes(
    PENALTY_SLOTS,
    2,
  );
  const [visitorPenaltyMinutes, setVisitorPenaltyMinutesAt] =
    usePenaltyInputMinutes(PENALTY_SLOTS, 2);

  const [gameTimer, dispatchGame] = useTimer(DEFAULT_GAME_DURATION_SECONDS);
  const homePenalties = useTimerPair(DEFAULT_PENALTY_DURATION_SECONDS);
  const visitorPenalties = useTimerPair(DEFAULT_PENALTY_DURATION_SECONDS);

  // Sync home penalties with game clock
  useEffect(() => {
    homePenalties.forEach(([state, dispatch]) => {
      if (
        state.isRunning !== gameTimer.isRunning &&
        state.secondsRemaining > 0
      ) {
        dispatch({ type: 'TOGGLE_RUNNING' });
      }
    });
  }, [gameTimer.isRunning, homePenalties]);

  // Sync visitor penalties with game clock
  useEffect(() => {
    visitorPenalties.forEach(([state, dispatch]) => {
      if (
        state.isRunning !== gameTimer.isRunning &&
        state.secondsRemaining > 0
      ) {
        dispatch({ type: 'TOGGLE_RUNNING' });
      }
    });
  }, [gameTimer.isRunning, visitorPenalties]);

  const toggleEdit = () => setIsEditing((prev) => !prev);

  return (
    <>
      <h1 className='scoreboard-type'>Hockey Scoreboard</h1>

      <button type='button' onClick={toggleEdit}>
        {isEditing ? 'Save' : 'Edit'}
      </button>

      {isEditing && (
        <div id='timer-controls' className='timer-controls'>
          <TimerControlGroup
            title='Game clock'
            timer={gameTimer}
            dispatch={dispatchGame}
            minutes={gameInputMinutes}
            setMinutes={setGameInputMinutes}
          />
          {Array.from({ length: PENALTY_SLOTS }, (_, slot) => (
            <TimerControlGroup
              key={`home-penalty-${slot}`}
              title={`Home penalty ${slot + 1}`}
              timer={homePenalties[slot][0]}
              dispatch={homePenalties[slot][1]}
              minutes={homePenaltyMinutes[slot]}
              setMinutes={setHomePenaltyMinutesAt(slot)}
              disableToggle={true}
            />
          ))}
          {Array.from({ length: PENALTY_SLOTS }, (_, slot) => (
            <TimerControlGroup
              key={`visitor-penalty-${slot}`}
              title={`Visitor penalty ${slot + 1}`}
              timer={visitorPenalties[slot][0]}
              dispatch={visitorPenalties[slot][1]}
              minutes={visitorPenaltyMinutes[slot]}
              setMinutes={setVisitorPenaltyMinutesAt(slot)}
              disableToggle={true}
            />
          ))}
        </div>
      )}

      <div className='scoreboard-wrapper'>
        <div className='scoreboard'>
          <div className='scoreboard__clock'>
            <CountdownTimer
              inputId='game-clock-input'
              seconds={gameTimer.secondsRemaining}
              variant='game'
            />
            {gameTimer.isFinished && (
              <div className='timer-message'>Time&apos;s up!</div>
            )}
          </div>
          <div className='scoreboard-team'>
            <h2>Home</h2>
            <p>0</p>
            Period: <span>1</span>
            <h2>Visitor</h2>
            <p>0</p>
          </div>
          <div className='penalty-timers'>
            <div className='penalty-timers__label'>PENALTY</div>
            {Array.from({ length: PENALTY_SLOTS }, (_, slot) => {
              const [state] = homePenalties[slot];
              return (
                <div
                  key={`home-display-${slot}`}
                  className='penalty-timers__slot'
                >
                  <input
                    type='text'
                    pattern='^[0-9]$'
                    id={`home-penalty-${slot + 1}-player`}
                    className='time-display'
                    maxLength={2}
                  />
                  <CountdownTimer
                    inputId={`home-penalty-${slot + 1}-input`}
                    variant='penalty'
                    label=''
                    seconds={state.secondsRemaining}
                  />
                </div>
              );
            })}
          </div>
          <div className='penalty-timers'>
            <div className='penalty-timers__label'>PENALTY</div>
            {Array.from({ length: PENALTY_SLOTS }, (_, slot) => {
              const [state] = visitorPenalties[slot];
              return (
                <div
                  key={`visitor-display-${slot}`}
                  className='penalty-timers__slot'
                >
                  <input
                    type='text'
                    pattern=' 0+\.[0-9]*[1-9][0-9]*$'
                    id={`visitor-penalty-${slot + 1}-player`}
                    className='time-display'
                    maxLength={2}
                  />
                  <CountdownTimer
                    inputId={`visitor-penalty-${slot + 1}-input`}
                    variant='penalty'
                    label=''
                    seconds={state.secondsRemaining}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
