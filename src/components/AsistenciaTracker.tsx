import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardCheck,
  UserCheck,
  UserX,
  Save,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { useClub } from '../context/AppProvider';
import api from '../api/axios';

export const AsistenciaTracker: React.FC = () => {
  const { actividades, currentUser, showToast } = useClub();

  // Lista de inscripciones de la actividad seleccionada provenientes directamente de la BD
  const [inscripcionesActividad, setInscripcionesActividad] = useState<any[]>([]);
  const [isLoadingInscripciones, setIsLoadingInscripciones] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Mapa de asistencia por socioId: true = presente (1), false = ausente (0)
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>({});

  // Función que determina si una actividad es impartida por el instructor actualmente autenticado
  const isActividadImpartidaPorMi = (act: any): boolean => {
    if (!currentUser) return false;
    // El administrador tiene permiso global sobre todas las actividades
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role !== 'INSTRUCTOR') return false;

    // 1. Coincidencia por actividadId explícito en el usuario
    if (currentUser.actividadId && String(act.id) === String(currentUser.actividadId)) {
      return true;
    }

    // 2. Coincidencia por ID de instructor (backend: act.instructor.id / act.instructorId)
    const actInstructorId =
      act.instructor?.id !== undefined
        ? String(act.instructor.id)
        : act.instructorId !== undefined
        ? String(act.instructorId)
        : null;

    const myInstructorId = currentUser.instructorId ? String(currentUser.instructorId) : null;
    const myUserId = currentUser.id ? String(currentUser.id) : null;

    if (actInstructorId) {
      if (myInstructorId && actInstructorId === myInstructorId) return true;
      if (myUserId && actInstructorId === myUserId) return true;
    }

    // 3. Coincidencia por correo electrónico
    if (currentUser.email && act.instructor?.email) {
      if (act.instructor.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return true;
      }
    }

    // 4. Coincidencia por nombre / apellido del profesor
    const profNombre = (
      act.instructorNombre ||
      (act.instructor ? `${act.instructor.nombre || ''} ${act.instructor.apellido || ''}` : '')
    )
      .toLowerCase()
      .trim();

    const myNombre = (currentUser.nombreCompleto || '')
      .toLowerCase()
      .replace(/prof\.\s*/i, '')
      .replace(/\(instructor\)/i, '')
      .trim();

    if (profNombre && myNombre) {
      const palabras = myNombre.split(' ').filter((p: string) => p.length > 2);
      if (palabras.some((palabra: string) => profNombre.includes(palabra))) {
        return true;
      }
    }

    return false;
  };

  const misActividades = useMemo(
    () => actividades.filter(isActividadImpartidaPorMi),
    [actividades, currentUser]
  );
  const otrasActividades = useMemo(
    () => actividades.filter((a) => !isActividadImpartidaPorMi(a)),
    [actividades, currentUser]
  );

  const [soloMisActividades, setSoloMisActividades] = useState<boolean>(currentUser?.role === 'INSTRUCTOR');

  // Seleccionar actividad inicial respetando la asignación del instructor o la lista de la BD
  const defaultActId =
    currentUser?.role === 'INSTRUCTOR' && misActividades.length > 0
      ? String(misActividades[0].id)
      : currentUser?.actividadId || (actividades.length > 0 ? String(actividades[0].id) : '');

  const [selectedActId, setSelectedActId] = useState<string>(defaultActId);
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);

  // Sincronizar selectedActId cuando carguen las actividades de la BD por primera vez
  useEffect(() => {
    if (actividades.length > 0) {
      if (currentUser?.role === 'INSTRUCTOR') {
        const mis = actividades.filter(isActividadImpartidaPorMi);
        if (mis.length > 0) {
          const yaSeleccionadaEsMia = mis.some((a) => String(a.id) === String(selectedActId));
          if (!yaSeleccionadaEsMia) {
            setSelectedActId(String(mis[0].id));
            return;
          }
        }
      }
      if (!selectedActId) {
        setSelectedActId(String(actividades[0].id));
      }
    }
  }, [actividades, currentUser]);

  const currentActividad = actividades.find((a) => String(a.id) === String(selectedActId));

  // Determinar si el usuario tiene permiso para modificar esta actividad
  const puedeModificar =
    currentUser?.role === 'ADMIN' ||
    (currentActividad ? isActividadImpartidaPorMi(currentActividad) : false);

  // Cargar las inscripciones de la actividad directamente desde el endpoint GET /inscripciones?actividadId=...
  const fetchInscripcionesDeActividad = useCallback(async (actId: string) => {
    if (!actId) {
      setInscripcionesActividad([]);
      setAttendanceState({});
      return;
    }
    setIsLoadingInscripciones(true);
    try {
      const res = await api.get(`/inscripciones?actividadId=${actId}`);
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setInscripcionesActividad(data);
        // Sincronizar attendanceState con la columna asistencia de la BD (1 = presente, 0 = ausente)
        const updatedAttendance: Record<string, boolean> = {};
        data.forEach((insc: any) => {
          const sId = String(insc.socio?.id || insc.socioId);
          // 0 representa ausente (false), 1 representa presente (true)
          updatedAttendance[sId] = Number(insc.asistencia) === 1;
        });
        setAttendanceState(updatedAttendance);
      } else {
        setInscripcionesActividad([]);
        setAttendanceState({});
      }
    } catch (error) {
      console.warn('Error al cargar inscripciones de la actividad:', error);
      setInscripcionesActividad([]);
      setAttendanceState({});
    } finally {
      setIsLoadingInscripciones(false);
    }
  }, []);

  useEffect(() => {
    if (selectedActId) {
      setInscripcionesActividad([]);
      fetchInscripcionesDeActividad(selectedActId);
    } else {
      setInscripcionesActividad([]);
      setAttendanceState({});
    }
  }, [selectedActId, fetchInscripcionesDeActividad]);

  // Lista de socios inscriptos para la vista - EXCLUSIVAMENTE a partir de la tabla inscripciones (sin fallback a contexto)
  const sociosParaAsistencia = useMemo(() => {
    return inscripcionesActividad
      .filter((insc: any) => {
        if (!insc) return false;
        // Excluir inscripciones dadas de baja o inactivas
        if (insc.activa === false || insc.activa === 0) return false;
        // Excluir socios dados de baja
        if (insc.socio && insc.socio.estado === 'BAJA') return false;
        return Boolean(insc.socio?.id || insc.socioId);
      })
      .map((insc: any) => {
        const socioData = insc.socio || {};
        const socioId = insc.socio?.id || insc.socioId;

        const nombreCompleto =
          socioData.nombreCompleto ||
          `${socioData.nombre || ''} ${socioData.apellido || ''}`.trim() ||
          `Socio #${socioId}`;

        return {
          ...socioData,
          id: socioId,
          inscripcionId: insc.id,
          asistenciaBd: Number(insc.asistencia) === 1 ? 1 : 0,
          nombreCompleto,
          dni: socioData.dni || '-',
          numeroSocio: socioData.numeroSocio || socioId,
          categoria: socioData.categoria || 'ACTIVO',
          estado: socioData.estado || 'ACTIVO',
        };
      });
  }, [inscripcionesActividad]);

  const toggleAttendance = (socioId: string | number) => {
    if (!puedeModificar) {
      showToast(
        'warning',
        'Modo Solo Lectura',
        'Solo puedes registrar y modificar la asistencia de las disciplinas que tienes a tu cargo.'
      );
      return;
    }
    const key = String(socioId);
    setAttendanceState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ✅ Guardado directo en la BD (tabla inscripciones, columna asistencia: 0 ausente, 1 presente)
  const handleSave = async () => {
    if (!currentActividad) return;

    if (!puedeModificar) {
      showToast(
        'error',
        'Acción Denegada',
        'No tienes permisos para modificar la asistencia de una disciplina a cargo de otro docente.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const asistenciasPayload = sociosParaAsistencia.map((s: any) => {
        const isPresente = Boolean(attendanceState[String(s.id)]);
        return {
          inscripcionId: s.inscripcionId ? Number(s.inscripcionId) : undefined,
          socioId: Number(s.id),
          asistencia: isPresente ? 1 : 0, // 0 = ausente, 1 = presente en la columna asistencia
        };
      });

      // Guardar en lote en el endpoint de la API REST (tabla inscripciones, columna asistencia)
      await api.put(`/inscripciones/actividad/${selectedActId}/asistencias`, {
        asistencias: asistenciasPayload,
      });

      // Refrescar inscripciones desde la BD para asegurar persistencia
      await fetchInscripcionesDeActividad(selectedActId);

      showToast(
        'success',
        'Asistencias guardadas en BD',
        'El presentismo fue guardado.'
      );
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al guardar asistencias en la base de datos.';
      showToast('error', 'Error al guardar', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Cálculo exacto basado en socios inscriptos
  const presentesCount = sociosParaAsistencia.filter((s) => attendanceState[String(s.id)]).length;
  const totalEnrolled = sociosParaAsistencia.length;
  const percentage = totalEnrolled > 0 ? Math.round((presentesCount / totalEnrolled) * 100) : 0;

  // ✅ Compatibilidad con los campos reales de la BD (diasSemana, horaInicio, horaFin)
  const diasTexto = currentActividad
    ? currentActividad.diasSemana ||
      (Array.isArray(currentActividad.dias)
        ? currentActividad.dias.join(', ')
        : currentActividad.dias) ||
      ''
    : '';

  const horarioTexto = currentActividad
    ? currentActividad.horaInicio && currentActividad.horaFin
      ? `${currentActividad.horaInicio} a ${currentActividad.horaFin}`
      : currentActividad.horario || ''
    : '';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-teal-600 text-white">
              Panel del Instructor BD
            </span>
            <span className="text-xs text-slate-500 font-medium">Control Diario de Presentismo</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1A365D] tracking-tight flex items-center space-x-2">
            <ClipboardCheck className="w-6 h-6 text-teal-600" />
            <span>Planilla de Asistencia a Entrenamientos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro y trazabilidad de asistencias para los profesores del Club Social y Deportivo El Globo.
          </p>
        </div>

        {/* Seleccionadores de Actividad y Fecha */}
        <div className="flex flex-wrap items-center gap-3">
          {currentUser?.role === 'INSTRUCTOR' && (
            <div className="flex items-center space-x-1.5 self-end mb-1">
              <label className="text-[11px] text-slate-600 font-semibold cursor-pointer flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={soloMisActividades}
                  onChange={(e) => setSoloMisActividades(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                />
                <span>Solo mis disciplinas</span>
              </label>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Disciplina:</label>
            <select
              value={selectedActId}
              onChange={(e) => setSelectedActId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {actividades.length === 0 ? (
                <option value="">Cargando disciplinas...</option>
              ) : currentUser?.role === 'INSTRUCTOR' ? (
                <>
                  <optgroup label="Mis Disciplinas a Cargo (Habilitadas)">
                    {misActividades.length === 0 ? (
                      <option disabled value="">Sin disciplinas asignadas</option>
                    ) : (
                      misActividades.map((a) => (
                        <option key={a.id} value={String(a.id)}>
                          ✓ {a.nombre}
                        </option>
                      ))
                    )}
                  </optgroup>
                  {!soloMisActividades && otrasActividades.length > 0 && (
                    <optgroup label="Otras Disciplinas (Solo Lectura)">
                      {otrasActividades.map((a) => {
                        const nombreProf =
                          a.instructorNombre || (a as any).instructor?.nombreCompleto || 'Otro Instructor';
                        return (
                          <option key={a.id} value={String(a.id)}>
                            🔒 {a.nombre} ({nombreProf})
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </>
              ) : (
                actividades.map((a) => {
                  const nombreProf =
                    a.instructorNombre || (a as any).instructor?.nombreCompleto || 'Instructor';
                  return (
                    <option key={a.id} value={String(a.id)}>
                      {a.nombre} ({nombreProf})
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Fecha:</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Lista Principal de Asistencia */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Banner de Permisos de Edición */}
        {!puedeModificar ? (
          <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Modo Solo Lectura:</strong> Esta disciplina está a cargo del{' '}
                <strong>
                  {currentActividad?.instructorNombre ||
                    (currentActividad as any)?.instructor?.nombreCompleto ||
                    'otro profesor'}
                </strong>
                . Solo el docente a cargo puede modificar el presentismo.
              </span>
            </div>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] font-bold uppercase shrink-0">
              Solo Lectura
            </span>
          </div>
        ) : currentUser?.role === 'INSTRUCTOR' ? (
          <div className="bg-teal-50 px-4 py-2 border-b border-teal-200 flex items-center space-x-2 text-xs text-teal-900">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong>Profesor Titular:</strong> Tienes permisos habilitados para registrar y guardar el presentismo de esta disciplina.
            </span>
          </div>
        ) : null}

        {/* Banner de la Actividad */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">
                {currentActividad?.nombre || 'Seleccione una disciplina'}
              </h3>
              {!puedeModificar && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold border border-amber-200 flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>No editable</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Profesor:{' '}
              <strong>
                {currentActividad?.instructorNombre ||
                  (currentActividad as any)?.instructor?.nombreCompleto ||
                  'Sin asignar'}
              </strong>
              {diasTexto ? ` • ${diasTexto}` : ''}
              {horarioTexto ? ` (${horarioTexto} hs)` : ''}
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs">
            <span>Presentismo:</span>
            <strong className="text-teal-700 font-bold">
              {presentesCount} de {totalEnrolled} ({percentage}%)
            </strong>
          </div>
        </div>

        {/* Lista de Socios Inscriptos */}
        {isLoadingInscripciones ? (
          <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>Cargando inscripciones desde la base de datos...</span>
          </div>
        ) : sociosParaAsistencia.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No hay socios inscriptos en esta actividad en la base de datos actualmente.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sociosParaAsistencia.map((socio: any) => {
              const socioIdStr = String(socio.id);
              const isPresente = attendanceState[socioIdStr] ?? false;
              const nombreSocioNorm =
                socio.nombreCompleto || `${socio.nombre || ''} ${socio.apellido || ''}`.trim();
              const numSocioNorm = socio.numeroSocio || socio.id;

              return (
                <div
                  key={socio.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs">
                      {numSocioNorm}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{nombreSocioNorm}</h4>
                      <p className="text-[11px] text-slate-500">
                        DNI: {socio.dni} • Cat: {socio.categoria || 'ACTIVO'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleAttendance(socio.id)}
                      disabled={!puedeModificar || isSaving}
                      title={
                        !puedeModificar
                          ? 'Solo el profesor a cargo puede cambiar el estado de asistencia'
                          : 'Clic para alternar entre Presente y Ausente'
                      }
                      className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 ${
                        !puedeModificar
                          ? 'opacity-60 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200'
                          : isPresente
                          ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer'
                      }`}
                    >
                      {!puedeModificar && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                      {isPresente ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      <span>{isPresente ? 'PRESENTE' : 'AUSENTE'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Guardar Planilla */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-500">
            {!puedeModificar ? (
              <span className="flex items-center space-x-1 text-amber-700 font-medium">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Edición bloqueada: no eres el profesor titular de esta disciplina.</span>
              </span>
            ) : (
              <span>
                Las asistencias se guardan en la tabla <strong>inscripciones</strong>.
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!puedeModificar || sociosParaAsistencia.length === 0 || isSaving}
            title={
              !puedeModificar
                ? 'Solo el profesor titular de la disciplina puede guardar cambios'
                : sociosParaAsistencia.length === 0
                ? 'No hay socios inscriptos para registrar'
                : 'Guardar la asistencia en la tabla inscripciones de la base de datos'
            }
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {!puedeModificar ? (
              <Lock className="w-4 h-4" />
            ) : isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {!puedeModificar
                ? 'Edición Bloqueada (Solo Lectura)'
                : isSaving
                ? 'Guardando en BD...'
                : 'Guardar Asistencia en BD'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
