import React, { useState } from 'react';
import {
  Home,
  Users,
  KeyRound,
  Grid,
  Trophy,
  ClipboardCheck,
  Receipt,
  FileSpreadsheet,
  AlertOctagon,
  UserCheck,
  ShieldCheck,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  LogIn,
  MapPin,
  Award,
} from 'lucide-react';
import { useApp, ActiveTab } from '../context/AppContext';
import { MOCK_USERS, CUOTA_VALORES } from '../data/mockData';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenPlanDoc?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { currentUser, quickSwitchUser, activeTab, setActiveTab, toast, closeToast, socios, cupones, rendiciones } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Socio info when user is a registered member
  const socioActual = currentUser.socioId ? socios.find((s) => s.id === currentUser.socioId) : null;
  const cuotaValor = socioActual ? CUOTA_VALORES[socioActual.categoria] : null;

  // Counts for notification badges
  const morososCount = socios.filter((s) => s.estado === 'SUSPENDIDO_MOROSIDAD').length;
  const rendicionesPendientes = rendiciones.filter((r) => r.estado === 'PENDIENTE_SECRETARIA').length;

  const roleBadges: Record<UserRole, { bg: string; text: string; label: string }> = {
    ADMIN: { bg: 'bg-purple-700', text: 'text-white', label: 'ADMINISTRADOR' },
    COBRADOR: { bg: 'bg-amber-600', text: 'text-white', label: 'COBRADOR DE ZONA' },
    INSTRUCTOR: { bg: 'bg-teal-600', text: 'text-white', label: 'INSTRUCTOR DEPORTES' },
    SOCIO: { bg: 'bg-blue-600', text: 'text-white', label: 'SOCIO DEL CLUB' },
    PUBLICO: { bg: 'bg-slate-600', text: 'text-white', label: 'INVITADO PÚBLICO' },
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; roles: UserRole[]; badge?: number }[] = [
    { id: 'inicio', label: 'Inicio / Club', icon: Home, roles: ['ADMIN', 'COBRADOR', 'INSTRUCTOR', 'SOCIO', 'PUBLICO'] },
    { id: 'dashboard', label: 'Tablero', icon: LayoutDashboard, roles: ['ADMIN'] },
    { id: 'socios', label: 'Padrón Socios', icon: Users, roles: ['ADMIN'] },
    { id: 'cobradores', label: 'Cobradores', icon: MapPin, roles: ['ADMIN'] },
    { id: 'instructores', label: 'Instructores', icon: Award, roles: ['ADMIN'] },
    { id: 'casilleros', label: '100 Casilleros', icon: Grid, roles: ['ADMIN', 'COBRADOR'] },
    { id: 'actividades', label: 'Deportes', icon: Trophy, roles: ['ADMIN', 'INSTRUCTOR', 'SOCIO', 'PUBLICO'] },
    { id: 'asistencia', label: 'Asistencia', icon: ClipboardCheck, roles: ['ADMIN', 'INSTRUCTOR'] },
    { id: 'cobranza', label: 'Cobranza & Zonas', icon: Receipt, roles: ['ADMIN', 'COBRADOR'] },
    { id: 'rendicion', label: 'Rendición (10%)', icon: FileSpreadsheet, roles: ['ADMIN', 'COBRADOR'], badge: rendicionesPendientes },
    { id: 'morosidad', label: 'Morosidad', icon: AlertOctagon, roles: ['ADMIN'], badge: morososCount },
    { id: 'portal_socio', label: 'Mi Portal Socio', icon: UserCheck, roles: ['SOCIO', 'ADMIN'] },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(currentUser.role));

  return (
    <header className="sticky top-0 z-40 bg-[#1A365D] text-white shadow-md border-b-4 border-[#C53030]">
      {/* Top Banner with Brand & Quick Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Club Name */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab(currentUser.role === 'PUBLICO' ? 'inicio' : currentUser.role === 'SOCIO' ? 'portal_socio' : 'dashboard')}
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1.5 shadow-md border-2 border-[#C53030]">
              {/* Balloon / El Globo Icon */}
              <div className="relative flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#C53030] flex items-center justify-center text-white text-xs font-black">
                  G
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-black tracking-wider text-white uppercase font-sans">
                  CLUB EL GLOBO
                </span>
                <span className="hidden sm:inline-block text-[10px] bg-[#C53030] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Fundado 1948
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-light">
                Sistema de Gestión Integral • Frontend React
              </p>
            </div>
          </div>

          {/* Right actions: Plan Doc + Persona Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {currentUser.role === 'PUBLICO' && (
              <button
                onClick={() => setShowUserMenu(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold bg-[#C53030] hover:bg-[#9B2C2C] rounded-md text-white transition-colors shadow-xs"
                title="Acceder al sistema con usuario interno o socio"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            )}

            {/* Cuota Social Badge when logged in as Socio */}
            {currentUser.role === 'SOCIO' && cuotaValor !== null && (
              <div
                onClick={() => setActiveTab('portal_socio')}
                className="cursor-pointer hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900/80 rounded-md border border-emerald-500/50 text-xs transition-colors shadow-xs"
                title="Ver detalle de cuota social y aranceles en Mi Portal Socio"
              >
                <span className="text-[10px] uppercase font-bold text-emerald-400">Cuota Social:</span>
                <span className="font-mono font-bold text-emerald-100">
                  {cuotaValor > 0 ? `$${cuotaValor.toLocaleString('es-AR')}/mes` : 'Exento ($0)'}
                </span>
              </div>
            )}

            {/* User Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-[#2B6CB0]/50 hover:bg-[#2B6CB0] rounded-md border border-blue-400/30 text-xs text-white transition-all shadow-xs"
              >
                <div className="w-6 h-6 rounded-full bg-white text-[#1A365D] font-bold flex items-center justify-center text-xs">
                  {currentUser.nombreCompleto.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold leading-tight text-white">{currentUser.nombreCompleto}</div>
                  <div className="text-[10px] text-blue-200 uppercase tracking-wider flex items-center space-x-1">
                    <span>{roleBadges[currentUser.role]?.label || currentUser.role}</span>
                    {currentUser.role === 'SOCIO' && cuotaValor !== null && (
                      <span className="text-emerald-300 font-mono font-bold">
                        • {cuotaValor > 0 ? `$${cuotaValor.toLocaleString('es-AR')}` : '$0'}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-2xl py-2 z-50 border border-slate-200 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Simulador de Roles (RBAC)</p>
                    <p className="text-xs text-slate-600">Cambia de usuario para validar vistas y permisos según el Plan de Implementación:</p>
                  </div>

                  <div className="py-1">
                    {MOCK_USERS.map((user) => {
                      const isCurrent = user.id === currentUser.id;
                      const badge = roleBadges[user.role];
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            quickSwitchUser(user.id);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 flex items-start space-x-3 hover:bg-slate-100 transition-colors ${
                            isCurrent ? 'bg-blue-50/80 font-medium' : ''
                          }`}
                        >
                          <div className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg} text-white`}>
                            {user.role}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{user.nombreCompleto}</p>
                            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                          </div>
                          {isCurrent && <ShieldCheck className="w-4 h-4 text-blue-600 mt-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-[#142847] border-t border-blue-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-1 scrollbar-none">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors relative ${
                    isActive
                      ? 'bg-[#2B6CB0] text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.id === 'portal_socio' && currentUser.role === 'SOCIO' && cuotaValor !== null && (
                    <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500 text-white shadow-xs">
                      {cuotaValor > 0 ? `$${cuotaValor.toLocaleString('es-AR')}` : 'Exento'}
                    </span>
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-black">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`p-4 rounded-lg shadow-xl border flex items-start space-x-3 ${
              toast.type === 'success' ? 'bg-emerald-900 text-emerald-100 border-emerald-700' :
              toast.type === 'error' ? 'bg-red-900 text-red-100 border-red-700' :
              toast.type === 'warning' ? 'bg-amber-900 text-amber-100 border-amber-700' :
              'bg-blue-900 text-blue-100 border-blue-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs">
              <h4 className="font-bold text-sm text-white mb-0.5">{toast.title}</h4>
              {toast.description && <p className="leading-snug opacity-90">{toast.description}</p>}
            </div>

            <button onClick={closeToast} className="text-white/60 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
