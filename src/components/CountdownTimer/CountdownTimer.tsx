import './CountdownTimer.css';

function formatTime(
  totalSeconds: number,
  variant: 'game' | 'penalty' = 'game',
) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 10);

  // Show tenths only for game clock when less than 1 minute remaining
  if (variant === 'game' && totalSeconds < 60) {
    return `${String(seconds).padStart(2, '0')}.${tenths}`;
  }

  // Standard format without leading zero on minutes
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export type CountdownTimerProps = {
  seconds: number;
  /** Shown above the digits (e.g. "Home penalty"). */
  label?: string;
  /** 'game' = main clock size; 'penalty' = slightly smaller for side timers. */
  variant?: 'game' | 'penalty';
  className?: string;
  /** Unique identifier for the input element. */
  inputId?: string;
  /** Click handler for making timer editable or toggling edit mode. */
  onClick?: () => void;
};

export default function CountdownTimer({
  seconds,
  label,
  variant = 'game',
  className = '',
  inputId,
  onClick,
}: CountdownTimerProps) {
  const rootClass = [
    'countdown-timer',
    variant === 'penalty' && 'countdown-timer--penalty',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      {label ? <div className='countdown-timer__label'>{label}</div> : null}
      <input
        id={inputId}
        type='text'
        className='time-display'
        aria-label={
          label
            ? `${label}: ${formatTime(Math.max(0, seconds), variant)}`
            : undefined
        }
        value={formatTime(Math.max(0, seconds), variant)}
        readOnly
        onClick={onClick}
      />
    </div>
  );
}
