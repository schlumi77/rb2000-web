
import React from 'react';
import { Settings, Activity, Gauge, Thermometer, LineChart } from 'lucide-react';

export type ViewType = 'steady' | 'sim' | 'min' | 'density' | 'settings';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const items = [
    { id: 'steady', label: 'Steady', icon: Activity },
    { id: 'sim', label: 'Sim', icon: LineChart },
    { id: 'min', label: 'Min fO2', icon: Thermometer },
    { id: 'density', label: 'Density', icon: Gauge },
    { id: 'settings', label: 'Setup', icon: Settings },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`nav-item ${currentView === id ? 'active' : ''}`}
          onClick={() => onViewChange(id as ViewType)}
        >
          <Icon size={24} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
