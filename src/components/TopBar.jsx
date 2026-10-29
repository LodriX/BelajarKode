import { useEffect, useRef, useState } from 'react';
import { lessonById, moduleById } from '../data/curriculum.js';
import { ROUTE_LABELS } from '../lib/constants.js';
import { useApp } from '../state/AppStore.jsx';
import { navigate, useRoute } from '../router.js';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';

function breadcrumbFor(route) {
  if (route.path === 'lesson') {
    const lesson = lessonById.get(route.segments[0]);
    if (lesson) {
      const module = moduleById.get(lesson.moduleId);
      return `${module?.title ?? 'Modul'} / ${lesson.title}`;
    }
  }
  if (route.path === 'module' || (route.path === 'modules' && route.segments[0])) {
    const module = moduleById.get(route.segments[0]);
    if (module) return `Modul / ${module.title}`;
  }
  return ROUTE_LABELS[route.path] ?? 'Beranda';
}

export default function TopBar({ onMenu, onSearch }) {
  const { profile, level, logout } = useApp();
  const route = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="icon-btn menu-btn" onClick={onMenu} aria-label="Buka menu">
          <Icon name="menu" size={20} />
        </button>
        <span className="topbar-crumb">{breadcrumbFor(route)}</span>
      </div>

      <div className="topbar-right">
        <button type="button" className="search-trigger" onClick={onSearch} aria-label="Cari materi">
          <Icon name="search" size={16} />
          <span>Cari materi</span>
          <kbd>/</kbd>
        </button>

        <div className="profile-menu" ref={menuRef}>
          <button
            type="button"
            className="profile-trigger"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <Avatar name={profile?.name} color={profile?.color} size="sm" guest={profile?.guest} />
            <span className="profile-meta">
              <strong>{profile?.name}</strong>
              <small>Jenjang {String(level.level).padStart(2, '0')}</small>
            </span>
            <span className="sr-only">Menu profil</span>
            <Icon name="chevronRight" size={14} className={menuOpen ? 'rot-90' : ''} />
          </button>
          {menuOpen && (
            <div className="profile-dropdown" role="menu">
              <div className="profile-dropdown-head">
                <span>{profile?.name}</span>
                <small>
                  {level.name} ·{' '}
                  {level.remaining
                    ? `${level.remaining} poin ke jenjang berikutnya`
                    : 'jenjang tertinggi'}
                </small>
              </div>
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); navigate('settings'); }}>
                <Icon name="settings" size={16} /> Pengaturan
              </button>
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); navigate('achievements'); }}>
                <Icon name="trophy" size={16} /> Pencapaian
              </button>
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); logout(); }}>
                <Icon name="logout" size={16} /> Ganti profil
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
