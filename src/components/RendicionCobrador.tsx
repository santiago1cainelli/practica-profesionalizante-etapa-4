import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  PlusCircle,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import { useClub } from '../context/AppProvider';
import { useApi } from '../hooks/useApi';

export const RendicionCobrador: React.FC = () => {
  // ✅ Extraemos únicamente lo que existe en AppProvider
  const {
    rendiciones: initialRendiciones,
    cupones,
    cobradores,
    currentUser,
    showToast,
  } = useClub();

  // ✅ Conexión directa a /rendiciones y estado local sincronizado con el contexto
  const rendicionesApi = useApi('/rendiciones');
  const [rendicionesList, setRendicionesList] = useState<any[]>(initialRendiciones);

  useEffect(() => {
    setRendicionesList(initialRendiciones);
  }, [initialRendiciones]);

  const [selectedZona, setSelectedZona] = useState<number>(currentUser?.zonaAsignada ?? 1);
  const [selectedCuponesIds, setSelectedCuponesIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Obtener el cobrador usando zonaAsignada y normalizar porcentajeComision sin NaN
  const cobradorActual = cobradores.find(
    (c) => Number(c.zonaAsignada ?? (c as any).zona) === Number(selectedZona)
  );
  const rawComision = Number(
    cobradorActual?.porcentajeComision ??
      (cobradorActual as any)?.comisionPorcentaje ??
      0.1
  );
  const porcentajeComision = rawComision > 1 ? rawComision / 100 : rawComision;

  // Cupones pagados de la zona elegida
  const cuponesDeLaZona = cupones.filter((c) => {
    const zonaCupon = Number(c.zonaCobro ?? (c as any).zona ?? 0);
    const estadoCupon = c.estadoPago || (c as any).estado;
    return zonaCupon === Number(selectedZona) && estadoCupon === 'PAGADO';
  });

  const toggleSelectCupon = (id: string) => {
    setSelectedCuponesIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedCuponesIds.length === cuponesDeLaZona.length) {
      setSelectedCuponesIds([]);
    } else {
      setSelectedCuponesIds(cuponesDeLaZona.map((c) => String(c.id)));
    }
  };

  const totalCobradoCalculado = cuponesDeLaZona
    .filter((c) => selectedCuponesIds.includes(String(c.id)))
    .reduce((acc, c) => acc + Number(c.totalPagar || (c as any).montoTotal || 0), 0);

  const comisionCalculada = Math.round(totalCobradoCalculado * porcentajeComision);
  const netoClub = totalCobradoCalculado - comisionCalculada;

  // ✅ Creación de rendición mediante rendicionesApi.create
  const handleCrearRendicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCuponesIds.length === 0) return;

    const cobradorNombre = cobradorActual
      ? cobradorActual.nombreCompleto ||
        `${cobradorActual.nombre || ''} ${cobradorActual.apellido || ''}`.trim()
      : currentUser?.nombreCompleto || 'Cobrador de Zona';

    const hoy = new Date();
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hoy.getDate() - 7);
    const hoyStr = hoy.toISOString().split('T')[0];
    const inicioStr = hace7Dias.toISOString().split('T')[0];

    const nuevaRendicion: any = {
      cobradorId: String(cobradorActual?.id || currentUser?.id || ''),
      cobradorNombre,
      zonaCobro: Number(selectedZona),
      fechaRendicion: hoyStr,
      periodoFecha: `${inicioStr} al ${hoyStr}`,
      semanaInicio: inicioStr,
      semanaFin: hoyStr,
      cuponesRendidosIds: selectedCuponesIds,
      recibosCobradosIds: selectedCuponesIds,
      totalCobrado: totalCobradoCalculado,
      montoRecaudado: totalCobradoCalculado,
      montoComisionCobrador: comisionCalculada,
      comisionCalculada: comisionCalculada,
      netoRendidoClub: netoClub,
      montoNeto: netoClub,
      estado: 'PENDIENTE',
    };

    try {
      const creada = await rendicionesApi.create(nuevaRendicion);
      setRendicionesList((prev) => [creada || { ...nuevaRendicion, id: Date.now() }, ...prev]);
      showToast(
        'success',
        'Rendición generada',
        `Planilla semanal emitida por $${totalCobradoCalculado.toLocaleString('es-AR')}.`
      );
      setSelectedCuponesIds([]);
      setIsModalOpen(false);
    } catch (error) {
      showToast('error', 'Error al generar rendición', 'No se pudo registrar la liquidación en la BD.');
    }
  };

  // ✅ Aprobación de rendición mediante rendicionesApi.update
  const handleAprobarRendicion = async (rend: any) => {
    const actualizada = {
      ...rend,
      estado: 'APROBADA',
    };

    try {
      await rendicionesApi.update(rend.id, actualizada);
      setRendicionesList((prev) =>
        prev.map((item) => (String(item.id) === String(rend.id) ? actualizada : item))
      );
      showToast('success', 'Rendición aprobada', `Liquidación N° ${rend.id} validada por Secretaría.`);
    } catch (error) {
      showToast('error', 'Error al aprobar', 'No se pudo actualizar el estado de la rendición.');
    }
  };

  const getNombreZona = (zonaCobro: number) => {
    if (Number(zonaCobro) === 0) return 'Zona 0 - Sede Central';
    const c = cobradores.find(
      (cob) => Number(cob.zonaAsignada ?? (cob as any).zona) === Number(zonaCobro)
    );
    const nombreCob = c
      ? c.nombreCompleto || `${c.nombre || ''} ${c.apellido || ''}`.trim()
      : '';
    return nombreCob ? `Zona ${zonaCobro} - ${nombreCob}` : `Zona ${zonaCobro}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-600 text-white">
              Liquidación Semanal
            </span>
            <span className="text-xs text-slate-500 font-medium">10% Comisión Oficial</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1A365D] tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-600" />
            <span>Rendición de Cobradores de Zona</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cálculo estatutario de la comisión del 10% para cobradores domiciliarios y depósito neto a secretaría.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generar Nueva Rendición Semanal</span>
        </button>
      </div>

      {/* Lista de Rendiciones */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Planillas de Rendición y Liquidación Emitidas
        </h3>

        {rendicionesList.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            No hay planillas de rendición registradas todavía.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rendicionesList.map((rend) => {
              const isAprobada = rend.estado === 'APROBADA';
              const zonaNombre = getNombreZona(rend.zonaCobro ?? 0);
              const cobradoBruto = Number(rend.totalCobrado ?? rend.montoRecaudado ?? 0);
              const comisionMonto = Number(rend.montoComisionCobrador ?? rend.comisionCalculada ?? 0);
              const netoClubMonto = Number(rend.netoRendidoClub ?? rend.montoNeto ?? 0);
              const listaIds = rend.cuponesRendidosIds || rend.recibosCobradosIds || [];
              const cantidadCupones = Array.isArray(listaIds) ? listaIds.length : 0;

              return (
                <div
                  key={rend.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        RENDICIÓN N° {rend.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isAprobada ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isAprobada ? 'APROBADA POR SECRETARÍA' : 'PENDIENTE DE VALIDACIÓN'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {rend.cobradorNombre || `Cobrador ID: ${rend.cobradorId}`}
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      {zonaNombre} • Período:{' '}
                      {rend.semanaInicio
                        ? `${rend.semanaInicio} al ${rend.semanaFin}`
                        : rend.periodoFecha || 'Semanal'}
                    </p>

                    {/* Desglose Financiero */}
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-xs mb-3">
                      <div className="flex justify-between text-slate-700">
                        <span>Total Cupones Rendidos:</span>
                        <strong>{cantidadCupones} comprobantes</strong>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Monto Bruto Cobrado:</span>
                        <strong className="font-mono">${cobradoBruto.toLocaleString('es-AR')}</strong>
                      </div>
                      <div className="flex justify-between text-amber-800 font-bold pt-1 border-t border-slate-200">
                        <span>Comisión Cobrador:</span>
                        <span className="font-mono">+${comisionMonto.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between text-[#1A365D] font-black text-sm pt-1 border-t border-slate-300">
                        <span>Neto a Rendir al Club:</span>
                        <span className="font-mono">${netoClubMonto.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer action */}
                  <div className="pt-2 flex justify-between items-center border-t border-slate-100 text-[11px] text-slate-500">
                    <span>Fecha: {rend.fechaRendicion ? rend.fechaRendicion.slice(0, 10) : 'N/A'}</span>
                    {!isAprobada && currentUser?.role === 'ADMIN' && (
                      <button
                        onClick={() => handleAprobarRendicion(rend)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Aprobar Liquidación</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Nueva Rendición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
            <div className="flex items-center justify-between px-6 py-3.5 bg-[#1A365D] text-white border-b-2 border-[#C53030]">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-red-400" />
                <span className="font-bold text-sm tracking-wide">
                  NUEVA RENDICIÓN SEMANAL DE COBRADOR (BD)
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCrearRendicion} className="p-6 space-y-4 text-xs sm:text-sm text-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Zona de Cobro a Rendir:
                  </label>
                  <select
                    value={selectedZona}
                    onChange={(e) => {
                      setSelectedZona(Number(e.target.value));
                      setSelectedCuponesIds([]);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs bg-white focus:outline-none"
                  >
                    <option value={0}>Zona 0 - Sede Central (Ventanilla)</option>
                    {cobradores.map((c) => {
                      const zNum = Number(c.zonaAsignada ?? (c as any).zona ?? 0);
                      const nomCob =
                        c.nombreCompleto || `${c.nombre || ''} ${c.apellido || ''}`.trim();
                      return (
                        <option key={c.id} value={zNum}>
                          Zona {zNum} - {nomCob}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cobrador Responsable:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={
                      cobradorActual
                        ? cobradorActual.nombreCompleto ||
                          `${cobradorActual.nombre || ''} ${cobradorActual.apellido || ''}`.trim()
                        : currentUser?.nombreCompleto || 'Cobrador de Zona'
                    }
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded text-xs text-slate-600 font-semibold"
                  />
                </div>
              </div>

              {/* Lista de cupones para selección */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Seleccionar Cupones Cobrados en la Semana:
                  </label>
                  {cuponesDeLaZona.length > 0 && (
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[11px] font-semibold text-[#2B6CB0] hover:underline cursor-pointer"
                    >
                      {selectedCuponesIds.length === cuponesDeLaZona.length
                        ? 'Desmarcar todos'
                        : 'Marcar todos'}
                    </button>
                  )}
                </div>

                {cuponesDeLaZona.length === 0 ? (
                  <p className="text-slate-400 italic bg-slate-50 p-4 rounded text-center border border-dashed border-slate-200 text-xs">
                    No hay cupones cobrados pendientes de rendición en esta zona.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg p-2 bg-slate-50">
                    {cuponesDeLaZona.map((c) => {
                      const cuponIdStr = String(c.id);
                      const isChecked = selectedCuponesIds.includes(cuponIdStr);
                      const monto = Number(c.totalPagar || (c as any).montoTotal || 0);

                      return (
                        <label
                          key={c.id}
                          className="flex items-center justify-between p-2 hover:bg-white rounded cursor-pointer text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectCupon(cuponIdStr)}
                              className="w-4 h-4 text-amber-600 rounded focus:ring-0"
                            />
                            <div>
                              <strong className="text-slate-900 block">
                                {c.socioNombre || `Socio ID: ${c.socioId}`}
                              </strong>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {c.numeroComprobante || `CUP-${c.id}`} •{' '}
                                {c.periodoMes || (c as any).periodo}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-800">
                            ${monto.toLocaleString('es-AR')}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cálculo dinámico de comisión */}
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Total Bruto Seleccionado ({selectedCuponesIds.length} cupones):</span>
                  <strong className="font-mono">${totalCobradoCalculado.toLocaleString('es-AR')}</strong>
                </div>
                <div className="flex justify-between text-amber-900 font-bold">
                  <span>Comisión del Cobrador ({Math.round(porcentajeComision * 100)}%):</span>
                  <span className="font-mono text-sm">${comisionCalculada.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-[#1A365D] font-black text-sm pt-2 border-t border-amber-300">
                  <span>Neto a Ingresar en Tesorería del Club:</span>
                  <span className="font-mono text-base">${netoClub.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selectedCuponesIds.length === 0}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Emitir y Enviar Rendición a BD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};