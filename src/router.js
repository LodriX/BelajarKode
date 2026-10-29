import { useEffect, useState } from 'react';

export function parseHash(hash = window.location.hash) {
  const raw = String(hash ?? '').replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean);
  return { path: parts[0] ?? '', segments: parts.slice(1) };
}

export function navigate(path = '') {
  const clean = String(path).replace(/^#?\/?/, '');
  const next = `#/${clean}`;
  if (window.location.hash !== next) window.location.hash = next;
  else window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash());
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
