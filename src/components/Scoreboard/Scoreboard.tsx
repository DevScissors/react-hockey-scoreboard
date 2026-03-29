import React, { useCallback, useState } from 'react';
import CountdownTimer from '../CountdownTimer/CountdownTimer';
import {
  useTimer,
  useTimerPair,
  type TimerAction,
  type TimerState,
} from '../../hooks/useTimer';
import './Scoreboard.css';

const DEFAULT_GAME_DURATION_SECONDS = 1200;
const DEFAULT_PENALTY_DURATION_SECONDS = 2 * 60;

/** How many penalty clocks each team has (add another `useTimer` inside `useTimerPair` to scale). */
const PENALTY_SLOTS = 2 as const;

function TimerControlGroup({
  title,
  timer,
  dispatch,
  minutes,
  setMinutes,
}: {
  title: string;
  timer: TimerState;
  dispatch: React.Dispatch<TimerAction>;
  minutes: number;
  setMinutes: (value: number) => void;
}) {
  return (
    <section className='timer-control-group'>
      <h3 className='timer-control-group__title'>{title}</h3>
      <div className='timer-control-group__actions'>
        <button type='button' onClick={() => dispatch({ type: 'TOGGLE_RUNNING' })}>
          {timer.isRunning ? 'Pause' : 'Start'}
        </button>
        <button type='button' onClick={() => dispatch({ type: 'RESET' })}>
          Reset
        </button>
        <button
          type='button'
          onClick={() => dispatch({ type: 'SET_DURATION_FROM_MINUTES', minutes })}
        >
          Set
        </button>
        <input
          type='number'
          min={0}
          step={0.5}
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
    Array.from({ length: slotCount }, () => defaultMinutes)
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
  const [homePenaltyMinutes, setHomePenaltyMinutesAt] = usePenaltyInputMinutes(PENALTY_SLOTS, 2);
  const [visitorPenaltyMinutes, setVisitorPenaltyMinutesAt] = usePenaltyInputMinutes(
    PENALTY_SLOTS,
    2
  );

  const [gameTimer, dispatchGame] = useTimer(DEFAULT_GAME_DURATION_SECONDS);
  const homePenalties = useTimerPair(DEFAULT_PENALTY_DURATION_SECONDS);
  const visitorPenalties = useTimerPair(DEFAULT_PENALTY_DURATION_SECONDS);

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
            />
          ))}
        </div>
      )}

      <div className='scoreboard-wrapper'>
        <div className='scoreboard'>
          <div className='scoreboard__clock'>
            <CountdownTimer seconds={gameTimer.secondsRemaining} variant='game' />
            {gameTimer.isFinished && <div className='timer-message'>Time&apos;s up!</div>}
          </div>
          <div className='scoreboard-team'>
            <h2>Home</h2>
            <p>0</p>
            <div className='penalty-timers'>
              <span className='penalty-timers__label'>PENALTY</span>
              {Array.from({ length: PENALTY_SLOTS }, (_, slot) => {
                const [state] = homePenalties[slot];
                return (
                  <div key={`home-display-${slot}`} className='penalty-timers__slot'>
                    <CountdownTimer
                      variant='penalty'
                      label=''
                      seconds={state.secondsRemaining}
                    />
                    {state.isFinished && (
                      <div className='timer-message timer-message--penalty'>Penalty over</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className='scoreboard-team'>
            <h2>Visitor</h2>
            <p>0</p>
            <div className='penalty-timers'>
            <span className='penalty-timers__label'>PENALTY</span>
              {Array.from({ length: PENALTY_SLOTS }, (_, slot) => {
                const [state] = visitorPenalties[slot];
                return (
                  <div key={`visitor-display-${slot}`} className='penalty-timers__slot'>
                    <CountdownTimer
                      variant='penalty'
                      label=''
                      seconds={state.secondsRemaining}
                    />
                    {state.isFinished && (
                      <div className='timer-message timer-message--penalty'>Penalty over</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          Period: <span>1</span>
        </div>
      </div>
    </>
  );
};
