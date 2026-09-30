# GEMINI.md - RB2000 Web

This file provides context and instructions for AI agents working on the RB2000 Web project.

## Project Overview
**RB2000 Web** is a modern, reactive web application designed for rebreather diving calculations (specifically semi-closed systems). It is a migration of a legacy iOS application to a web-based platform.

### Core Functionality
- **Steady State $fO_2$:** Calculates equilibrium gas mixtures.
- **Time-based Simulation:** Predicts breathing loop gas changes over time (using Recharts).
- **Minimum $fO_2$:** Determines required supply gas for target $pO_2$.
- **Gas Density:** Computes Trimix/Nitrox density (safety limit < 5.2 g/l).
- **Multi-Algorithm Support:** Implements both "Standard" and "Aspacher" calculation models.

### Technology Stack
- **Framework:** React 19 (TypeScript, strict)
- **Build Tool:** Vite
- **Charts:** Recharts
- **Icons:** Lucide React
- **Styling:** Vanilla CSS (CSS Variables)
- **State Management:** React Context (Settings, Units, Parameters)
- **Testing:** Vitest
- **Deployment:** GitHub Actions to GitHub Pages

It is a pure client-side app (no backend); settings persist to `localStorage`. It is also an installable PWA with an `apple-touch-icon` for the iOS home screen.

## Building and Running

```bash
npm run dev      # start Vite dev server (default port 5173)
npm test         # run the Vitest suite (calculation logic)
npm run lint     # ESLint — keep clean, fix all warnings
npm run build    # tsc -b && vite build (type-check + production build)
npm run preview  # preview the production build locally
```

Run `npm test` and `npm run lint` before considering a change done; `npm run build` also type-checks.

## Development Conventions

### Architecture
- **Logic Separation:** All mathematical models are localized in `src/utils/calculations.ts` — pure, side-effect-free functions with no React/DOM dependencies. It is the single source of truth for constants (`CONSTANTS`), defaults (`DEFAULT_PARAMS`), and the two algorithm variants (`Standard` and `Aspacher`).
- **Pure Functions:** Calculation utilities must remain pure and fully tested in `calculations.test.ts`. Add or adjust tests whenever the math changes.
- **State:** Physiological/system parameters (`amv`, `ke`, `kr`, `v`, `freq`, `pSurf`, `dpdt`, `algorithm`) are managed via `SettingsContext` and persisted to `localStorage`.
- **Views:** Views live in `src/views/` and are switched by a simple `currentView` state in `src/App.tsx` (no router): `FO2SteadyState`, `FO2TimeSim` (lazy-loaded — pulls in Recharts), `FO2Min`, `GasDensity`, `Settings`. Navigation is `src/components/Navigation.tsx`.
- **Shared inputs:** Reuse `src/components/SliderRow.tsx` (labelled slider with −/+ stepper buttons) and `src/components/DepthSlider.tsx` (unit-aware depth input built on `SliderRow`) for new numeric inputs.
- **Responsivity:** The UI follows a mobile-first design pattern using a card-based layout.

### Technical Standards
- **TypeScript:** Strict typing is required. Avoid `any`.
- **Linting:** Adhere to the ESLint configuration. Fix all warnings before deployment.
- **Units:** The system supports both Metric and Imperial units. Internal logic should stay in metric (meters, bar), with conversions handled in the UI layer (see `DepthSlider` for the pattern).
- **Depth Limit:** The application supports depths up to **200m**.
- **Styling:** Vanilla CSS with theme variables (`--primary-color`, `--card-bg`, etc. in `src/index.css`); support light and dark mode via `prefers-color-scheme`.
- **Safety limits** (in `CONSTANTS`): pO₂ 0.16–1.60, gas density < 5.2 g/l. Values outside limits are shown with `--danger-color`. This is a diving-safety tool — be conservative with the calculation logic; when in doubt about a formula, ask rather than guess.

## Deployment Details
- **GitHub Pages:** Deployed at `https://<user>.github.io/rb2000-web/`.
- **Vite Base:** The `base` config in `vite.config.ts` must be set to `/rb2000-web/`.
- **CI/CD:** The `.github/workflows/deploy.yml` handles automatic builds and artifact uploads from the repository root.

---

_`CLAUDE.md` covers the same ground for Claude Code — keep the two roughly in sync when project conventions change._
