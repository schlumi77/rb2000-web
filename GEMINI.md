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
- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Vanilla CSS (CSS Variables)
- **State Management:** React Context (Settings, Units, Parameters)
- **Testing:** Vitest
- **Deployment:** GitHub Actions to GitHub Pages

## Building and Running

### Development
```bash
npm install
npm run dev
```

### Testing
```bash
npm test
```

### Production Build
```bash
npm run build
npm run lint
```

## Development Conventions

### Architecture
- **Logic Separation:** All mathematical models are localized in `src/utils/calculations.ts`.
- **Pure Functions:** Calculation utilities must remain pure and fully tested in `calculations.test.ts`.
- **State:** Physiological parameters (RMV, $K_e$, etc.) are managed via `SettingsContext` and persisted to `localStorage`.
- **Responsivity:** The UI follows a mobile-first design pattern using a card-based layout.

### Technical Standards
- **TypeScript:** Strict typing is required. Avoid `any`.
- **Linting:** Adhere to the ESLint configuration. Fix all warnings before deployment.
- **Units:** The system supports both Metric and Imperial units. Internal logic should stay in metric (meters, bar), with conversions handled in the UI layer.
- **Depth Limit:** The application supports depths up to **200m**.

## Deployment Details
- **GitHub Pages:** Deployed at `https://<user>.github.io/rb2000-web/`.
- **Vite Base:** The `base` config in `vite.config.ts` must be set to `/rb2000-web/`.
- **CI/CD:** The `.github/workflows/deploy.yml` handles automatic builds and artifact uploads from the repository root.
