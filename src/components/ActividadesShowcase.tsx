import React, { useState, useContext } from 'react';
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  ShieldAlert,
  Search,
  Lock,
  UserCheck,
  X
} from 'lucide-react';
import { Actividades } from '../types';
//import { useApp } from '../context/AppContext';
import { useClub } from '../context/AppProvider';

export const ActividadesShowcase: React.FC = () => {
  const {
    actividades,
    socios,
    enrollSocioInActividad,
    unenrollSocioFromActividad,
    currentUser,
    setActiveTab,
    quickSwitchUser
  } = useContext( useClub );

  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActividadToEnroll, setSelectedActividadToEnroll] = useState<Actividades | null>(null);
  const [targetSocioId, setTargetSocioId] = useState<string>('');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [actividadToUnenroll, setActividadToUnenroll] = useState<Actividades | null>(null);

  const isGuest = currentUser?.role === 'PUBLICO';
  const isSocio = currentUser?.role === 'SOCIO';
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'INSTRUCTOR';

  // Si está logueado como socio, identificar su perfil en el padrón de la BD
  const currentSocio = isSocio
    ? socios.find((s) => String(s.id) === String(currentUser.socioId)) ||
      socios.find((s) => s.email === currentUser.email)
    : null;

  const categoriasUnicas = Array.from(new Set(actividades.map((a : any) => (a as any).categoria || a.turno || 'Deporte'))).filter(Boolean);

  const filteredActividades = actividades.filter((act : any) => {
    const matchesCat = selectedCategoria === 'TODAS' || (act as any).categoria === selectedCategoria || act.turno === selectedCategoria;
    const term = searchQuery.toLowerCase();
    const nombreAct = (act.nombre || '').toLowerCase();
    const nombreProf = (act.instructorNombre || (act as any).instructor?.nombreCompleto || '').toLowerCase();
    const lugarAct = (act.lugar || '').toLowerCase();

    const matchesSearch =
      nombreAct.includes(term) ||
      nombreProf.includes(term) ||
      lugarAct.includes(term);

    return matchesCat && matchesSearch;
  });

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActividadToEnroll) return;

    // Para socio, la inscripción es estrictamente para sí mismo
    const finalSocioId = isSocio ? String(currentSocio?.id || '') : targetSocioId;
    if (!finalSocioId) return;

    const success = await enrollSocioInActividad(finalSocioId, String(selectedActividadToEnroll.id));
    if (success) {
      setSelectedActividadToEnroll(null);
      setTargetSocioId('');
    }
  };

  const handleUnenrollSubmit = async () => {
    if (actividadToUnenroll && currentSocio) {
      await unenrollSocioFromActividad(String(currentSocio.id), String(actividadToUnenroll.id));
      setActividadToUnenroll(null);
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
            <span className="text-xs text-slate-500 font-medium">Catálogo BD Oficial</span>
            {isGuest && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-600 text-white">
                Modo Invitado
              </span>
            )}
            {isSocio && currentSocio && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-600 text-white">
                Socio N° {currentSocio.numeroSocio || currentSocio.id}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1A365D] tracking-tight flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-[#C53030]" />
            <span>Vitrina de Actividades Deportivas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Oferta formativa y competitiva del Club El Globo sincronizada con la base de datos.
          </p>
        </div>

        {/* Filtros */}
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

      {/* Cartel de aviso para Invitados */}
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
              className="px-3.5 py-2 bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold rounded-lg transition-colors text-xs shadow-xs cursor-pointer"
            >
              Quiero ser Socio
            </button>
            <button
              onClick={() => quickSwitchUser('user-socio-activo')}
              className="px-3.5 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white font-bold rounded-lg transition-colors text-xs shadow-xs cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      )}

      {/* Cartel de aviso para Socio */}
      {isSocio && currentSocio && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <strong className="block font-bold text-blue-950 text-sm">
                Autogestión de Socio: {currentSocio.nombreCompleto || `${currentSocio.nombre} ${currentSocio.apellido}`} (DNI {currentSocio.dni})
              </strong>
              <span className="text-blue-800">
                El socio solo puede inscribirse a sí mismo. Haz clic en "Inscribirme" para reservar tu vacante personal.
              </span>
            </div>
          </div>
          <span className="px-3 py-1 bg-white border border-blue-200 text-blue-900 rounded-full font-bold text-xs shrink-0">
            {(currentSocio.actividadesIds || []).length} actividad(es) inscripta(s)
          </span>
        </div>
      )}

      {/* Grilla de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredActividades.map((act) => {
          const cupoMax = Number(act.cupoMaximo || (act as any).cupo || 30);
          const cupoOcup = Number(act.cupoOcupado || (act as any).inscriptosCount || 0);
          const costoMensual = Number((act as any).costoMensual || act.arancel || 0);
          const instructorNombre = act.instructorNombre || (act as any).instructor?.nombreCompleto || 'Sin Asignar';
          const diasStr = act.diasSemana || (Array.isArray((act as any).dias) ? (act as any).dias.join(', ') : (act as any).dias) || 'Días a coordinar';

          const cupoPorcentaje = Math.round((cupoOcup / cupoMax) * 100);
          const isLleno = cupoOcup >= cupoMax;

          // Buscar socios inscriptos en esta actividad
          const inscriptos = socios.filter((s) => {
            const actIds = s.actividadesIds || (s as any).actividades || [];
            return Array.isArray(actIds)
              ? actIds.some((id) => String(id) === String(act.id))
              : String(actIds) === String(act.id);
          });

          return (
            <div
              key={act.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                    {(act as any).categoria || act.turno || 'Deporte'}
                  </span>
                  <span className="font-mono text-sm font-black text-emerald-700">
                    ${costoMensual.toLocaleString('es-AR')}/mes
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
                  {act.nombre}
                </h3>
                <p className="text-xs text-slate-600 mb-3">{act.descripcion}</p>

                {/* Detalles de la actividad */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{diasStr}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{act.horaInicio && act.horaFin ? `${act.horaInicio} a ${act.horaFin}` : ((act as any).horario || 'Horario a confirmar')} hs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{(act as any).lugar || 'Instalaciones del Club'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-[#2B6CB0] shrink-0" />
                    <span className="font-semibold text-slate-800">{instructorNombre}</span>
                  </div>
                </div>

                {/* Barra de progreso de cupos */}
                <div className="mb-4">
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-slate-500 font-medium">Cupo Disponible BD:</span>
                    <strong className={isLleno ? 'text-red-600' : 'text-slate-800'}>
                      {cupoOcup} / {cupoMax} alumnos ({cupoPorcentaje}%)
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

                {/* Lista reducida de inscriptos */}
                <div className="text-[11px] text-slate-500 mb-3">
                  <strong className="text-slate-700">Socios Inscriptos ({inscriptos.length}):</strong>{' '}
                  {inscriptos.length > 0 ? (
                    inscriptos.map((s) => s.nombreCompleto || `${s.nombre} ${s.apellido}`).join(', ')
                  ) : (
                    <span className="italic">Sin inscriptos actualmente</span>
                  )}
                </div>
              </div>

              {/* Botón según el Rol */}
              {isGuest ? (
                <button
                  onClick={() => setShowGuestModal(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-300 flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                  title="Los invitados no pueden inscribir socios a las actividades"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Inscripción Solo para Socios</span>
                </button>
              ) : isSocio ? (
                (() => {
                  const actIdsSocio = currentSocio ? currentSocio.actividadesIds || (currentSocio as any).actividades || [] : [];
                  const isEnrolled = Array.isArray(actIdsSocio)
                    ? actIdsSocio.some((id) => String(id) === String(act.id))
                    : String(actIdsSocio) === String(act.id);

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
                          className="text-[11px] font-semibold text-red-600 hover:text-red-800 hover:underline px-2 py-0.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
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
                        setTargetSocioId(String(currentSocio?.id || ''));
                      }}
                      className="w-full py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Inscribirme</span>
                    </button>
                  );
                })()
              ) : (
                <button
                  onClick={() => {
                    setSelectedActividadToEnroll(act);
                    setTargetSocioId('');
                  }}
                  disabled={isLleno}
                  className="w-full py-2 bg-[#1A365D] hover:bg-[#2B6CB0] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLleno ? 'Cupos Agotados' : 'Inscribir Socio del Padrón'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal para Restricción a Invitados */}
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
                className="p-1 text-white/80 hover:text-white rounded cursor-pointer"
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
                Para participar en nuestras disciplinas debes ser socio habilitado. Podés solicitar tu admisión online o ingresar con tu cuenta si ya sos socio.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={() => {
                    setShowGuestModal(false);
                    setActiveTab('inicio');
                  }}
                  className="px-4 py-2 bg-[#C53030] hover:bg-[#9B2C2C] text-white rounded-lg text-xs font-bold transition-colors text-center shadow-xs cursor-pointer"
                >
                  ¡Quiero ser Socio!
                </button>
                <button
                  onClick={() => {
                    setShowGuestModal(false);
                    quickSwitchUser('user-socio-activo');
                  }}
                  className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white rounded-lg text-xs font-bold transition-colors text-center shadow-xs cursor-pointer"
                >
                  Iniciar Sesión como Socio
                </button>
                <button
                  onClick={() => setShowGuestModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold text-center cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Inscripción para SOCIO */}
      {selectedActividadToEnroll && isSocio && currentSocio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-3.5 bg-[#1A365D] text-white border-b-2 border-[#C53030]">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-red-400" />
                <span className="font-bold text-sm tracking-wide">
                  CONFIRMAR MI INSCRIPCIÓN EN BD
                </span>
              </div>
              <button
                onClick={() => setSelectedActividadToEnroll(null)}
                className="p-1 text-white/80 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4 text-xs sm:text-sm text-slate-800">
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-900 border border-blue-200">
                <p className="font-bold text-sm text-[#1A365D] mb-1">{selectedActividadToEnroll.nombre}</p>
                <p>Arancel mensual: <strong>${Number(selectedActividadToEnroll.arancel ?? (selectedActividadToEnroll as any).costoMensual ?? 0).toLocaleString('es-AR')}/mes</strong></p>
                <p>Profesor: {selectedActividadToEnroll.instructorNombre || (selectedActividadToEnroll as any).instructor?.nombreCompleto || 'Instructor'} • {selectedActividadToEnroll.horaInicio && selectedActividadToEnroll.horaFin ? `${selectedActividadToEnroll.horaInicio} a ${selectedActividadToEnroll.horaFin}` : ((selectedActividadToEnroll as any).horario || '')} hs</p>
                <p>Lugar: {(selectedActividadToEnroll as any).lugar || 'Club El Globo'}</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Socio Solicitante:
                </span>
                <p className="text-sm font-black text-slate-900">
                  {currentSocio.nombreCompleto || `${currentSocio.nombre} ${currentSocio.apellido}`}
                </p>
                <div className="flex justify-between text-xs text-slate-600 pt-1">
                  <span>Socio N°: <strong>{currentSocio.numeroSocio || currentSocio.id}</strong></span>
                  <span>DNI: <strong>{currentSocio.dni}</strong></span>
                  <span>Categoría: <strong>{currentSocio.categoria}</strong></span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-start space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Inscripción Directa:</strong> Tu inscripción será procesada en el servidor y el arancel mensual se incluirá en tu próximo recibo.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedActividadToEnroll(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Confirmar Mi Inscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Inscripción para ADMIN / INSTRUCTOR */}
      {selectedActividadToEnroll && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-3.5 bg-[#1A365D] text-white border-b-2 border-[#C53030]">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-red-400" />
                <span className="font-bold text-sm tracking-wide uppercase">
                  INSCRIBIR EN {selectedActividadToEnroll.nombre} (BD)
                </span>
              </div>
              <button
                onClick={() => setSelectedActividadToEnroll(null)}
                className="p-1 text-white/80 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4 text-xs sm:text-sm text-slate-800">
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-900 border border-blue-200">
                <p>Arancel mensual: <strong>${Number(selectedActividadToEnroll.arancel ?? (selectedActividadToEnroll as any).costoMensual ?? 0).toLocaleString('es-AR')}</strong></p>
                <p>Profesor: {selectedActividadToEnroll.instructorNombre || (selectedActividadToEnroll as any).instructor?.nombreCompleto || 'Instructor'} • {selectedActividadToEnroll.horaInicio && selectedActividadToEnroll.horaFin ? `${selectedActividadToEnroll.horaInicio} a ${selectedActividadToEnroll.horaFin}` : ((selectedActividadToEnroll as any).horario || '')} hs</p>
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
                    const actIdsSocio = s.actividadesIds || (s as any).actividades || [];
                    const yaInscripto = Array.isArray(actIdsSocio)
                      ? actIdsSocio.some((id) => String(id) === String(selectedActividadToEnroll.id))
                      : String(actIdsSocio) === String(selectedActividadToEnroll.id);

                    const isSuspended = s.estado === 'SUSPENDIDO_MOROSIDAD';
                    const nombreSocioNorm = s.nombreCompleto || `${s.nombre || ''} ${s.apellido || ''}`.trim();

                    return (
                      <option
                        key={s.id}
                        value={String(s.id)}
                        disabled={yaInscripto || isSuspended}
                      >
                        {nombreSocioNorm} (DNI: {s.dni})
                        {isSuspended ? ' [BLOQUEADO POR MOROSIDAD]' : yaInscripto ? ' [YA INSCRIPTO]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-start space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Control de Morosidad:</strong> Socios que adeudan cuotas tienen inhabilitada la inscripción hasta regularizar su situación.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedActividadToEnroll(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!targetSocioId}
                  className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Confirmar Inscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Baja */}
      {actividadToUnenroll && isSocio && currentSocio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#1A365D] text-white font-bold text-sm border-b-2 border-[#C53030] flex justify-between items-center">
              <span>DARME DE BAJA DE LA DISCIPLINA</span>
              <button
                onClick={() => setActividadToUnenroll(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs text-slate-700">
              <p className="text-slate-800 font-medium">
                ¿Confirmas que deseas darte de baja de <strong>{actividadToUnenroll.nombre}</strong>?
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Al confirmar la baja en el servidor, liberarás tu cupo en la actividad.
              </p>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  onClick={() => setActividadToUnenroll(null)}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUnenrollSubmit}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Confirmar Baja en BD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};