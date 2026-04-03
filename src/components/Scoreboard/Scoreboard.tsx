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
  isPenalty = false,
}: {
  title: string;
  timer: TimerState;
  dispatch: React.Dispatch<TimerAction>;
  minutes: number;
  setMinutes: (value: number) => void;
  disableToggle?: boolean;
  isPenalty?: boolean;
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
          min={isPenalty ? 0 : 0}
          max={isPenalty ? 10 : undefined}
          step={isPenalty ? 2 : 1}
          className={isPenalty ? 'time-display show-spinner' : 'time-display'}
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
  const [isClockEditorOpen, setIsClockEditorOpen] = useState(false);
  const [gameClockMinutesInput, setGameClockMinutesInput] = useState('1');
  const clockInputRef = React.useRef<HTMLInputElement>(null);
  const [homePenaltyMinutes, setHomePenaltyMinutesAt] = usePenaltyInputMinutes(
    PENALTY_SLOTS,
    2,
  );
  const [visitorPenaltyMinutes, setVisitorPenaltyMinutesAt] =
    usePenaltyInputMinutes(PENALTY_SLOTS, 2);

  const [gameTimer, dispatchGame] = useTimer(DEFAULT_GAME_DURATION_SECONDS);
  const homePenalties = useTimerPair(DEFAULT_PENALTY_DURATION_SECONDS);
  const visitorPenalties = useTimerPair(DEFAULT_PENALTY_DURATION_SECONDS);

  const currentGameMinutes = Math.max(1, Math.ceil(gameTimer.secondsRemaining / 60));

  const openClockEditor = () => {
    setGameClockMinutesInput(String(currentGameMinutes));
    setIsClockEditorOpen(true);
  };

  React.useEffect(() => {
    if (isClockEditorOpen) {
      clockInputRef.current?.focus();
      clockInputRef.current?.select();
    }
  }, [isClockEditorOpen]);

  const commitClockMinutes = (input: string) => {
    const minutes = Number(input);
    if (Number.isNaN(minutes) || minutes < 1) {
      // fallback to previous valid game minutes if input is invalid
      setGameClockMinutesInput(String(gameInputMinutes));
      setIsClockEditorOpen(false);
      return;
    }

    const validated = Math.max(1, Math.min(99, Math.floor(minutes)));
    setGameInputMinutes(validated);
    dispatchGame({ type: 'SET_DURATION_FROM_MINUTES', minutes: validated });
    setIsClockEditorOpen(false);
  };

  const startStopGameClock = () => {
    if (!gameTimer.isRunning && gameTimer.secondsRemaining > 0) {
      dispatchGame({ type: 'TOGGLE_RUNNING' });
    }
    else {
      dispatchGame({ type: 'TOGGLE_RUNNING' });
    }
  };

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
              isPenalty={true}
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
              isPenalty={true}
            />
          ))}
        </div>
      )}

      <div className='scoreboard-wrapper'>
        <div className='scoreboard' onClick={() => { if (isEditing) setIsEditing(false); }}>
          <div className='scoreboard__top-wrapper'>
            <div className='scoreboard-home-team'>
              <h2>Home</h2>
              <input
                id='home-score-input'
                type="text"
                value="0"
                readOnly={!isEditing}
                className='score-input'
              />
            </div>
            <div className='scoreboard__clock-period'>
              <div className='scoreboard__clock'>
                {isClockEditorOpen ? (
                  <div className='countdown-timer'>
                    <input
                      ref={clockInputRef}
                      type='number'
                      id='game-clock-input'
                      className='time-display'
                      min={1}
                      max={99}
                      maxLength={2}
                      value={gameClockMinutesInput}
                      onChange={(e) => {
                        const numericString = e.target.value.replace(/\D/g, '').slice(0, 2);
                        setGameClockMinutesInput(numericString);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => {
                        commitClockMinutes(gameClockMinutesInput);
                        setIsEditing(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          commitClockMinutes(gameClockMinutesInput);
                        }
                        if (e.key === 'Escape') {
                          setIsClockEditorOpen(false);
                        }
                      }}
                      aria-label='Set game clock minutes'
                    />
                  </div>
                ) : (
                  <>
                    <CountdownTimer
                      inputId='game-clock-input'
                      seconds={gameTimer.secondsRemaining}
                      variant='game'
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isEditing) {
                          startStopGameClock();
                        } else {
                          openClockEditor();
                        }
                      }}
                      onBlur={() => setIsEditing(false)}
                    />
                  </>
                )}

                {gameTimer.isFinished && (
                  <div className='timer-message'>Time&apos;s up!</div>
                )}
              </div>
              <div className='period-input'>
                Period:
                <input
                  type="text"
                  id={'period-counter-input'}
                  value="1"
                  className='period-input__field'
                  readOnly={!isEditing}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className='scoreboard-visitor-team'>
              <h2>Visitor</h2>
              <input
                type="text"
                id='visitor-score-input'
                value="0"
                readOnly={!isEditing}
                className='score-input'
              />
            </div>
          </div>
          <div className="scoreboard__bottom-wrapper">
            <div className='penalty-timers'>
              <div className='penalty-home-label-wrapper'>
                <div className='penalty-player-number__label'>PLAYER</div>
                <div className='penalty-timers__label'>PENALTY</div>
              </div>
              {Array.from({ length: PENALTY_SLOTS }, (_, slot) => {
                const [state] = homePenalties[slot];
                return (
                  <div
                    key={`home-display-${slot}`}
                    className='penalty-timers__slot'
                  >
                    <input
                      type='number'
                      id={`home-penalty-${slot + 1}-player`}
                      className='time-display'
                      maxLength={2}
                      min={0}
                      max={99}
                      readOnly={!isEditing}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <CountdownTimer
                      inputId={`home-penalty-${slot + 1}-input`}
                      variant='penalty'
                      label=''
                      seconds={state.secondsRemaining}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                );
              })}
            </div>
            <div className='penalty-timers'>
              <div className='penalty-visitor-label-wrapper'>
                <div className='penalty-player-number__label'>PLAYER</div>
                <div className='penalty-timers__label'>PENALTY</div>
              </div>
              {Array.from({ length: PENALTY_SLOTS }, (_, slot) => {
                const [state] = visitorPenalties[slot];
                return (
                  <div
                    key={`visitor-display-${slot}`}
                    className='penalty-timers__slot'
                  >
                    <input
                      type='number'
                      id={`visitor-penalty-${slot + 1}-player`}
                      className='time-display'
                      maxLength={2}
                      min={0}
                      max={99}
                      readOnly={!isEditing}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <CountdownTimer
                      inputId={`visitor-penalty-${slot + 1}-input`}
                      variant='penalty'
                      label=''
                      seconds={state.secondsRemaining}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
