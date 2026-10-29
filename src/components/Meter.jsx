export default function Meter({ value = 0, tone = 'accent', size = 'md', label, className = '' }) {
  const safe = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  return (
    <div
      className={`meter meter-${size} meter-${tone} ${className}`.trim()}
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={label || 'Progres'}
    >
      <span style={{ width: `${safe}%` }} />
    </div>
  );
}
