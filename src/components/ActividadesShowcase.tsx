import React, { useState } from 'react';
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
  UserMinus,
  Users,
  X
} from 'lucide-react';
import { Actividad } from '../context/AppContext';
import { useClub } from '../context/AppProvider';

export const ActividadesShowcase: React.FC = () => {
  const {
    actividades,
    instructores,
    socios,
    enrollSocioInActividad,
    unenrollSocioFromActividad,
    currentUser,
    setActiveTab,
    openLoginModal,
    showToast,
  } = useClub();

  const getInstructorNombre = (act: any): string => {
    if (act.instructorNombre) return act.instructorNombre;
    if (act.instructor) {
      return (
        act.instructor.nombreCompleto ||
        `${act.instructor.nombre || ''} ${act.instructor.apellido || ''}`.trim()
      );
    }
    if (act.instructorId) {
      const found = instructores.find((i) => String(i.id) === String(act.instructorId));
      if (found) {
        return (
          found.nombreCompleto ||
          `${(found as any).nombre || ''} ${(found as any).apellido || ''}`.trim()
        );
      }
    }
    return '';
  };

  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActividadToEnroll, setSelectedActividadToEnroll] = useState<Actividad | null>(null);
  const [targetSocioId, setTargetSocioId] = useState<string>('');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [actividadToUnenroll, setActividadToUnenroll] = useState<Actividad | null>(null);
  const [socioToUnenroll, setSocioToUnenroll] = useState<{ id: string | number; nombre: string } | null>(null);
  const [actividadToManageInscriptos, setActividadToManageInscriptos] = useState<Actividad | null>(null);

  const isGuest = currentUser?.role === 'PUBLICO';
  const isSocio = currentUser?.role === 'SOCIO';
  const isSystemAdmin = currentUser?.role === 'ADMIN';
  const isInstructor = currentUser?.role === 'INSTRUCTOR';
  const isAdmin = isSystemAdmin || isInstructor;

  // Si está logueado como socio, identificar su perfil en el padrón de la BD
  const currentSocio = isSocio
    ? socios.find((s) => String(s.id) === String(currentUser.socioId)) ||
      socios.find((s) => s.email === currentUser.email)
    : null;

  // Identificar el registro exacto del instructor logueado en la lista de instructores
  const currentInstructorRecord = isInstructor
    ? instructores.find(
        (i) =>
          ((currentUser as any).instructorId &&
            String(i.id) === String((currentUser as any).instructorId)) ||
          (currentUser.email && i.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
          ((i as any).usuarioId && currentUser.id && String((i as any).usuarioId) === String(currentUser.id))
      )
    : null;

  // Determina de forma estricta si una actividad es dictada por el instructor autenticado
  const isActividadImpartidaPorMi = (act: Actividad): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role !== 'INSTRUCTOR') return false;

    const actAny = act as any;

    // 1. Coincidencia por actividadId explícito en el usuario
    if ((currentUser as any).actividadId && String(act.id) === String((currentUser as any).actividadId)) {
      return true;
    }

    // Extraer el ID de instructor asignado a la actividad
    const actInstructorId =
      actAny.instructor?.id !== undefined && actAny.instructor?.id !== null
        ? String(actAny.instructor.id)
        : actAny.instructorId !== undefined && actAny.instructorId !== null
        ? String(actAny.instructorId)
        : null;

    // 2. Coincidencia exacta por instructorId del usuario o del registro en tabla instructores
    const resolvedMyInstructorId =
      (currentUser as any).instructorId !== undefined && (currentUser as any).instructorId !== null
        ? String((currentUser as any).instructorId)
        : currentInstructorRecord?.id !== undefined
        ? String(currentInstructorRecord.id)
        : null;

    if (actInstructorId && resolvedMyInstructorId) {
      return actInstructorId === resolvedMyInstructorId;
    }

    // 3. Coincidencia por email del instructor de la actividad
    if (currentUser.email && actAny.instructor?.email) {
      return actAny.instructor.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim();
    }

    // 4. Coincidencia exacta de nombre completo (solo si la actividad no tiene instructorId vinculado)
    if (!actInstructorId) {
      const normalize = (str: string) =>
        str
          .toLowerCase()
          .replace(/prof\.\s*/gi, '')
          .replace(/\(instructor\)/gi, '')
          .trim();

      const profNombre = normalize(getInstructorNombre(actAny));
      const myNombre = normalize(
        (currentUser as any).nombreCompleto ||
          `${(currentUser as any).nombre || ''} ${(currentUser as any).apellido || ''}`
      );

      if (profNombre && myNombre && profNombre === myNombre) {
        return true;
      }
    }

    return false;
  };

  // Función utilitaria para obtener los socios inscriptos en una disciplina
  const getInscriptosForActividad = (act: Actividad) => {
    const inscriptosPadron = socios.filter((s) => {
      const actIds = s.actividadesIds || (s as any).actividades || [];
      return Array.isArray(actIds)
        ? actIds.some((id) => String(id) === String(act.id))
        : String(actIds) === String(act.id);
    });

    const inscripcionesActivas = Array.isArray((act as any).inscripciones)
      ? (act as any).inscripciones.filter((i: any) => i.activa !== false)
      : [];

    const mapInscriptos = new Map<
      string | number,
      { id: string | number; nombre: string; numeroSocio?: string | number; dni?: string }
    >();

    inscriptosPadron.forEach((s) => {
      const nombre = s.nombreCompleto || `${s.nombre || ''} ${s.apellido || ''}`.trim() || `Socio #${s.id}`;
      mapInscriptos.set(String(s.id), { id: s.id, nombre, numeroSocio: s.numeroSocio, dni: s.dni });
    });

    inscripcionesActivas.forEach((i: any) => {
      const sId = i.socio?.id || i.socioId;
      if (sId) {
        const socioObj = socios.find((s) => String(s.id) === String(sId));
        const nombre =
          i.socio?.nombreCompleto ||
          `${i.socio?.nombre || ''} ${i.socio?.apellido || ''}`.trim() ||
          i.socioNombre ||
          socioObj?.nombreCompleto ||
          `${socioObj?.nombre || ''} ${socioObj?.apellido || ''}`.trim() ||
          `Socio #${sId}`;
        const numeroSocio = i.socio?.numeroSocio || socioObj?.numeroSocio;
        const dni = i.socio?.dni || socioObj?.dni;
        mapInscriptos.set(String(sId), { id: sId, nombre, numeroSocio, dni });
      }
    });

    return Array.from(mapInscriptos.values());
  };

  const categoriasUnicas = Array.from(
    new Set(actividades.map((a: any) => (a as any).categoria || a.turno || 'Deporte'))
  ).filter(Boolean);

  const filteredActividades = actividades.filter((act: any) => {
    const matchesCat =
      selectedCategoria === 'TODAS' ||
      (act as any).categoria === selectedCategoria ||
      act.turno === selectedCategoria;
    const term = searchQuery.toLowerCase();
    const nombreAct = (act.nombre || '').toLowerCase();
    const nombreProf = getInstructorNombre(act).toLowerCase();
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

    if (isInstructor && !isActividadImpartidaPorMi(selectedActividadToEnroll)) {
      showToast('error', 'Acceso denegado', 'Solo puedes inscribir socios en actividades que tienes a tu cargo.');
      return;
    }

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
    if (actividadToUnenroll) {
      if (isInstructor && !isActividadImpartidaPorMi(actividadToUnenroll)) {
        showToast('error', 'Acceso denegado', 'Solo puedes dar de baja socios en actividades que tienes a tu cargo.');
        return;
      }

      const socioId = socioToUnenroll ? socioToUnenroll.id : currentSocio?.id;
      if (socioId) {
        await unenrollSocioFromActividad(String(socioId), String(actividadToUnenroll.id));
      }
      setActividadToUnenroll(null);
      setSocioToUnenroll(null);
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
            {isInstructor && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-700 text-white">
                Panel de Instructor
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
              onClick={() => openLoginModal()}
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

      {/* Cartel informativo para Instructor */}
      {isInstructor && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <strong className="block font-bold text-emerald-950 text-sm">
                Gestión de Disciplinas del Instructor
              </strong>
              <span className="text-emerald-800">
                Solo puedes inscribir o dar de baja socios en las actividades asignadas a tu cargo (identificadas con la etiqueta "Tu disciplina").
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grilla de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredActividades.map((act) => {
          const inscriptosList = getInscriptosForActividad(act);
          const inscripcionesActivas = Array.isArray((act as any).inscripciones)
            ? (act as any).inscripciones.filter((i: any) => i.activa !== false)
            : [];

          // Determinar si el usuario actual tiene permisos de modificación sobre esta actividad
          const canManageActividad = isSystemAdmin || (isInstructor && isActividadImpartidaPorMi(act));
          const isOwnInstructorAct = isInstructor && isActividadImpartidaPorMi(act);

          // Calcular cupos y ocupación tomando el mayor valor real disponible
          const cupoMax = Number(act.cupoMaximo || (act as any).cupo || 30);
          const cupoOcup = Math.max(
            Number(act.cupoOcupado ?? (act as any).inscriptosCount ?? (act as any)._count?.inscripciones ?? 0),
            inscripcionesActivas.length,
            inscriptosList.length
          );

          const costoMensual = Number((act as any).costoMensual || act.arancel || 0);
          const instructorNombre = getInstructorNombre(act) || 'Sin Asignar';
          const diasStr =
            act.diasSemana ||
            (Array.isArray((act as any).dias) ? (act as any).dias.join(', ') : (act as any).dias) ||
            'Días a coordinar';

          const cupoPorcentaje = cupoMax > 0 ? Math.round((cupoOcup / cupoMax) * 100) : 0;
          const isLleno = cupoOcup >= cupoMax;

          const nombresInscriptos = inscriptosList.map((i) => i.nombre);

          return (
            <div
              key={act.id}
              className={`bg-white rounded-xl border shadow-xs transition-all p-5 flex flex-col justify-between ${
                isOwnInstructorAct
                  ? 'border-emerald-300 ring-1 ring-emerald-200'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
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
                    <span>
                      {act.horaInicio && act.horaFin
                        ? `${act.horaInicio} a ${act.horaFin}`
                        : (act as any).horario || 'Horario a confirmar'}{' '}
                      hs
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{(act as any).lugar || 'Instalaciones del Club'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-[#2B6CB0] shrink-0" />
                    <span className="font-semibold text-slate-800">{instructorNombre}</span>
                    {isOwnInstructorAct && (
                      <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Tu disciplina
                      </span>
                    )}
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

                {/* Lista de inscriptos con acciones únicamente si canManageActividad es true */}
                <div className="text-[11px] text-slate-500 mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <strong className="text-slate-700 flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Socios Inscriptos ({cupoOcup}):</span>
                    </strong>
                    {canManageActividad && inscriptosList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActividadToManageInscriptos(act)}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Gestionar lista
                      </button>
                    )}
                  </div>

                  {cupoOcup === 0 || inscriptosList.length === 0 ? (
                    <span className="italic text-slate-400">Sin inscriptos actualmente</span>
                  ) : canManageActividad ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {inscriptosList.slice(0, 4).map((soc) => (
                        <span
                          key={soc.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-800 border border-slate-200"
                        >
                          <span className="truncate max-w-[100px]" title={soc.nombre}>
                            {soc.nombre}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSocioToUnenroll(soc);
                              setActividadToUnenroll(act);
                            }}
                            title={`Dar de baja a ${soc.nombre} de esta actividad`}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded p-0.5 transition-colors cursor-pointer"
                          >
                            <UserMinus className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {inscriptosList.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setActividadToManageInscriptos(act)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                        >
                          +{inscriptosList.length - 4} más...
                        </button>
                      )}
                    </div>
                  ) : (
                    <span>{nombresInscriptos.join(', ')}</span>
                  )}
                </div>
              </div>

              {/* Botón de acción según el Rol y pertenencia */}
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
                  const actIdsSocio = currentSocio
                    ? currentSocio.actividadesIds || (currentSocio as any).actividades || []
                    : [];
                  const isEnrolled =
                    (Array.isArray(actIdsSocio) && actIdsSocio.some((id) => String(id) === String(act.id))) ||
                    String(actIdsSocio) === String(act.id) ||
                    (currentSocio?.id &&
                      inscripcionesActivas.some(
                        (i: any) => String(i.socio?.id || i.socioId) === String(currentSocio.id)
                      ));

                  const isSuspended = currentSocio?.estado === 'SUSPENDIDO';

                  if (isEnrolled) {
                    return (
                      <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Ya estás inscripto</span>
                        </span>
                        <button
                          onClick={() => {
                            if (currentSocio) {
                              setSocioToUnenroll({
                                id: currentSocio.id,
                                nombre: currentSocio.nombreCompleto || currentSocio.nombre,
                              });
                              setActividadToUnenroll(act);
                            }
                          }}
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
              ) : !canManageActividad ? (
                <button
                  disabled
                  className="w-full py-2 bg-slate-100 border border-slate-200 text-slate-400 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-not-allowed opacity-80"
                  title="Solo el profesor a cargo de esta disciplina o el Administrador pueden inscribir o dar de baja socios aquí"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sin permisos (otro profesor a cargo)</span>
                </button>
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
                    openLoginModal();
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
                <p>
                  Arancel mensual:{' '}
                  <strong>
                    ${Number(selectedActividadToEnroll.arancel ?? (selectedActividadToEnroll as any).costoMensual ?? 0).toLocaleString('es-AR')}/mes
                  </strong>
                </p>
                <p>
                  Profesor: {getInstructorNombre(selectedActividadToEnroll) || 'Sin Asignar'} •{' '}
                  {selectedActividadToEnroll.horaInicio && selectedActividadToEnroll.horaFin
                    ? `${selectedActividadToEnroll.horaInicio} a ${selectedActividadToEnroll.horaFin}`
                    : (selectedActividadToEnroll as any).horario || ''}{' '}
                  hs
                </p>
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
                  <span>
                    Socio N°: <strong>{currentSocio.numeroSocio || currentSocio.id}</strong>
                  </span>
                  <span>
                    DNI: <strong>{currentSocio.dni}</strong>
                  </span>
                  <span>
                    Categoría: <strong>{currentSocio.categoria}</strong>
                  </span>
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

      {/* Modal de Inscripción para ADMIN / INSTRUCTOR A CARGO */}
      {selectedActividadToEnroll &&
        (isSystemAdmin || (isInstructor && isActividadImpartidaPorMi(selectedActividadToEnroll))) && (
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
                  <p>
                    Arancel mensual:{' '}
                    <strong>
                      ${Number(selectedActividadToEnroll.arancel ?? (selectedActividadToEnroll as any).costoMensual ?? 0).toLocaleString('es-AR')}
                    </strong>
                  </p>
                  <p>
                    Profesor: {getInstructorNombre(selectedActividadToEnroll) || 'Sin Asignar'} •{' '}
                    {selectedActividadToEnroll.horaInicio && selectedActividadToEnroll.horaFin
                      ? `${selectedActividadToEnroll.horaInicio} a ${selectedActividadToEnroll.horaFin}`
                      : (selectedActividadToEnroll as any).horario || ''}{' '}
                    hs
                  </p>
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

                      const isSuspended = s.estado === 'SUSPENDIDO';
                      const nombreSocioNorm = s.nombreCompleto || `${s.nombre || ''} ${s.apellido || ''}`.trim();

                      return (
                        <option key={s.id} value={String(s.id)} disabled={yaInscripto || isSuspended}>
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
      {actividadToUnenroll &&
        (isSocio || isSystemAdmin || (isInstructor && isActividadImpartidaPorMi(actividadToUnenroll))) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95">
              <div className="px-5 py-3.5 bg-[#1A365D] text-white font-bold text-sm border-b-2 border-[#C53030] flex justify-between items-center">
                <span>
                  {isAdmin ? 'DAR DE BAJA SOCIO DE LA DISCIPLINA' : 'DARME DE BAJA DE LA DISCIPLINA'}
                </span>
                <button
                  onClick={() => {
                    setActividadToUnenroll(null);
                    setSocioToUnenroll(null);
                  }}
                  className="text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-3 text-xs text-slate-700">
                <p className="text-slate-800 font-medium">
                  ¿Confirmas que deseas dar de baja a{' '}
                  <strong>
                    {socioToUnenroll?.nombre ||
                      (currentSocio ? currentSocio.nombreCompleto || currentSocio.nombre : 'este socio')}
                  </strong>{' '}
                  de la actividad <strong>{actividadToUnenroll.nombre}</strong>?
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Al confirmar la baja en el servidor, se liberará el cupo en la disciplina.
                </p>
                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActividadToUnenroll(null);
                      setSocioToUnenroll(null);
                    }}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
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

      {/* Modal para Administrar / Dar de baja Inscriptos (Admin / Instructor a cargo) */}
      {actividadToManageInscriptos &&
        (isSystemAdmin || (isInstructor && isActividadImpartidaPorMi(actividadToManageInscriptos))) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95">
              <div className="px-5 py-3.5 bg-[#1A365D] text-white font-bold text-sm border-b-2 border-[#C53030] flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="uppercase tracking-wider">
                    Inscriptos: {actividadToManageInscriptos.nombre}
                  </span>
                </div>
                <button
                  onClick={() => setActividadToManageInscriptos(null)}
                  className="text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs text-slate-700">
                <p className="text-slate-600">
                  Listado oficial de socios matriculados en esta disciplina. El profesor a cargo y los administradores pueden dar de baja a cualquier socio para liberar vacantes.
                </p>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {(() => {
                    const currentAct =
                      actividades.find((a) => a.id === actividadToManageInscriptos.id) ||
                      actividadToManageInscriptos;
                    const currentInscriptos = getInscriptosForActividad(currentAct);
                    if (currentInscriptos.length === 0) {
                      return (
                        <div className="p-4 text-center text-slate-400 italic">
                          No hay socios inscriptos actualmente en esta disciplina.
                        </div>
                      );
                    }
                    return currentInscriptos.map((soc) => (
                      <div
                        key={soc.id}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{soc.nombre}</div>
                          <div className="text-[11px] text-slate-500">
                            {soc.numeroSocio ? `Socio N° ${soc.numeroSocio}` : `ID #${soc.id}`}
                            {soc.dni ? ` • DNI: ${soc.dni}` : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSocioToUnenroll(soc);
                            setActividadToUnenroll(currentAct);
                          }}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                          title={`Dar de baja a ${soc.nombre}`}
                        >
                          <UserMinus className="w-3.5 h-3.5 text-red-600" />
                          <span>Dar de baja</span>
                        </button>
                      </div>
                    ));
                  })()}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActividadToManageInscriptos(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};