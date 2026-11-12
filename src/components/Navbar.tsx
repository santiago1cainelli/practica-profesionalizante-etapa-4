import React, { useState } from 'react';
import {
  Home,
  Users,
  Grid,
  Trophy,
  ClipboardCheck,
  Receipt,
  FileSpreadsheet,
  AlertOctagon,
  UserCheck,
  ShieldCheck,
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
  Database,
  RefreshCw,
} from 'lucide-react';
import { ActiveTab } from '../context/AppContext';
import { useClub } from '../context/AppProvider';
import { UserRole } from '../types';

export type ExtendedUserRole = UserRole | 'PUBLICO';

interface NavbarProps {
  onOpenPlanDoc?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const {
    currentUser,
    usersList,
    activeTab,
    setActiveTab,
    toast,
    closeToast,
    socios,
    rendiciones,
  } = useClub();
  
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Rol del usuario con fallback seguro si no hay sesión cargada todavía
  const currentRole: ExtendedUserRole = (currentUser?.role as ExtendedUserRole) || 'PUBLICO';

  // Socio asociado si el usuario en sesión es un socio registrado en la BD
  const socioActual = currentUser?.socioId
    ? socios.find((s) => String(s.id) === String(currentUser.socioId))
    : null;

  const cuotaValor = socioActual ? Number((socioActual as any).montoCuotaSocial || 0) : null;

  // Contadores para insignias de notificación
  const morososCount = socios.filter((s) => s.estado === 'SUSPENDIDO' || s.estado === 'MOROSO').length;
  const rendicionesPendientes = rendiciones.filter((r) => (r as any).estado === 'PENDIENTE_SECRETARIA' || !(r as any).fechaRendicion).length;

  const roleBadges: Record<ExtendedUserRole, { bg: string; text: string; label: string }> = {
    ADMIN: { bg: 'bg-purple-700', text: 'text-white', label: 'ADMINISTRADOR' },
    COBRADOR: { bg: 'bg-amber-600', text: 'text-white', label: 'COBRADOR DE ZONA' },
    INSTRUCTOR: { bg: 'bg-teal-600', text: 'text-white', label: 'INSTRUCTOR DEPORTES' },
    SOCIO: { bg: 'bg-blue-600', text: 'text-white', label: 'SOCIO DEL CLUB' },
    PUBLICO: { bg: 'bg-slate-600', text: 'text-white', label: 'INVITADO PÚBLICO' },
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; roles: ExtendedUserRole[]; badge?: number }[] = [
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

  const visibleNavItems = navItems.filter((item) => item.roles.includes(currentRole));
  const nombreUsuarioDisplay = currentUser?.nombreCompleto || currentUser?.email || 'Usuario';

  return (
    <header className="sticky top-0 z-40 bg-[#1A365D] text-white shadow-md border-b-4 border-[#C53030]">
      {/* Banner Superior con Identidad y Selector de Usuario */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo del Club */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab(currentRole === 'PUBLICO' ? 'inicio' : currentRole === 'SOCIO' ? 'portal_socio' : 'dashboard')}
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1.5 shadow-md border-2 border-[#C53030]">
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
              <p className="text-[11px] text-slate-300 font-light flex items-center space-x-1.5">
                <span>Gestión Integral</span>
                <span>•</span>
                <span className="inline-flex items-center text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
                  API REST & BD Persistente
                </span>
              </p>
            </div>
          </div>

          {/* Acciones e Indicador de BD */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {currentRole === 'PUBLICO' && (
              <button
                onClick={() => setShowUserMenu(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold bg-[#C53030] hover:bg-[#9B2C2C] rounded-md text-white transition-colors shadow-xs cursor-pointer"
                title="Acceder al sistema con usuario interno o socio"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            )}

            {/* Insignia Cuota Social si es Socio */}
            {currentRole === 'SOCIO' && cuotaValor !== null && (
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

            {/* Desplegable de Usuarios de la BD */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-[#2B6CB0]/50 hover:bg-[#2B6CB0] rounded-md border border-blue-400/30 text-xs text-white transition-all shadow-xs cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-white text-[#1A365D] font-bold flex items-center justify-center text-xs">
                  {nombreUsuarioDisplay.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold leading-tight text-white">{nombreUsuarioDisplay}</div>
                  <div className="text-[10px] text-blue-200 uppercase tracking-wider flex items-center space-x-1">
                    <span>{roleBadges[currentRole]?.label || currentRole}</span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
              </button>

              {/* Menú desplegable */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-2xl py-2 z-50 border border-slate-200 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Usuarios Registrados en BD</p>
                    <p className="text-xs text-slate-600">Seleccione un usuario para cambiar la sesión activa:</p>
                  </div>

                  <div className="py-1 max-h-60 overflow-y-auto">
                    {usersList.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-slate-400 italic text-center">
                        Cargando usuarios desde la base de datos...
                      </p>
                    ) : (
                      usersList.map((u) => {
                        const isCurrent = String(u.id) === String(currentUser?.id);
                        const badge = roleBadges[u.role as ExtendedUserRole] || roleBadges.PUBLICO;
                        const nombreUser = u.nombreCompleto || u.email;

                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setShowUserMenu(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 flex items-start space-x-3 hover:bg-slate-100 transition-colors cursor-pointer ${
                              isCurrent ? 'bg-blue-50/80 font-medium' : ''
                            }`}
                          >
                            <div className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg} text-white`}>
                              {u.role}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{nombreUser}</p>
                              <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                            </div>
                            {isCurrent && <ShieldCheck className="w-4 h-4 text-blue-600 mt-1 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Navegación por Módulos */}
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
                  className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors relative cursor-pointer ${
                    isActive
                      ? 'bg-[#2B6CB0] text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
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

      {/* Notificaciones Toast */}
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

            <button onClick={closeToast} className="text-white/60 hover:text-white p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};