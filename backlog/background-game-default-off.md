# Background Game — Default to Off

## 1. Business need

**As a first-time visitor, I want the background game animation to stay off until I choose to turn it on, so the workspace isn't visually noisy before I've opted into the easter egg.**

Today, anyone with no `animation-theme` value in `localStorage` — every brand-new visitor, or anyone who clears their browser storage — sees the "Angels & Devils" animation immediately on load. The feature is opt-out rather than opt-in. Flipping the default to `off` makes the background game something a maker discovers and enables deliberately via the FAB, rather than something imposed on first visit.

## 2. Technical specification

**Scope: frontend only.** No backend, no API, no feature flag. Only the fallback value used when no theme preference has been saved yet changes; persistence behavior is untouched.

**Where the default is set** (the same fallback is duplicated in two places and both must change together):

1. `frontend/src/app.tsx` (`BackgroundGameFab` state init, ~line 60-63):
   `useState<AnimationTheme>(() => { const v = localStorage.getItem('animation-theme'); return v === 'mammoths' || v === 'off' ? v : 'angels' })`
2. `frontend/src/crazy-background.ts` (~line 1909-1911), which mirrors the same logic to drive the actual canvas rendering on load:
   `const initial = saved === 'mammoths' || saved === 'off' ? saved : 'angels'; applyTheme(initial)`

**The change:** in both places, change the fallback branch from `'angels'` to `'off'`. `'mammoths'` and an explicit prior `'off'` continue to be honored exactly as before — this only changes what an unset/first-time preference resolves to.

**Persistence is unchanged.** `window.__setAnimationTheme` (`crazy-background.ts:1901-1903`) still writes every explicit selection to `localStorage['animation-theme']`, so a user who has already turned the animation on (or off) keeps seeing their own choice on return visits. This change only affects visitors with no saved preference.

**Likely files:**

- `frontend/src/app.tsx` — state init fallback
- `frontend/src/crazy-background.ts` — initial theme fallback
- `specs/features/make/Animation.Preferences.feature` — add the scenario below
- `specs/src/steps/animation.ts` / `specs/src/pages/app-page.ts` — no new step definitions expected; the scenario reuses the existing "background animation is not visible" assertion

## 3. Acceptance scenario

```gherkin
Scenario: Background animation is off by default
  Given I am on the home page
  Then the background animation is not visible
```

This scenario relies on a fresh browser context (no prior `animation-theme` value), which Playwright provides per-scenario by default — no explicit "clear storage" step is needed.

### Action items

- Change the fallback in `frontend/src/app.tsx` from `'angels'` to `'off'`.
- Change the matching fallback in `frontend/src/crazy-background.ts` from `'angels'` to `'off'`.
- Add the "off by default" scenario to `Animation.Preferences.feature`.
