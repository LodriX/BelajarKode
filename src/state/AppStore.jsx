import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { lessonById } from '../data/curriculum.js';
import { buildBackup, backupFilename, parseBackup } from '../lib/backup.js';
import { BADGES } from '../lib/badges.js';
import { levelForXp } from '../lib/constants.js';
import { todayKey } from '../lib/dates.js';
import { hashPin, KDF_ITERATIONS, MAX_ATTEMPTS, createSalt, validatePin, verifyPin } from '../lib/auth.js';
import { reconcile } from '../lib/reconcile.js';
import {
  DEFAULT_LAB,
  KEYS,
  clearLegacyState,
  createProfileRecord,
  defaultState,
  deleteState,
  getSessionProfileId,
  loadProfiles,
  loadState,
  readLegacyState,
  saveProfiles,
  saveState,
  setSessionProfileId,
  clearSession,
  storageAvailable,
} from '../lib/storage.js';
import { SETUP_ITEMS, setupProgress } from '../lib/setup.js';
import { computeStreak, dailyQuests, recordLabDay, recordLessonDay, recordQuizDay } from '../lib/streak.js';

const AppContext = createContext(null);

const clone = (value) => JSON.parse(JSON.stringify(value));
const sumXp = (state) => Object.values(state?.xp ?? {}).reduce((total, value) => total + (Number(value) || 0), 0);

function messageForLock(profile) {
  if (!profile?.lockedUntil) return null;
  const remaining = new Date(profile.lockedUntil).getTime() - Date.now();
  if (remaining <= 0) return null;
  return Math.ceil(remaining / 1000);
}

export function AppProvider({ children }) {
  const [profiles, setProfiles] = useState(() => loadProfiles());
  const [profile, setProfile] = useState(null);
  const [state, setState] = useState(defaultState);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [levelUp, setLevelUp] = useState(null);
  const [legacy, setLegacy] = useState(null);
  const [storageOk, setStorageOk] = useState(true);
  const stateRef = useRef(state);
  const profileRef = useRef(profile);
  const booted = useRef(false);

  const notify = useCallback((message, kind = 'info') => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((list) => [...list, { id, message, kind }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const loadProfileState = useCallback((nextProfile) => {
    const loaded = loadState(nextProfile.id);
    reconcile(loaded);
    saveState(nextProfile.id, loaded);
    stateRef.current = loaded;
    profileRef.current = nextProfile;
    setState(loaded);
    setProfile(nextProfile);
  }, []);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    setStorageOk(storageAvailable());
    const storedProfiles = loadProfiles();
    setProfiles(storedProfiles);
    setLegacy(readLegacyState());

    const sessionId = getSessionProfileId();
    const sessionProfile = storedProfiles.find((item) => item.id === sessionId);
    if (sessionProfile) loadProfileState(sessionProfile);
    setReady(true);
  }, [loadProfileState]);

  useEffect(() => {
    document.documentElement.dataset.appearance = state.settings?.appearance ?? 'nyaman';
    document.documentElement.dataset.contrast = state.settings?.contrast ?? 'normal';
    document.documentElement.dataset.motion = state.settings?.motion ?? 'system';
  }, [state.settings?.appearance, state.settings?.contrast, state.settings?.motion]);

  const update = useCallback(
    (mutator, options = {}) => {
      const currentProfile = profileRef.current;
      if (!currentProfile) return { xpGain: 0, newBadges: [] };
      const before = stateRef.current;
      const beforeXp = sumXp(before);
      const beforeLevel = levelForXp(beforeXp);
      const next = clone(before);
      mutator(next);
      const { newBadges } = reconcile(next);
      const afterXp = sumXp(next);
      const afterLevel = levelForXp(afterXp);
      stateRef.current = next;
      setState(next);
      saveState(currentProfile.id, next);

      const knownBadges = newBadges.map((id) => BADGES.find((badge) => badge.id === id)).filter(Boolean);
      for (const badge of knownBadges) {
        notify(`Lencana terbuka · ${badge.title}`, 'badge');
      }
      if (afterLevel.level > beforeLevel.level) {
        setLevelUp({
          level: afterLevel.level,
          name: afterLevel.name,
          xp: afterXp,
          gain: afterXp - beforeXp,
        });
      }
      const xpGain = afterXp - beforeXp;
      if (options.announce && xpGain !== 0) {
        notify(`${xpGain > 0 ? '+' : ''}${xpGain} poin`, xpGain > 0 ? 'xp' : 'info');
      }
      return { xpGain, newBadges, level: afterLevel };
    },
    [notify],
  );

  const persistProfiles = useCallback((nextProfiles) => {
    saveProfiles(nextProfiles);
    setProfiles(nextProfiles);
  }, []);

  const login = useCallback(
    async (profileId, pin, remember = false) => {
      const found = profiles.find((item) => item.id === profileId);
      if (!found) return { ok: false, error: 'Profil tidak ditemukan.' };
      const lockSeconds = messageForLock(found);
      if (lockSeconds) {
        return { ok: false, error: `Terkunci. Coba lagi dalam ${lockSeconds} detik.` };
      }
      setBusy(true);
      try {
        if (!found.guest) {
          const spawnedAt = Date.now();
          const valid = await verifyPin(pin, found);
          if (!valid) {
            const failedAttempts = (found.failedAttempts ?? 0) + 1;
            const locked = failedAttempts >= MAX_ATTEMPTS;
            const updated = profiles.map((item) =>
              item.id === found.id
                ? {
                    ...item,
                    failedAttempts: locked ? 0 : failedAttempts,
                    lockedUntil: locked ? new Date(Date.now() + 30_000).toISOString() : null,
                  }
                : item,
            );
            persistProfiles(updated);
            // Jeda singkat agar percobaan tebak PIN tidak instan.
            await new Promise((resolve) => window.setTimeout(resolve, Math.min(400, 120 + (Date.now() - spawnedAt) * 0.1)));
            return {
              ok: false,
              error: locked ? 'Terlalu banyak percobaan. Profil terkunci 30 detik.' : 'PIN tidak tepat.',
            };
          }
        }
        const updated = profiles.map((item) =>
          item.id === found.id
            ? { ...item, failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date().toISOString() }
            : item,
        );
        persistProfiles(updated);
        setSessionProfileId(found.id, remember);
        loadProfileState({ ...found, failedAttempts: 0, lockedUntil: null });
        return { ok: true };
      } finally {
        setBusy(false);
      }
    },
    [loadProfileState, persistProfiles, profiles],
  );

  const createProfile = useCallback(
    async ({ name, pin, guest = false, importLegacy = false, color }) => {
      const cleanName = String(name ?? '').trim();
      if (cleanName.length < 2) return { ok: false, error: 'Nama minimal 2 karakter.' };
      if (cleanName.length > 24) return { ok: false, error: 'Nama maksimal 24 karakter.' };
      if (!guest) {
        const pinError = validatePin(pin);
        if (pinError) return { ok: false, error: pinError };
      }
      setBusy(true);
      try {
        let salt = null;
        let hash = null;
        let iterations = null;
        if (!guest) {
          salt = createSalt();
          iterations = KDF_ITERATIONS;
          hash = await hashPin(pin, salt, iterations);
        }
        const record = createProfileRecord({ name: cleanName, salt, hash, iterations, guest, color });
        const nextProfiles = [...profiles, record];
        persistProfiles(nextProfiles);
        let nextState = defaultState();
        if (importLegacy && legacy) {
          nextState = clone(legacy);
          clearLegacyState();
          setLegacy(null);
        }
        reconcile(nextState);
        saveState(record.id, nextState);
        setSessionProfileId(record.id, true);
        stateRef.current = nextState;
        profileRef.current = record;
        setState(nextState);
        setProfile(record);
        return { ok: true, profile: record };
      } catch {
        return { ok: false, error: 'Gagal membuat profil. Penyimpanan browser mungkin penuh.' };
      } finally {
        setBusy(false);
      }
    },
    [legacy, persistProfiles, profiles],
  );

  const logout = useCallback(() => {
    clearSession();
    profileRef.current = null;
    setProfile(null);
    stateRef.current = defaultState();
    setState(defaultState());
    setLevelUp(null);
  }, []);

  const deleteProfile = useCallback(
    (profileId) => {
      const nextProfiles = profiles.filter((item) => item.id !== profileId);
      persistProfiles(nextProfiles);
      deleteState(profileId);
      if (profileRef.current?.id === profileId) logout();
    },
    [logout, persistProfiles, profiles],
  );

  const restoreLegacy = useCallback(() => {
    if (!legacy) return;
    update((next) => {
      for (const key of Object.keys(next)) delete next[key];
      Object.assign(next, clone(legacy));
    });
    clearLegacyState();
    setLegacy(null);
    notify('Progres lama dipulihkan.');
  }, [legacy, notify, update]);

  const openInLab = useCallback(
    (mode, code) => {
      update((next) => {
        next.labMode = ['js', 'html', 'json'].includes(mode) ? mode : 'js';
        next.labCode = String(code ?? '').slice(0, 150_000);
      });
    },
    [update],
  );

  const setProfilePin = useCallback(
    async (pin) => {
      const current = profileRef.current;
      if (!current) return { ok: false, error: 'Tidak ada profil aktif.' };
      const pinError = validatePin(pin);
      if (pinError) return { ok: false, error: pinError };
      setBusy(true);
      try {
        const salt = createSalt();
        const hash = await hashPin(pin, salt, KDF_ITERATIONS);
        const nextProfiles = profiles.map((item) =>
          item.id === current.id
            ? { ...item, guest: false, salt, hash, iterations: KDF_ITERATIONS, failedAttempts: 0, lockedUntil: null }
            : item,
        );
        persistProfiles(nextProfiles);
        const updated = {
          ...current,
          guest: false,
          salt,
          hash,
          iterations: KDF_ITERATIONS,
          failedAttempts: 0,
          lockedUntil: null,
        };
        profileRef.current = updated;
        setProfile(updated);
        notify('PIN aktif. Profil sekarang terkunci di perangkat ini.');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Gagal mengaktifkan PIN.' };
      } finally {
        setBusy(false);
      }
    },
    [notify, persistProfiles, profiles],
  );

  const renameProfile = useCallback(
    (name) => {
      const current = profileRef.current;
      if (!current) return;
      const clean = String(name ?? '').trim().slice(0, 24);
      if (clean.length < 2) return;
      const nextProfiles = profiles.map((item) => (item.id === current.id ? { ...item, name: clean } : item));
      persistProfiles(nextProfiles);
      profileRef.current = { ...current, name: clean };
      setProfile((value) => (value ? { ...value, name: clean } : value));
    },
    [persistProfiles, profiles],
  );

  const completeLesson = useCallback(
    (lessonId) => {
      if (!lessonById.has(lessonId)) return;
      const wasDone = stateRef.current.completed.includes(lessonId);
      const result = update((next) => {
        if (wasDone) {
          next.completed = next.completed.filter((id) => id !== lessonId);
        } else {
          next.completed = [lessonId, ...next.completed];
          recordLessonDay(next, lessonId);
        }
        next.history = [lessonId, ...next.history.filter((id) => id !== lessonId)].slice(0, 30);
      });
      if (wasDone) notify('Status selesai dibatalkan.');
      else notify(result.xpGain > 0 ? `Pelajaran selesai · +${result.xpGain} poin` : 'Pelajaran ditandai selesai.', 'xp');
    },
    [notify, update],
  );

  const answerQuiz = useCallback(
    (lessonId, questionId, choice) => {
      const lesson = lessonById.get(lessonId);
      const question = lesson?.quiz?.questions?.find((item) => item.id === questionId);
      if (!lesson || !question) return { correct: false, complete: false };
      const existing = stateRef.current.quizzes[lessonId];
      if (existing?.answers?.[questionId]?.correct) {
        return { correct: true, complete: Boolean(existing.correct) };
      }
      const selected = Number(choice);
      const correct = selected === question.answer;
      const priorAnswers = existing?.answers ?? {};
      const willComplete = lesson.quiz.questions.every((item) =>
        item.id === questionId ? correct : priorAnswers[item.id]?.correct,
      );
      update((next) => {
        const previous = next.quizzes[lessonId];
        const previousAnswer = previous?.answers?.[questionId];
        const answers = {
          ...(previous?.answers ?? {}),
          [questionId]: {
            choice: selected,
            correct,
            attempts: (previousAnswer?.attempts ?? 0) + 1,
          },
        };
        const complete = lesson.quiz.questions.every((item) => answers[item.id]?.correct);
        next.quizzes[lessonId] = {
          answers,
          correct: complete,
          attempts: Math.max(...Object.values(answers).map((answer) => answer.attempts)),
        };
        if (correct) recordQuizDay(next, lessonId);
      });
      return { correct, complete: willComplete };
    },
    [update],
  );

  const toggleBookmark = useCallback(
    (lessonId) => {
      const has = stateRef.current.bookmarks.includes(lessonId);
      update((next) => {
        next.bookmarks = has
          ? next.bookmarks.filter((id) => id !== lessonId)
          : [lessonId, ...next.bookmarks];
      });
      notify(has ? 'Materi dihapus dari tersimpan.' : 'Pelajaran disimpan.');
    },
    [notify, update],
  );

  const markSectionRead = useCallback(
    (lessonId, sectionId) => {
      const lesson = lessonById.get(lessonId);
      if (!lesson?.sections?.some((section) => section.id === sectionId)) return;
      const current = stateRef.current.reading?.[lessonId]?.sections ?? [];
      if (current.includes(sectionId)) return;
      update((next) => {
        next.reading ??= {};
        const previous = next.reading[lessonId] ?? { sections: [], updatedAt: null };
        next.reading[lessonId] = {
          sections: [...new Set([...previous.sections, sectionId])],
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [update],
  );

  const setSetupPlatform = useCallback(
    (platform) => {
      if (!['windows', 'macos', 'linux'].includes(platform)) return;
      update((next) => {
        next.setup ??= { platform: 'windows', completed: [], startedAt: null, readyAt: null };
        next.setup.platform = platform;
        next.setup.startedAt ??= new Date().toISOString();
      });
    },
    [update],
  );

  const toggleSetupItem = useCallback(
    (itemId) => {
      if (!SETUP_ITEMS.some((item) => item.id === itemId)) return;
      update((next) => {
        next.setup ??= { platform: 'windows', completed: [], startedAt: null, readyAt: null };
        const has = next.setup.completed.includes(itemId);
        next.setup.completed = has
          ? next.setup.completed.filter((id) => id !== itemId)
          : [...next.setup.completed, itemId];
        next.setup.startedAt ??= new Date().toISOString();
        next.setup.readyAt =
          next.setup.completed.length >= SETUP_ITEMS.length ? new Date().toISOString() : null;
      });
    },
    [update],
  );

  const setNote = useCallback(
    (lessonId, value) => {
      update((next) => {
        const text = String(value ?? '').slice(0, 10_000);
        if (text) next.notes[lessonId] = text;
        else delete next.notes[lessonId];
      });
    },
    [update],
  );

  const visitLesson = useCallback(
    (lessonId) => {
      if (!lessonById.has(lessonId)) return;
      if (stateRef.current.history[0] === lessonId) return;
      update((next) => {
        next.history = [lessonId, ...next.history.filter((id) => id !== lessonId)].slice(0, 30);
      });
    },
    [update],
  );

  const setLabMode = useCallback(
    (mode) => {
      update((next) => {
        if (!['js', 'html', 'json'].includes(mode)) return;
        next.labMode = mode;
        next.labCode = DEFAULT_LAB[mode];
      });
    },
    [update],
  );

  const setLabCode = useCallback(
    (code) => {
      update((next) => {
        next.labCode = String(code ?? '').slice(0, 150_000);
      });
    },
    [update],
  );

  const recordLabRun = useCallback(() => {
    update((next) => recordLabDay(next));
  }, [update]);

  const setDailyGoal = useCallback(
    (goal) => {
      update((next) => {
        next.dailyGoal = Math.max(1, Math.min(5, Number(goal) || 1));
      });
    },
    [update],
  );

  const setSettings = useCallback(
    (patch) => {
      update((next) => {
        next.settings = { ...next.settings, ...patch };
      });
    },
    [update],
  );

  const resetProgress = useCallback(() => {
    update((next) => {
      const fresh = defaultState();
      for (const key of Object.keys(next)) delete next[key];
      Object.assign(next, fresh);
    });
    notify('Progres di perangkat ini dihapus.');
  }, [notify, update]);

  const exportBackup = useCallback(() => {
    const currentProfile = profileRef.current;
    if (!currentProfile) return null;
    const payload = buildBackup(currentProfile, stateRef.current);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const filename = backupFilename();
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    update((next) => {
      next.lastBackupAt = new Date().toISOString();
    });
    notify('Cadangan berhasil diunduh.');
    return filename;
  }, [notify, update]);

  const importBackup = useCallback(
    async (file) => {
      if (!file) return { ok: false, error: 'Tidak ada berkas.' };
      if (file.size > 2_000_000) return { ok: false, error: 'Ukuran berkas cadangan melebihi 2 MB.' };
      try {
        const text = await file.text();
        const parsed = parseBackup(text);
        update((next) => {
          for (const key of Object.keys(next)) delete next[key];
          Object.assign(next, parsed.state);
        });
        notify('Cadangan berhasil dipulihkan.');
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error.message || 'Berkas cadangan tidak dapat dibaca.' };
      }
    },
    [notify, update],
  );

  const dismissLegacy = useCallback(() => {
    clearLegacyState();
    setLegacy(null);
  }, []);

  const xp = sumXp(state);
  const level = levelForXp(xp);
  const streak = useMemo(() => computeStreak(state.activity), [state.activity]);
  const quests = useMemo(() => dailyQuests(state.activity?.[todayKey()]), [state.activity]);
  const badgeList = useMemo(
    () => BADGES.map((badge) => ({ ...badge, earnedAt: state.badges?.[badge.id] ?? null })),
    [state.badges],
  );
  const completedCount = useMemo(
    () => state.completed.filter((id) => lessonById.has(id)).length,
    [state.completed],
  );
  const setup = useMemo(() => setupProgress(state.setup?.completed), [state.setup?.completed]);

  const value = useMemo(
    () => ({
      ready,
      busy,
      profiles,
      profile,
      state,
      storageOk,
      legacy,
      toasts,
      levelUp,
      xp,
      level,
      streak,
      quests,
      badges: badgeList,
      completedCount,
      setup,
      hasSession: Boolean(profile),
      login,
      logout,
      createProfile,
      deleteProfile,
      renameProfile,
      completeLesson,
      answerQuiz,
      toggleBookmark,
      markSectionRead,
      setSetupPlatform,
      toggleSetupItem,
      setNote,
      visitLesson,
      setLabMode,
      setLabCode,
      recordLabRun,
      setDailyGoal,
      setSettings,
      setProfilePin,
      resetProgress,
      exportBackup,
      importBackup,
      restoreLegacy,
      openInLab,
      dismissLegacy,
      dismissToast,
      dismissLevelUp: () => setLevelUp(null),
      notify,
    }),
    [
      answerQuiz,
      badgeList,
      busy,
      completeLesson,
      completedCount,
      createProfile,
      deleteProfile,
      dismissLegacy,
      dismissToast,
      exportBackup,
      importBackup,
      legacy,
      level,
      levelUp,
      login,
      logout,
      markSectionRead,
      notify,
      openInLab,
      profile,
      profiles,
      quests,
      ready,
      recordLabRun,
      renameProfile,
      resetProgress,
      restoreLegacy,
      setDailyGoal,
      setLabCode,
      setLabMode,
      setNote,
      setProfilePin,
      setSettings,
      setSetupPlatform,
      setup,
      state,
      toggleSetupItem,
      storageOk,
      streak,
      toasts,
      toggleBookmark,
      visitLesson,
      xp,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp harus dipakai di dalam AppProvider');
  return context;
}

export { KEYS };

