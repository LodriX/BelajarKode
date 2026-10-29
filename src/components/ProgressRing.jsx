export default function ProgressRing({
  value = 0,
  size = 112,
  stroke = 9,
  label = 'Progres',
  tone = 'accent',
}) {
  const safe = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;

  return (
    <svg
      className={`progress-ring progress-ring-${tone}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${label}: ${safe}%`}
    >
      <circle
        className="progress-ring-track"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
      />
      <circle
        className="progress-ring-value"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        className="progress-ring-text"
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
      >
        {safe}%
      </text>
    </svg>
  );
}
