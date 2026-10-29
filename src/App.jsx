import { useEffect, useState } from 'react';
import Rail from './components/Rail.jsx';
import TopBar from './components/TopBar.jsx';
import SearchDialog from './components/SearchDialog.jsx';
import { LevelUp, Toasts } from './components/Feedback.jsx';
import { useRoute } from './router.js';
import { useApp } from './state/AppStore.jsx';
import { curriculum } from './data/curriculum.js';
import { formatDate } from './lib/dates.js';
import LoginScreen from './screens/LoginScreen.jsx';
import StartScreen from './screens/StartScreen.jsx';
import BaseScreen from './screens/BaseScreen.jsx';
import PathScreen from './screens/PathScreen.jsx';
import ModulesScreen from './screens/ModulesScreen.jsx';
import ModuleScreen from './screens/ModuleScreen.jsx';
import LessonScreen from './screens/LessonScreen.jsx';
import LabScreen from './screens/LabScreen.jsx';
import LexiconScreen from './screens/LexiconScreen.jsx';
import SavedScreen from './screens/SavedScreen.jsx';
import AchievementsScreen from './screens/AchievementsScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import NotFound from './screens/NotFound.jsx';

function Screen() {
  const route = useRoute();
  switch (route.path) {
    case '':
      return <BaseScreen />;
    case 'mulai':
      return <StartScreen />;
    case 'path':
      return <PathScreen />;
    case 'modules':
      return route.segments[0] ? (
        <ModuleScreen moduleId={route.segments[0]} />
      ) : (
        <ModulesScreen />
      );
    case 'module':
      return <ModuleScreen moduleId={route.segments[0]} />;
    case 'lesson':
      return <LessonScreen lessonId={route.segments[0]} />;
    case 'lab':
      return <LabScreen />;
    case 'lexicon':
      return <LexiconScreen />;
    case 'saved':
      return <SavedScreen />;
    case 'achievements':
      return <AchievementsScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <NotFound />;
  }
}

function Shell() {
  const [railOpen, setRailOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      const tag = document.activeElement?.tagName;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setRailOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Langsung ke konten
      </a>
      <Rail open={railOpen} onClose={() => setRailOpen(false)} />
      {railOpen && (
        <button
          type="button"
          className="rail-backdrop"
          aria-label="Tutup menu"
          onClick={() => setRailOpen(false)}
        />
      )}
      <div className="app-main">
        <TopBar onMenu={() => setRailOpen(true)} onSearch={() => setSearchOpen(true)} />
        <main id="main-content" className="app-content" tabIndex={-1}>
          <Screen />
        </main>
        <footer className="app-footer">
          <span>BelajarKode v{curriculum.version} · materi {formatDate(curriculum.updated)}</span>
          <span>Progres lokal · unduh cadangan untuk pindah perangkat</span>
        </footer>
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toasts />
      <LevelUp />
    </div>
  );
}

function Boot() {
  return (
    <div className="boot">
      <span className="brand-mark brand-mark-lg" aria-hidden="true">{'</>'}</span>
      <p>Menyiapkan ruang kerja…</p>
    </div>
  );
}

export default function App() {
  const { ready, profile } = useApp();

  if (!ready) return <Boot />;
  if (!profile) {
    return (
      <>
        <LoginScreen />
        <Toasts />
      </>
    );
  }
  return <Shell />;
}
