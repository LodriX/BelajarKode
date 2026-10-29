import { buildContext, evaluateBadges } from './badges.js';
import { computeStreak } from './streak.js';
import { computeXp } from './xp.js';

export function reconcile(state, now = new Date().toISOString()) {
  state.activity ??= {};
  state.milestones ??= [];
  state.badges ??= {};

  const streak = computeStreak(state.activity);
  if (streak >= 7 && !state.milestones.includes('streak-7')) state.milestones.push('streak-7');
  if (streak >= 30 && !state.milestones.includes('streak-30')) state.milestones.push('streak-30');

  state.xp = computeXp(state);
  const context = buildContext(state, streak);
  const newBadges = [];
  for (const id of evaluateBadges(context)) {
    if (!state.badges[id]) {
      state.badges[id] = now;
      newBadges.push(id);
    }
  }
  state.updatedAt = now;
  return { streak, context, newBadges };
}
