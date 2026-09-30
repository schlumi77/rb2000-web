# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repository.

## Project

**RB2000 Web** is a mobile-first React web app for **semi-closed rebreather (SCR)** diving calculations — a port of the original RB2000 iOS app. It computes oxygen fractions, partial pressures, and gas density to support dive-planning safety. It is a pure client-side app (no backend); user settings persist to `localStorage`. Deployed to GitHub Pages at `https://<user>.github.io/rb2000-web/`.

## Commands

```bash
npm run dev      # start Vite dev server (default port 5173)
npm test         # run the Vitest suite (calculation logic)
npm run lint     # ESLint — keep clean, fix all warnings
npm run build    # tsc -b && vite build (type-check + production build)
npm run preview  # preview the production build locally
```

Run `npm test` and `npm run lint` before considering a change done. `npm run build` also type-checks.

## Tech stack

React 19 · TypeScript (strict) · Vite · Recharts (charts) · Lucide React (icons) · Vanilla CSS (variables, no framework) · Vitest.

## Architecture

- **All math lives in [`src/utils/calculations.ts`](src/utils/calculations.ts)** and must stay there — pure, side-effect-free functions with no React/DOM dependencies. It is the single source of truth for constants (`CONSTANTS`), defaults (`DEFAULT_PARAMS`), and the two algorithm variants (`Standard` and `Aspacher`).
- Every calculation function is covered by [`src/utils/calculations.test.ts`](src/utils/calculations.test.ts). Add/adjust tests whenever you touch the math.
- **State** is React Context — [`src/context/SettingsContext.tsx`](src/context/SettingsContext.tsx) holds units and physiological/system params (`amv`, `ke`, `kr`, `v`, `freq`, `pSurf`, `dpdt`, `algorithm`) and persists them to `localStorage`.
- **Views** live in `src/views/` and are switched by a simple `currentView` state in [`src/App.tsx`](src/App.tsx) (no router): `FO2SteadyState`, `FO2TimeSim` (lazy-loaded — pulls in Recharts), `FO2Min`, `GasDensity`, `Settings`. Navigation is [`src/components/Navigation.tsx`](src/components/Navigation.tsx).
- **Shared input UI** is in `src/components/`: [`SliderRow`](src/components/SliderRow.tsx) (labelled slider with −/+ stepper buttons) and [`DepthSlider`](src/components/DepthSlider.tsx) (unit-aware depth input built on `SliderRow`). Reuse these for new numeric inputs.

## Conventions

- **Units:** internal logic is always **metric** (metres, bar). Convert to/from Imperial (feet, ata) only in the UI layer — see `DepthSlider` for the pattern. The app supports both unit systems.
- **Depth limit:** 200 m.
- **TypeScript:** strict typing; avoid `any`.
- **Styling:** vanilla CSS with theme variables (`--primary-color`, `--card-bg`, etc. in [`src/index.css`](src/index.css)); support light and dark mode via `prefers-color-scheme`. UI is card-based and mobile-first.
- **Safety limits** (in `CONSTANTS`): pO₂ 0.16–1.60, gas density < 5.2 g/l. Values outside limits are shown with `--danger-color`.

## Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main`. The Vite `base` in [`vite.config.ts`](vite.config.ts) must stay `/rb2000-web/` for asset paths to resolve on the Pages sub-path. The app is also a PWA (installable, with an `apple-touch-icon` for iOS home-screen).

## Notes

- This is a diving-safety tool. Be conservative with the calculation logic; when in doubt about a formula, ask rather than guess.
- `GEMINI.md` covers the same ground for other agents — keep the two roughly in sync when project conventions change.
