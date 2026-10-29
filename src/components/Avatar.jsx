export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'BK';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Avatar({ name, color = '#6EE7B7', size = 'md', guest = false }) {
  return (
    <span
      className={`avatar avatar-${size} ${guest ? 'avatar-guest' : ''}`.trim()}
      style={{ '--avatar': color }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
