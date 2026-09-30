import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { SocioList } from './components/SocioList';
import { CasillerosGrid } from './components/CasillerosGrid';
import { ActividadesShowcase } from './components/ActividadesShowcase';
import { AsistenciaTracker } from './components/AsistenciaTracker';
import { CobranzaZones } from './components/CobranzaZones';
import { RendicionCobrador } from './components/RendicionCobrador';
import { MorosidadControl } from './components/MorosidadControl';
import { SocioPortal } from './components/SocioPortal';
import { GuestHome } from './components/GuestHome';
import { PlanDocumentModal } from './components/PlanDocumentModal';
import { Building2, ShieldCheck, Heart } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, currentUser } = useApp();
  const [isPlanDocOpen, setIsPlanDocOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return <GuestHome />;
      case 'dashboard':
        return <Dashboard />;
      case 'socios':
        return <SocioList />;
      case 'casilleros':
        return <CasillerosGrid />;
      case 'actividades':
        return <ActividadesShowcase />;
      case 'asistencia':
        return <AsistenciaTracker />;
      case 'cobranza':
        return <CobranzaZones />;
      case 'rendicion':
        return <RendicionCobrador />;
      case 'morosidad':
        return <MorosidadControl />;
      case 'portal_socio':
        return <SocioPortal />;
      case 'plan_doc':
        return <Dashboard />;
      default:
        return currentUser.role === 'PUBLICO' ? <GuestHome /> : <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-red-200 selection:text-red-900">
      <Navbar onOpenPlanDoc={() => setIsPlanDocOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </main>

      {/* Technical Implementation Plan Modal */}
      <PlanDocumentModal
        isOpen={isPlanDocOpen || activeTab === 'plan_doc'}
        onClose={() => {
          setIsPlanDocOpen(false);
          if (activeTab === 'plan_doc') {
            setActiveTab('dashboard');
          }
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#1A365D] text-white flex items-center justify-center font-black text-sm">
              G
            </div>
            <div>
              <p className="font-bold text-slate-800 text-xs">
                Club Social y Deportivo "El Globo" • Fundado en 1948
              </p>
              <p className="text-[11px] text-slate-500">
                Sede Central: Av. San Martín 1420 • Cobranza Domiciliaria Zonas 1, 2 y 3
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reglamento Estatutario Vigente</span>
            </span>
            <span>•</span>
            <span>Versión 2.4 Frontend React</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
