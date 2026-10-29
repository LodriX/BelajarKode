import { totalLessons } from '../data/curriculum.js';
import { ROUTES } from '../lib/constants.js';
import { useApp } from '../state/AppStore.jsx';
import { useRoute } from '../router.js';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import Meter from './Meter.jsx';

const GROUPS = ['Belajar', 'Latihan', 'Profil'];

export default function Rail({ open, onClose }) {
  const { profile, level, xp, completedCount, logout } = useApp();
  const route = useRoute();
  const activePath = route.path === 'module' || route.path === 'lesson' ? 'modules' : route.path;

  return (
    <aside className={`rail ${open ? 'is-open' : ''}`.trim()} aria-label="Navigasi utama">
      <div className="rail-brand">
        <span className="brand-mark" aria-hidden="true">
          {'</>'}
        </span>
        <span className="brand-text">
          <strong>BelajarKode</strong>
          <small>RUANG KERJA</small>
        </span>
        <button type="button" className="rail-close" onClick={onClose} aria-label="Tutup menu">
          <Icon name="close" size={18} />
        </button>
      </div>

      <nav className="rail-nav">
        {GROUPS.map((group) => (
          <div className="rail-group" key={group}>
            <p className="rail-label">{group}</p>
            {ROUTES.filter((item) => item.group === group).map((item) => (
              <a
                key={item.path || 'base'}
                href={`#/${item.path}`}
                className={`rail-link ${activePath === item.path ? 'is-active' : ''}`.trim()}
                onClick={onClose}
                aria-current={activePath === item.path ? 'page' : undefined}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
              </a>
            ))}
            {group === 'Belajar' && (
              <a
                className="rail-link"
                href="buku-belajarkode.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="book" size={18} />
                <span>Buku offline</span>
                <Icon name="external" size={13} className="rail-external" />
              </a>
            )}
          </div>
        ))}
      </nav>

      <div className="rail-footer">
        <a className="rail-profile" href="#/settings" onClick={onClose}>
          <Avatar name={profile?.name} color={profile?.color} size="sm" guest={profile?.guest} />
          <span>
            <strong>{profile?.name}</strong>
            <small>
              Jenjang {level.level} · {level.name}
            </small>
          </span>
          <Icon name="settings" size={16} />
        </a>
        <Meter value={level.progress * 100} size="sm" label="Progres jenjang" />
        <div className="rail-stats">
          <span>{completedCount}/{totalLessons} pelajaran</span>
          <span>{xp.toLocaleString('id-ID')} poin</span>
        </div>
        <button type="button" className="rail-switch" onClick={logout}>
          <Icon name="logout" size={15} />
          Ganti profil
        </button>
      </div>
    </aside>
  );
}
