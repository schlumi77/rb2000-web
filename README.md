# RB2000 Web

A modern, reactive web application for rebreather diving calculations, ported from the original RB2000 iOS application.

## Overview

**RB2000 Web** is a specialized tool for semi-closed rebreather (SCR) divers. It provides critical safety calculations for oxygen concentrations, partial pressures, and gas density. The application is designed with a mobile-first, iOS-inspired interface for ease of use in the field.

## Key Features

- **Steady State fO2:** Calculate the equilibrium oxygen fraction ($fO_2$) and partial pressure ($pO_2$) at any depth.
- **Loop Simulation:** Visualize how the breathing loop gas changes over time when switching depths or supply gases using interactive charts.
- **Minimum fO2:** Determine the required supply gas to maintain a safe minimum $pO_2$ at a target depth.
- **Gas Density:** Calculate the density of Nitrox and Trimix mixtures to ensure they remain within safe breathing limits (< 5.2 g/l).
- **Dual Algorithm Support:** Choose between the **Standard** and **Aspacher** calculation models.
- **Unit Support:** Full support for both Metric (meters/bar) and Imperial (feet/ata) unit systems.
- **Persistence:** Your physiological and system settings are automatically saved to your browser's local storage.

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite
- **Charts:** Recharts
- **Icons:** Lucide React
- **Testing:** Vitest
- **Styling:** Vanilla CSS (CSS Modules & Variables)
- **Deployment:** GitHub Actions & GitHub Pages

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm

### Installation

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd rb2000-web
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the local development server:
```bash
npm run dev
```

### Testing

Run the unit test suite to verify calculation logic:
```bash
npm run test
```

### Production Build

Build the optimized application for production:
```bash
npm run build
```

## Deployment

The project is configured for automatic deployment to GitHub Pages. On every push to the `main` branch, a GitHub Action will build and deploy the application.

Make sure to update the `base` path in `vite.config.ts` if you are hosting the project under a specific sub-path.

## License

This project is intended for educational and personal use in diving planning. Always cross-verify calculations with other tools and dive within your training limits.
