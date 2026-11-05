import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  UserCheck,
  UserX,
  Save,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
export interface AsistenciaItem {
  socioId: string;
  socioNombre: string;
  presente: boolean;
}

export interface AsistenciaRegistro {
  id: string;
  actividadId: string;
  fecha: string;
  instructorId: string;
  asistencias: AsistenciaItem[];
}

export const AsistenciaTracker: React.FC = () => {
  const { actividades, socios, asistencias, saveAsistencia, currentUser } = useApp();

  // Seleccionar actividad inicial respetando la asignación del instructor o la lista de la BD
  const defaultActId = currentUser?.actividadId || (actividades.length > 0 ? String(actividades[0].id) : '');
  const [selectedActId, setSelectedActId] = useState<string>(defaultActId);
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);

  // Sincronizar selectedActId cuando carguen las actividades de la BD por primera vez
  useEffect(() => {
    if (!selectedActId && actividades.length > 0) {
      setSelectedActId(String(actividades[0].id));
    }
  }, [actividades, selectedActId]);

  const currentActividad = actividades.find((a) => String(a.id) === String(selectedActId));

  // Filtrar socios inscriptos en la actividad seleccionada considerando arrays o strings provenientes de la BD
  const enrolledSocios = socios.filter((s) => {
    const actIds = s.actividadesIds || (s as any).actividades || [];
    if (Array.isArray(actIds)) {
      return actIds.some((id) => String(id) === String(selectedActId));
    }
    return String(actIds) === String(selectedActId);
  });

  // Buscar registro de asistencia existente en el estado global para la fecha y actividad dada
  const existingRegistro = asistencias.find(
    (a) => String(a.actividadId) === String(selectedActId) && a.fecha === fecha
  );

  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>({});

  // Sincronizar el mapa de asistencias cuando cambia la actividad, la fecha o la lista de asistencias
  useEffect(() => {
    const existing = asistencias.find(
      (a) => String(a.actividadId) === String(selectedActId) && a.fecha === fecha
    );
    const updated: Record<string, boolean> = {};

    enrolledSocios.forEach((s) => {
      const socioIdStr = String(s.id);
      const match = existing?.asistencias?.find((item: any) => String(item.socioId) === socioIdStr);
      updated[socioIdStr] = match !== undefined ? match.presente : true;
    });

    setAttendanceState(updated);
  }, [selectedActId, fecha, asistencias, socios]);

  const toggleAttendance = (socioId: string | number) => {
    const key = String(socioId);
    setAttendanceState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    if (!currentActividad) return;

    const asistenciasList = enrolledSocios.map((s) => {
      const nombreSocioNorm = s.nombreCompleto || `${s.nombre || ''} ${s.apellido || ''}`.trim();
      return {
        socioId: String(s.id),
        socioNombre: nombreSocioNorm,
        presente: attendanceState[String(s.id)] ?? false,
      };
    });

    const nuevoRegistro: AsistenciaRegistro = {
      id: existingRegistro?.id || `asis-${Date.now()}`,
      actividadId: String(selectedActId),
      fecha,
      instructorId: String(currentUser?.id || ''),
      asistencias: asistenciasList,
    };

    await saveAsistencia(nuevoRegistro);
  };

  const presentesCount = Object.values(attendanceState).filter(Boolean).length;
  const totalEnrolled = enrolledSocios.length;
  const percentage = totalEnrolled > 0 ? Math.round((presentesCount / totalEnrolled) * 100) : 0;

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
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Disciplina:</label>
            <select
              value={selectedActId}
              onChange={(e) => setSelectedActId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {actividades.length === 0 ? (
                <option value="">Cargando disciplinas...</option>
              ) : (
                actividades.map((a) => {
                  const nombreProf = a.instructorNombre || (a as any).instructor?.nombreCompleto || 'Instructor';
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
        
        {/* Banner de la Actividad */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {currentActividad?.nombre || 'Seleccione una disciplina'}
            </h3>
            <p className="text-xs text-slate-500">
              Profesor: <strong>{currentActividad?.instructorNombre || (currentActividad as any)?.instructor?.nombreCompleto || 'Sin asignar'}</strong>
              {currentActividad?.dias ? ` • ${Array.isArray(currentActividad.dias) ? currentActividad.dias.join(', ') : currentActividad.dias}` : ''} 
              {currentActividad?.horario ? ` (${currentActividad.horario} hs)` : ''}
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
        {enrolledSocios.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No hay socios inscriptos en esta actividad en la base de datos actualmente.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {enrolledSocios.map((socio) => {
              const socioIdStr = String(socio.id);
              const isPresente = attendanceState[socioIdStr] ?? false;
              const nombreSocioNorm = socio.nombreCompleto || `${socio.nombre || ''} ${socio.apellido || ''}`.trim();
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
                        DNI: {socio.dni} • Cat: {socio.categoria}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleAttendance(socio.id)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                        isPresente
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={enrolledSocios.length === 0}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Planilla de Asistencia en BD</span>
          </button>
        </div>
      </div>
    </div>
  );
};