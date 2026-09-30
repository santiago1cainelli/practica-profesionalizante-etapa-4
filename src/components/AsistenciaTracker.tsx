import React, { useState } from 'react';
import {
  ClipboardCheck,
  Calendar,
  UserCheck,
  UserX,
  Save,
  CheckCircle,
  AlertCircle,
  Users,
  Trophy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AsistenciaRegistro } from '../types';

export const AsistenciaTracker: React.FC = () => {
  const { actividades, socios, asistencias, saveAsistencia, currentUser } = useApp();

  // Pick initial activity
  const defaultActId = currentUser.actividadId || actividades[0]?.id || '';
  const [selectedActId, setSelectedActId] = useState<string>(defaultActId);
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);

  const currentActividad = actividades.find((a) => a.id === selectedActId);
  const enrolledSocios = socios.filter((s) => s.actividadesIds.includes(selectedActId));

  // Find existing attendance for this date & activity or default all to present
  const existingRegistro = asistencias.find(
    (a) => a.actividadId === selectedActId && a.fecha === fecha
  );

  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    enrolledSocios.forEach((s) => {
      const match = existingRegistro?.asistencias.find((item) => item.socioId === s.id);
      initial[s.id] = match ? match.presente : true;
    });
    return initial;
  });

  // Re-sync attendance map when activity or date changes
  React.useEffect(() => {
    const existing = asistencias.find(
      (a) => a.actividadId === selectedActId && a.fecha === fecha
    );
    const updated: Record<string, boolean> = {};
    enrolledSocios.forEach((s) => {
      const match = existing?.asistencias.find((item) => item.socioId === s.id);
      updated[s.id] = match !== undefined ? match.presente : true;
    });
    setAttendanceState(updated);
  }, [selectedActId, fecha, asistencias]);

  const toggleAttendance = (socioId: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [socioId]: !prev[socioId],
    }));
  };

  const handleSave = () => {
    if (!currentActividad) return;

    const asistenciasList = enrolledSocios.map((s) => ({
      socioId: s.id,
      socioNombre: s.nombreCompleto,
      presente: attendanceState[s.id] ?? false,
    }));

    const nuevoRegistro: AsistenciaRegistro = {
      id: existingRegistro?.id || `asis-${Date.now()}`,
      actividadId: selectedActId,
      fecha,
      instructorId: currentUser.id,
      asistencias: asistenciasList,
    };

    saveAsistencia(nuevoRegistro);
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
              Panel del Instructor
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

        {/* Date and Activity Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Disciplina:</label>
            <select
              value={selectedActId}
              onChange={(e) => setSelectedActId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {actividades.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} ({a.instructorNombre})
                </option>
              ))}
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

      {/* Main Attendance List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Activity Banner */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{currentActividad?.nombre}</h3>
            <p className="text-xs text-slate-500">
              Profesor: <strong>{currentActividad?.instructorNombre}</strong> • {currentActividad?.dias.join(', ')} ({currentActividad?.horario} hs)
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs">
            <span>Presentismo:</span>
            <strong className="text-teal-700 font-bold">
              {presentesCount} de {totalEnrolled} ({percentage}%)
            </strong>
          </div>
        </div>

        {/* Members List */}
        {enrolledSocios.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No hay socios inscriptos en esta actividad actualmente.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {enrolledSocios.map((socio) => {
              const isPresente = attendanceState[socio.id] ?? false;

              return (
                <div
                  key={socio.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs">
                      {socio.numeroSocio}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{socio.nombreCompleto}</h4>
                      <p className="text-[11px] text-slate-500">DNI: {socio.dni} • Cat: {socio.categoria}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleAttendance(socio.id)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 ${
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

        {/* Footer with Save Action */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={enrolledSocios.length === 0}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Planilla de Asistencia</span>
          </button>
        </div>
      </div>
    </div>
  );
};
