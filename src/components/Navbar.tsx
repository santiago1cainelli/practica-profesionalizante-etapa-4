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
  LogOut,
  MapPin,
  Award,
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { ActiveTab, AppUser } from '../context/AppContext';
import { useClub } from '../context/AppProvider';
import { UserRole } from '../types';

export type ExtendedUserRole = UserRole | 'PUBLICO';

interface NavbarProps {
  onOpenPlanDoc?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const {
    currentUser,
    setCurrentUser,
    login,
    logout,
    usersList,
    activeTab,
    setActiveTab,
    toast,
    showToast,
    closeToast,
    socios,
    rendiciones,
  } = useClub();

  const [showUserMenu, setShowUserMenu] = useState(false);

  // Estados para la pantalla/modal de Inicio de Sesión
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Rol del usuario con fallback seguro si no hay sesión cargada todavía
  const currentRole: ExtendedUserRole = (currentUser?.role as ExtendedUserRole) || 'PUBLICO';

  // Socio asociado si el usuario en sesión es un socio registrado en la BD
  const socioActual = currentUser?.socioId
    ? socios.find((s) => String(s.id) === String(currentUser.socioId))
    : null;

  const cuotaValor = socioActual ? Number((socioActual as any).montoCuotaSocial || 0) : null;

  // Contadores para insignias de notificación
  const morososCount = socios.filter((s) => s.estado === 'SUSPENDIDO' || s.estado === 'MOROSO').length;
  const rendicionesPendientes = rendiciones.filter(
    (r) => (r as any).estado === 'PENDIENTE_SECRETARIA' || !(r as any).fechaRendicion
  ).length;

  const roleBadges: Record<ExtendedUserRole, { bg: string; text: string; label: string }> = {
    ADMIN: { bg: 'bg-purple-700', text: 'text-white', label: 'ADMINISTRADOR' },
    COBRADOR: { bg: 'bg-amber-600', text: 'text-white', label: 'COBRADOR DE ZONA' },
    INSTRUCTOR: { bg: 'bg-teal-600', text: 'text-white', label: 'INSTRUCTOR DEPORTES' },
    SOCIO: { bg: 'bg-blue-600', text: 'text-white', label: 'SOCIO DEL CLUB' },
    PUBLICO: { bg: 'bg-slate-600', text: 'text-white', label: 'INVITADO PÚBLICO' },
  };

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    roles: ExtendedUserRole[];
    badge?: number;
  }[] = [
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

  // Redirección inteligente según el rol que inicia sesión
  const getDefaultTabForRole = (role: ExtendedUserRole): ActiveTab => {
    switch (role) {
      case 'ADMIN':
        return 'dashboard';
      case 'COBRADOR':
        return 'cobranza';
      case 'INSTRUCTOR':
        return 'asistencia';
      case 'SOCIO':
        return 'portal_socio';
      default:
        return 'inicio';
    }
  };

  // Abrir modal de login limpiando errores previos
  const handleOpenLogin = (prefillEmail = '') => {
    setLoginEmail(prefillEmail);
    setLoginPassword('');
    setLoginError('');
    setShowPassword(false);
    setShowUserMenu(false);
    setShowLoginModal(true);
  };

  // Procesar inicio de sesión mediante autenticación oficial o demo fallback
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const emailTrimmed = loginEmail.trim().toLowerCase();
    const passwordTrimmed = loginPassword.trim();

    if (!emailTrimmed || !passwordTrimmed) {
      setLoginError('Por favor, ingrese su correo electrónico y contraseña.');
      return;
    }

    setIsSubmittingLogin(true);
    try {
      const res = await login(emailTrimmed, passwordTrimmed);
      if (res.success) {
        setShowLoginModal(false);
        setLoginEmail('');
        setLoginPassword('');
        const savedUserStr = localStorage.getItem('el_globo_current_user');
        const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
        const nextRole = (savedUser?.role as ExtendedUserRole) || 'ADMIN';
        setActiveTab(getDefaultTabForRole(nextRole));
        showToast(
          'success',
          `¡Bienvenido/a, ${savedUser?.nombreCompleto || emailTrimmed}!`,
          `Sesión iniciada con rol ${roleBadges[nextRole]?.label || nextRole}.`
        );
      } else {
        setLoginError(res.message || 'Credenciales incorrectas. Verifique su email y contraseña.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Error inesperado al conectar con el servidor.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // Cerrar sesión y volver a Invitado Público
  const handleLogout = () => {
    logout();
    setActiveTab('inicio');
    setShowUserMenu(false);
    showToast('info', 'Sesión cerrada', 'Has vuelto al modo de navegación como Invitado Público.');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#1A365D] text-white shadow-md border-b-4 border-[#C53030]">
        {/* Banner Superior con Identidad y Selector de Usuario */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo del Club */}
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() =>
                setActiveTab(
                  currentRole === 'PUBLICO'
                    ? 'inicio'
                    : currentRole === 'SOCIO'
                    ? 'portal_socio'
                    : 'dashboard'
                )
              }
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

            {/* Acciones e Indicador de Sesión */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {currentRole === 'PUBLICO' && (
                <button
                  onClick={() => handleOpenLogin()}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#C53030] hover:bg-[#9B2C2C] rounded-md text-white transition-colors shadow-xs cursor-pointer"
                  title="Iniciar sesión con usuario registrado"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Iniciar Sesión</span>
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

              {/* Desplegable de Perfil / Cambio de Cuenta */}
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
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Sesión Actual
                      </p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{nombreUsuarioDisplay}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => handleOpenLogin()}
                        className="w-full text-left px-3 py-2 rounded-md flex items-center space-x-2.5 text-xs font-semibold text-[#1A365D] hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-[#2B6CB0]" />
                        <span>
                          {currentRole === 'PUBLICO' ? 'Ingresar con credenciales' : 'Cambiar de usuario'}
                        </span>
                      </button>

                      {currentRole !== 'PUBLICO' && (
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 rounded-md flex items-center space-x-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Cerrar sesión</span>
                        </button>
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
                toast.type === 'success'
                  ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                  : toast.type === 'error'
                  ? 'bg-red-900 text-red-100 border-red-700'
                  : toast.type === 'warning'
                  ? 'bg-amber-900 text-amber-100 border-amber-700'
                  : 'bg-blue-900 text-blue-100 border-blue-700'
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

      {/* PANTALLA MODAL DE INICIO DE SESIÓN */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
            {/* Cabecera Institucional */}
            <div className="bg-[#1A365D] px-6 py-5 text-white border-b-4 border-[#C53030] relative">
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Cerrar ventana de inicio de sesión"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center p-1.5 shadow-md border-2 border-[#C53030] shrink-0">
                  <div className="w-7 h-7 rounded-full bg-[#C53030] flex items-center justify-center text-white text-sm font-black">
                    G
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-wide uppercase">Club El Globo</h2>
                  <p className="text-xs text-blue-200">Acceso al Sistema de Gestión y Portal de Socios</p>
                </div>
              </div>
            </div>

            {/* Formulario de Autenticación */}
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              {loginError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-2.5 text-red-700 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="usuario@elglobo.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingLogin}
                className="w-full py-2.5 px-4 bg-[#C53030] hover:bg-[#9B2C2C] disabled:bg-slate-400 text-white font-bold text-sm rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmittingLogin ? 'Verificando credenciales...' : 'Ingresar al Sistema'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};