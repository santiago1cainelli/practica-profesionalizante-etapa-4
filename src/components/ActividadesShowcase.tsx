import React, { useState } from 'react';
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  ShieldAlert,
  Search,
  Lock,
  UserCheck,
  LogIn,
  X
} from 'lucide-react';
import { Actividad } from '../types';
import { useApp } from '../context/AppContext';

export const ActividadesShowcase: React.FC = () => {
  const {
    actividades,
    socios,
    enrollSocioInActividad,
    unenrollSocioFromActividad,
    currentUser,
    setActiveTab,
    quickSwitchUser,
  } = useApp();

  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActividadToEnroll, setSelectedActividadToEnroll] = useState<Actividad | null>(null);
  const [targetSocioId, setTargetSocioId] = useState<string>('');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [actividadToUnenroll, setActividadToUnenroll] = useState<Actividad | null>(null);

  const isGuest = currentUser.role === 'PUBLICO';
  const isSocio = currentUser.role === 'SOCIO';
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'INSTRUCTOR';

  // If logged in as socio, identify their member profile
  const currentSocio = isSocio
    ? socios.find((s) => s.id === currentUser.socioId) || socios.find((s) => s.email === currentUser.email)
    : null;

  const categoriasUnicas = Array.from(new Set(actividades.map((a) => a.categoria)));

  const filteredActividades = actividades.filter((act) => {
    const matchesCat = selectedCategoria === 'TODAS' || act.categoria === selectedCategoria;
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      act.nombre.toLowerCase().includes(term) ||
      act.instructorNombre.toLowerCase().includes(term) ||
      act.lugar.toLowerCase().includes(term);

    return matchesCat && matchesSearch;
  });

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActividadToEnroll) return;

    // For socio, enrollment is strictly for themselves
    const finalSocioId = isSocio ? currentSocio?.id || '' : targetSocioId;
    if (!finalSocioId) return;

    const success = enrollSocioInActividad(finalSocioId, selectedActividadToEnroll.id);
    if (success) {
      setSelectedActividadToEnroll(null);
      setTargetSocioId('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-500 text-white">
              Deportes & Disciplinas
            </span>
            <span className="text-xs text-slate-500 font-medium">Catálogo Oficial</span>
            {isGuest && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-600 text-white">
                Modo Invitado
              </span>
            )}
            {isSocio && currentSocio && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-600 text-white">
                Socio N° {currentSocio.numeroSocio}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1A365D] tracking-tight flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-[#C53030]" />
            <span>Vitrina de Actividades Deportivas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Oferta formativa y competitiva del Club El Globo. Los aranceles se consolidan en el recibo mensual del socio.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar deporte o profesor..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none w-56"
            />
          </div>

          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODAS">Todas las Disciplinas</option>
            {categoriasUnicas.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RBAC Notice Banner for Guest */}
      {isGuest && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-200/80 rounded-lg text-amber-800 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <strong className="block font-bold text-amber-950 text-sm">
                Inscripciones Exclusivas para Socios Oficiales
              </strong>
              <span className="text-amber-800">
                Los visitantes invitados no pueden inscribir socios a actividades. Para acceder a las disciplinas deportivas debes registrarte como socio o iniciar sesión.
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setActiveTab('inicio')}
              className="px-3.5 py-2 bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold rounded-lg transition-colors text-xs shadow-xs"
            >
              Quiero ser Socio
            </button>
            <button
              onClick={() => quickSwitchUser('user-socio-activo')}
              className="px-3.5 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white font-bold rounded-lg transition-colors text-xs shadow-xs"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      )}

      {/* RBAC Notice Banner for Socio */}
      {isSocio && currentSocio && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <strong className="block font-bold text-blue-950 text-sm">
                Autogestión de Socio: {currentSocio.nombreCompleto} (DNI {currentSocio.dni})
              </strong>
              <span className="text-blue-800">
                El socio solo puede inscribirse a sí mismo. Haz clic en "Inscribirme" para reservar tu vacante personal en las actividades disponibles.
              </span>
            </div>
          </div>
          <span className="px-3 py-1 bg-white border border-blue-200 text-blue-900 rounded-full font-bold text-xs shrink-0">
            {currentSocio.actividadesIds.length} actividad(es) inscripta(s)
          </span>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredActividades.map((act) => {
          const cupoPorcentaje = Math.round((act.cupoOcupado / act.cupoMaximo) * 100);
          const isLleno = act.cupoOcupado >= act.cupoMaximo;

          // Find socios enrolled in this activity
          const inscriptos = socios.filter((s) => s.actividadesIds.includes(act.id));

          return (
            <div
              key={act.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                    {act.categoria}
                  </span>
                  <span className="font-mono text-sm font-black text-emerald-700">
                    ${act.costoMensual.toLocaleString('es-AR')}/mes
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
                  {act.nombre}
                </h3>
                <p className="text-xs text-slate-600 mb-3">{act.descripcion}</p>

                {/* Details list */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{act.dias.join(', ')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{act.horario} hs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{act.lugar}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-[#2B6CB0] shrink-0" />
                    <span className="font-semibold text-slate-800">{act.instructorNombre}</span>
                  </div>
                </div>

                {/* Quota Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-slate-500 font-medium">Cupo Disponible:</span>
                    <strong className={isLleno ? 'text-red-600' : 'text-slate-800'}>
                      {act.cupoOcupado} / {act.cupoMaximo} alumnos ({cupoPorcentaje}%)
                    </strong>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cupoPorcentaje > 90 ? 'bg-red-500' : cupoPorcentaje > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, cupoPorcentaje)}%` }}
                    />
                  </div>
                </div>

                {/* Enrolled members list summary */}
                <div className="text-[11px] text-slate-500 mb-3">
                  <strong className="text-slate-700">Socios Inscriptos ({inscriptos.length}):</strong>{' '}
                  {inscriptos.length > 0 ? (
                    inscriptos.map((s) => s.nombreCompleto).join(', ')
                  ) : (
                    <span className="italic">Sin inscriptos actualmente</span>
                  )}
                </div>
              </div>

              {/* Action Button depending on Role */}
              {isGuest ? (
                /* Invitado: NO puede inscribir socios */
                <button
                  onClick={() => setShowGuestModal(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-300 flex items-center justify-center space-x-1.5 shadow-xs"
                  title="Los invitados no pueden inscribir socios a las actividades"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Inscripción Solo para Socios</span>
                </button>
              ) : isSocio ? (
                /* Socio: SOLO puede inscribirse a sí mismo */
                (() => {
                  const isEnrolled = currentSocio ? currentSocio.actividadesIds.includes(act.id) : false;
                  const isSuspended = currentSocio?.estado === 'SUSPENDIDO_MOROSIDAD';

                  if (isEnrolled) {
                    return (
                      <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Ya estás inscripto</span>
                        </span>
                        <button
                          onClick={() => setActividadToUnenroll(act)}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-800 hover:underline px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                        >
                          Darme de baja
                        </button>
                      </div>
                    );
                  }

                  if (isSuspended) {
                    return (
                      <button
                        disabled
                        className="w-full py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 cursor-not-allowed opacity-90"
                        title="Regulariza tu deuda en secretaría para poder anotarte a deportes"
                      >
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        <span>Bloqueado por Morosidad</span>
                      </button>
                    );
                  }

                  if (isLleno) {
                    return (
                      <button
                        disabled
                        className="w-full py-2 bg-slate-200 text-slate-400 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 cursor-not-allowed"
                      >
                        <span>Cupos Agotados</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      onClick={() => {
                        setSelectedActividadToEnroll(act);
                        setTargetSocioId(currentSocio?.id || '');
                      }}
                      className="w-full py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Inscribirme</span>
                    </button>
                  );
                })()
              ) : (
                /* ADMIN / INSTRUCTOR: Puede inscribir a cualquier socio del padrón */
                <button
                  onClick={() => {
                    setSelectedActividadToEnroll(act);
                    setTargetSocioId('');
                  }}
                  disabled={isLleno}
                  className="w-full py-2 bg-[#1A365D] hover:bg-[#2B6CB0] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLleno ? 'Cupos Agotados' : 'Inscribir Socio del Padrón'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Guest Restriction Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 bg-[#1A365D] text-white border-b-2 border-[#C53030]">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-red-400" />
                <span className="font-bold text-sm tracking-wide">
                  INSCRIPCIÓN EXCLUSIVA PARA SOCIOS
                </span>
              </div>
              <button
                onClick={() => setShowGuestModal(false)}
                className="p-1 text-white/80 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start space-x-2.5">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">Acceso no permitido a Invitados:</strong>
                  Los invitados no tienen permitido inscribir socios a las actividades deportivas del Club El Globo.
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-600">
                Para participar en nuestras disciplinas (natación, fútbol, básquet, vóley, gimnasia o tenis) debes ser socio habilitado. Podés solicitar tu admisión online o ingresar con tu cuenta si ya sos socio.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={() => {
                    setShowGuestModal(false);
                    setActiveTab('inicio');
                  }}
                  className="px-4 py-2 bg-[#C53030] hover:bg-[#9B2C2C] text-white rounded-lg text-xs font-bold transition-colors text-center shadow-xs"
                >
                  ¡Quiero ser Socio!
                </button>
                <button
                  onClick={() => {
                    setShowGuestModal(false);
                    quickSwitchUser('user-socio-activo');
                  }}
                  className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white rounded-lg text-xs font-bold transition-colors text-center shadow-xs"
                >
                  Iniciar Sesión como Socio
                </button>
                <button
                  onClick={() => setShowGuestModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold text-center"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Modal for SOCIO (Personal Enrollment only) */}
      {selectedActividadToEnroll && isSocio && currentSocio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-3.5 bg-[#1A365D] text-white border-b-2 border-[#C53030]">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-red-400" />
                <span className="font-bold text-sm tracking-wide">
                  CONFIRMAR MI INSCRIPCIÓN
                </span>
              </div>
              <button
                onClick={() => setSelectedActividadToEnroll(null)}
                className="p-1 text-white/80 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4 text-xs sm:text-sm text-slate-800">
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-900 border border-blue-200">
                <p className="font-bold text-sm text-[#1A365D] mb-1">{selectedActividadToEnroll.nombre}</p>
                <p>Arancel mensual: <strong>${selectedActividadToEnroll.costoMensual.toLocaleString('es-AR')}/mes</strong></p>
                <p>Profesor: {selectedActividadToEnroll.instructorNombre} • {selectedActividadToEnroll.horario} hs ({selectedActividadToEnroll.dias.join(', ')})</p>
                <p>Lugar: {selectedActividadToEnroll.lugar}</p>
              </div>

              {/* Locked to current socio identity */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Socio Solicitante (Inscripción Personal):
                </span>
                <p className="text-sm font-black text-slate-900">{currentSocio.nombreCompleto}</p>
                <div className="flex justify-between text-xs text-slate-600 pt-1">
                  <span>Socio N°: <strong>{currentSocio.numeroSocio}</strong></span>
                  <span>DNI: <strong>{currentSocio.dni}</strong></span>
                  <span>Categoría: <strong>{currentSocio.categoria}</strong></span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-start space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Inscripción Directa:</strong> Como socio activo, tu inscripción es personal e intransferible. El arancel mensual se incluirá automáticamente en tu próximo recibo.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedActividadToEnroll(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  Confirmar Mi Inscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrollment Modal for ADMIN / INSTRUCTOR (Padrón selection) */}
      {selectedActividadToEnroll && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-3.5 bg-[#1A365D] text-white border-b-2 border-[#C53030]">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-red-400" />
                <span className="font-bold text-sm tracking-wide">
                  ADMINISTRACIÓN: INSCRIBIR EN {selectedActividadToEnroll.nombre.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedActividadToEnroll(null)}
                className="p-1 text-white/80 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4 text-xs sm:text-sm text-slate-800">
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-900 border border-blue-200">
                <p>Arancel mensual: <strong>${selectedActividadToEnroll.costoMensual.toLocaleString('es-AR')}</strong></p>
                <p>Profesor: {selectedActividadToEnroll.instructorNombre} • {selectedActividadToEnroll.horario} hs</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seleccionar Socio del Padrón a Inscribir:
                </label>
                <select
                  value={targetSocioId}
                  onChange={(e) => setTargetSocioId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                >
                  <option value="">-- Elija un socio del padrón --</option>
                  {socios.map((s) => {
                    const yaInscripto = s.actividadesIds.includes(selectedActividadToEnroll.id);
                    const isSuspended = s.estado === 'SUSPENDIDO_MOROSIDAD';
                    return (
                      <option
                        key={s.id}
                        value={s.id}
                        disabled={yaInscripto || isSuspended}
                      >
                        {s.nombreCompleto} (DNI: {s.dni})
                        {isSuspended ? ' [BLOQUEADO POR MOROSIDAD]' : yaInscripto ? ' [YA INSCRIPTO]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Delinquency Warning */}
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-start space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Control de Morosidad:</strong> Socios que adeudan 2 o más cuotas consecutivas tienen inhabilitada la inscripción hasta regularizar su situación contable.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedActividadToEnroll(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!targetSocioId}
                  className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] disabled:bg-slate-300 text-white rounded text-xs font-bold transition-colors shadow-xs"
                >
                  Confirmar Inscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Unenroll (For Socio) */}
      {actividadToUnenroll && isSocio && currentSocio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#1A365D] text-white font-bold text-sm border-b-2 border-[#C53030] flex justify-between items-center">
              <span>DARME DE BAJA DE LA DISCIPLINA</span>
              <button
                onClick={() => setActividadToUnenroll(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs text-slate-700">
              <p className="text-slate-800 font-medium">
                ¿Confirmas que deseas darte de baja de <strong>{actividadToUnenroll.nombre}</strong>?
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Al confirmar la baja, liberarás tu cupo en la actividad y el arancel mensual correspondiente (${actividadToUnenroll.costoMensual.toLocaleString('es-AR')}) dejará de cobrarse en tu próximo recibo.
              </p>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  onClick={() => setActividadToUnenroll(null)}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    unenrollSocioFromActividad(currentSocio.id, actividadToUnenroll.id);
                    setActividadToUnenroll(null);
                  }}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs"
                >
                  Confirmar Baja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
