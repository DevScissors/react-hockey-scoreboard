import './CountdownTimer.css';

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export type CountdownTimerProps = {
  seconds: number;
  /** Shown above the digits (e.g. "Home penalty"). */
  label?: string;
  /** 'game' = main clock size; 'penalty' = slightly smaller for side timers. */
  variant?: 'game' | 'penalty';
  className?: string;
};

export default function CountdownTimer({
  seconds,
  label,
  variant = 'game',
  className = '',
}: CountdownTimerProps) {
  const rootClass = ['countdown-timer', variant === 'penalty' && 'countdown-timer--penalty', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      {label ? <div className='countdown-timer__label'>{label}</div> : null}
      <div className='time-display' aria-label={label ? `${label}: ${formatTime(Math.max(0, seconds))}` : undefined}>
        {formatTime(Math.max(0, seconds))}
      </div>
    </div>
  );
}
