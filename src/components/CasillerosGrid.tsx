import React, { useState, useEffect } from 'react';
import {
  Grid,
  Search,
  Info,
} from 'lucide-react';
import { casilleros } from '../types';
import { useClub } from '../context/AppProvider';
import { useApi } from '../hooks/useApi';

export type LockerData = casilleros & {
  numero: number;
  socioId?: number | null;
  socio_id?: number | null;
  socio?: { id: number; nombre?: string; apellido?: string; nombreCompleto?: string; dni?: string } | null;
  costoMensual?: number;
  fechaAlquiler?: string;
};

// ✅ Helper para extraer el ID del socio asignado sin importar cómo lo devuelva MySQL/Backend
const getAssignedSocioId = (locker: LockerData): number | null => {
  const rawId = locker.socioId ?? locker.socio_id ?? locker.socio?.id ?? null;
  if (rawId === undefined || rawId === null || String(rawId).trim() === '') return null;
  const num = Number(rawId);
  return !isNaN(num) && num > 0 ? num : null;
};

// ✅ Constante/función separada de `casilleros`:
// Es 'DISPONIBLE' si no tiene un socioId asignado, y 'OCUPADO' en caso contrario.
const getLockerEstado = (locker: LockerData): 'DISPONIBLE' | 'OCUPADO' => {
  return getAssignedSocioId(locker) !== null ? 'OCUPADO' : 'DISPONIBLE';
};

export const CasillerosGrid: React.FC = () => {
  const { lockers: contextLockers, socios, actualizarCasillero, actualizarSocio, showToast } = useClub();
  const casillerosApi = useApi('/casilleros');

  // ✅ Estado local sincronizado con el contexto y con fallback directo a la API
  const [lockers, setLockers] = useState<LockerData[]>((contextLockers as LockerData[]) || []);

  useEffect(() => {
    if (Array.isArray(contextLockers) && contextLockers.length > 0) {
      setLockers(contextLockers as LockerData[]);
    }
  }, [contextLockers]);

  // Si el contexto viene vacío al montar, lo cargamos directamente desde /casilleros
  useEffect(() => {
    const fetchLockersIfEmpty = async () => {
      if ((!contextLockers || contextLockers.length === 0) && (casillerosApi as any)?.getAll) {
        try {
          const data = await (casillerosApi as any).getAll();
          if (Array.isArray(data)) setLockers(data);
        } catch (err) {
          console.error('Error cargando casilleros:', err);
        }
      }
    };
    fetchLockersIfEmpty();
  }, []);

  const [selectedLocker, setSelectedLocker] = useState<LockerData | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSocioId, setSelectedSocioId] = useState('');

  // Aranceles de referencia desde BD / API
  const COSTO_CASILLERO_MENSUAL = 2500;

  // IDs de socios que ya tienen un casillero ocupado en la grilla
  const sociosConCasilleroIds = new Set(
    lockers
      .map((l) => getAssignedSocioId(l))
      .filter((id): id is number => id !== null)
  );

  // Socios disponibles para asignación (sin casillero activo ni en socio ni en casilleros)
  const eligibleSocios = socios.filter(
    (s) =>
      !s.casilleroAsignadoId &&
      !(s as any).casilleroId &&
      !sociosConCasilleroIds.has(Number(s.id))
  );

  // Helper para obtener los datos del socio vinculado a un casillero
  const getSocioDelCasillero = (locker: LockerData) => {
    const assignedId = getAssignedSocioId(locker);
    if (!assignedId) return null;

    return (
      socios.find((s) => Number(s.id) === assignedId) ||
      locker.socio ||
      null
    );
  };

  // Estadísticas en tiempo real usando la constante `estado` separada
  const total = lockers.length;
  const disponibles = lockers.filter((l) => getLockerEstado(l) === 'DISPONIBLE').length;
  const ocupados = lockers.filter((l) => getLockerEstado(l) === 'OCUPADO').length;

  const filteredLockers = lockers.filter((l) => {
    const estado = getLockerEstado(l);
    const matchesEstado = filterEstado === 'TODOS' || estado === filterEstado;

    const term = searchQuery.toLowerCase();
    const socio = getSocioDelCasillero(l);
    const socioNombreNorm = (
      (socio as any)?.nombreCompleto ||
      `${socio?.nombre || ''} ${socio?.apellido || ''}`.trim()
    ).toLowerCase();
    const socioDniNorm = String(socio?.dni || '');
    const numStr = String(l.numero ?? l.id ?? '');

    const matchesSearch =
      numStr.includes(term) ||
      socioNombreNorm.includes(term) ||
      socioDniNorm.includes(term);

    return matchesEstado && matchesSearch;
  });

  // ✅ Asignar casillero: sin `socio` y conservando `costoMensual` anterior
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocker || !selectedSocioId) return;

    const socio = socios.find((s) => String(s.id) === String(selectedSocioId));
    if (!socio) {
      showToast('error', 'Socio no encontrado');
      return;
    }

    if (socio.estado === 'SUSPENDIDO') {
      showToast('error', 'Socio suspendido', 'No se puede asignar un casillero a un socio moroso.');
      return;
    }

    const fechaHoy = new Date().toISOString().split('T')[0];
    const lockerId = selectedLocker.id ?? selectedLocker.numero;
    const costoAnterior = selectedLocker.costoMensual ?? COSTO_CASILLERO_MENSUAL;

    const payload = {
      numero: selectedLocker.numero,
      socioId: Number(socio.id),
      fechaAlquiler: fechaHoy,
      costoMensual: Number(costoAnterior),
    };

    try {
      let respuesta: any = null;
      if ((casillerosApi as any)?.update) {
        respuesta = await (casillerosApi as any).update(lockerId, payload);
      } else {
        respuesta = await actualizarCasillero(payload as any);
      }

      setLockers((prev) =>
        prev.map((item) =>
          String(item.id ?? item.numero) === String(lockerId)
            ? {
                ...item,
                ...(respuesta && typeof respuesta === 'object' ? respuesta : {}),
                socioId: Number(socio.id),
                fechaAlquiler: fechaHoy,
                costoMensual: Number(costoAnterior),
              }
            : item
        )
      );

      showToast('success', 'Casillero asignado', `Casillero N° ${selectedLocker.numero} asignado correctamente.`);
      setSelectedLocker(null);
      setSelectedSocioId('');
    } catch (error) {
      showToast('error', 'Error al asignar', 'No se pudo actualizar el casillero en el servidor.');
    }
  };

  // ✅ Liberar casillero: sin `socio` y conservando `costoMensual` anterior
  const handleRelease = async (locker: LockerData) => {
    const lockerId = locker.id ?? locker.numero;
    const costoAnterior = locker.costoMensual ?? COSTO_CASILLERO_MENSUAL;

    const payload = {
      numero: locker.numero,
      socioId: null,
      fechaAlquiler: null,
      costoMensual: Number(costoAnterior),
    };

    try {
      let respuesta: any = null;
      if ((casillerosApi as any)?.update) {
        respuesta = await (casillerosApi as any).update(lockerId, payload);
      } else {
        respuesta = await actualizarCasillero(payload as any);
      }

      setLockers((prev) =>
        prev.map((item) =>
          String(item.id ?? item.numero) === String(lockerId)
            ? {
                ...item,
                ...(respuesta && typeof respuesta === 'object' ? respuesta : {}),
                socioId: null,
                fechaAlquiler: undefined,
                costoMensual: Number(costoAnterior),
              }
            : item
        )
      );

      showToast('success', 'Casillero liberado', `El casillero N° ${locker.numero} vuelve a estar disponible.`);
      setSelectedLocker(null);
    } catch (error) {
      showToast('error', 'Error al liberar', 'No se pudo liberar el casillero en el servidor.');
    }
  };

  // Constante `estado` separada para el casillero seleccionado en el modal
  const selectedLockerEstado = selectedLocker ? getLockerEstado(selectedLocker) : null;
  const selectedLockerSocio = selectedLocker ? getSocioDelCasillero(selectedLocker) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-600 text-white">
              Infraestructura y Vestuarios BD
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1A365D] tracking-tight flex items-center space-x-2">
            <Grid className="w-6 h-6 text-[#2B6CB0]" />
            <span>Grilla Interactiva de Casilleros ({total})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mapeo en tiempo real de casilleros. Regla estatutaria: 1 casillero por socio. Tarifa: $
            {COSTO_CASILLERO_MENSUAL.toLocaleString('es-AR')}/mes.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 shadow-xs"></span>
            <span className="text-slate-700 font-medium">Disponible ({disponibles})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#1A365D] shadow-xs"></span>
            <span className="text-slate-700 font-medium">Ocupado ({ocupados})</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por N° de casillero o socio..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filtrar Estado:</span>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODOS">Todos ({total})</option>
            <option value="DISPONIBLE">Disponibles ({disponibles})</option>
            <option value="OCUPADO">Ocupados ({ocupados})</option>
          </select>
        </div>
      </div>

      {/* Visual Cell Matrix */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        {filteredLockers.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            No se encontraron casilleros cargados o que coincidan con el filtro aplicado.
          </div>
        ) : (
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
            {filteredLockers.map((locker) => {
              // ✅ Constante `estado` separada del objeto `locker`
              const estado = getLockerEstado(locker);
              const isOcupado = estado === 'OCUPADO';

              const socio = getSocioDelCasillero(locker);
              const nombreSocioNorm =
                (socio as any)?.nombreCompleto ||
                `${socio?.nombre || ''} ${socio?.apellido || ''}`.trim();
              const numLocker = locker.numero ?? locker.id;

              return (
                <button
                  key={locker.id ?? locker.numero}
                  onClick={() => setSelectedLocker(locker)}
                  className={`group relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-150 aspect-square cursor-pointer ${
                    isOcupado
                      ? 'bg-[#1A365D] text-white border-blue-900 hover:bg-[#2B6CB0]'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title={`Casillero N° ${numLocker}: ${estado} ${
                    nombreSocioNorm ? `(${nombreSocioNorm})` : ''
                  }`}
                >
                  <span className="text-xs sm:text-sm font-black tracking-tight">{numLocker}</span>
                  <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider opacity-85 mt-0.5 truncate w-full text-center px-1">
                    {isOcupado ? 'Ocupado' : 'Libre'}
                  </span>

                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      isOcupado ? 'bg-blue-300' : 'bg-emerald-500'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Locker Inspection & Assignment Modal */}
      {selectedLocker && selectedLockerEstado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-[#1A365D] text-white border-b-2 border-[#C53030]">
              <div className="flex items-center space-x-2">
                <Grid className="w-5 h-5 text-red-400" />
                <span className="font-bold text-sm tracking-wide">
                  CASILLERO N° {selectedLocker.numero ?? selectedLocker.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedLocker(null)}
                className="p-1 text-white/80 hover:text-white rounded cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-800">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-600">Estado Actual:</span>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    selectedLockerEstado === 'OCUPADO'
                      ? 'bg-[#1A365D] text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {selectedLockerEstado}
                </span>
              </div>

              {/* Locker is OCUPADO */}
              {selectedLockerEstado === 'OCUPADO' ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg space-y-1">
                    <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">
                      Socio Asignado en BD:
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {(selectedLockerSocio as any)?.nombreCompleto ||
                        `${selectedLockerSocio?.nombre || ''} ${
                          selectedLockerSocio?.apellido || ''
                        }`.trim() ||
                        `Socio ID #${getAssignedSocioId(selectedLocker)}`}
                    </h4>
                    <p className="text-xs text-slate-600">
                      DNI: {selectedLockerSocio?.dni || 'N/A'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Asignado el:{' '}
                      {selectedLocker.fechaAlquiler ||
                        (selectedLocker as any).fechaIngreso ||
                        'Activo'}
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium pt-1">
                      Costo mensual incluido en cuota:{' '}
                      <strong>
                        ${Number(selectedLocker.costoMensual || COSTO_CASILLERO_MENSUAL).toLocaleString('es-AR')}
                      </strong>
                    </p>
                  </div>

                  <button
                    onClick={() => handleRelease(selectedLocker)}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Liberar Casillero (Dar de Baja Asignación en BD)
                  </button>
                </div>
              ) : (
                /* Locker is DISPONIBLE */
                <form onSubmit={handleAssign} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Asignar a Socio (Un casillero por socio):
                    </label>
                    <select
                      value={selectedSocioId}
                      onChange={(e) => setSelectedSocioId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      required
                    >
                      <option value="">-- Seleccione un socio sin casillero --</option>
                      {eligibleSocios.map((s) => {
                        const nombreSocio =
                          s.nombreCompleto || `${s.nombre || ''} ${s.apellido || ''}`.trim();
                        const isMoroso = s.estado === 'SUSPENDIDO';
                        return (
                          <option key={s.id} value={String(s.id)} disabled={isMoroso}>
                            {nombreSocio} (DNI: {s.dni}){' '}
                            {isMoroso ? ' [SUSPENDIDO POR MOROSIDAD]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Quick rule alert */}
                  <div className="p-2.5 bg-blue-50 text-blue-900 rounded text-[11px] flex items-start space-x-1.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Al asignar este casillero, se sumará automáticamente $
                      {COSTO_CASILLERO_MENSUAL.toLocaleString('es-AR')} al próximo recibo de cobranza del socio.
                    </span>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="submit"
                      disabled={!selectedSocioId}
                      className="w-full py-2 bg-[#1A365D] hover:bg-[#2B6CB0] disabled:bg-slate-300 text-white font-bold rounded text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      Confirmar Asignación en BD
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedLocker(null)}
                className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded font-semibold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};