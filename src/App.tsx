
import { useState, lazy, Suspense } from 'react'
import './App.css'
import { SettingsProvider } from './context/SettingsContext'
import Navigation from './components/Navigation'
import type { ViewType } from './components/Navigation'
import SettingsView from './views/Settings'
import FO2SteadyState from './views/FO2SteadyState'
import FO2Min from './views/FO2Min'
import GasDensity from './views/GasDensity'

// The loop simulation is the only view that pulls in the (large) charting
// library, so it is loaded on demand to keep the initial bundle small.
const FO2TimeSim = lazy(() => import('./views/FO2TimeSim'))

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('steady')

  const renderView = () => {
    switch (currentView) {
      case 'steady': return <FO2SteadyState />
      case 'sim': return <FO2TimeSim />
      case 'min': return <FO2Min />
      case 'density': return <GasDensity />
      case 'settings': return <SettingsView />
      default: return <div>Steady State View</div>
    }
  }

  const getTitle = () => {
    switch (currentView) {
      case 'steady': return 'Steady State fO2'
      case 'sim': return 'Loop Simulation'
      case 'min': return 'Minimum fO2'
      case 'density': return 'Gas Density'
      case 'settings': return 'Setup'
      default: return 'RB2000'
    }
  }

  return (
    <SettingsProvider>
      <div className="app">
        <header className="header">
          {getTitle()}
        </header>
        <main className="container">
          <Suspense fallback={<div className="section-title">Loading…</div>}>
            {renderView()}
          </Suspense>
        </main>
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
      </div>
    </SettingsProvider>
  )
}

export default App
