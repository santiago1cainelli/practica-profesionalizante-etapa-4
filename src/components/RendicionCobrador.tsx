import React, { useState } from 'react';
import {
  FileSpreadsheet,
  DollarSign,
  CheckCircle2,
  Clock,
  Send,
  PlusCircle,
  AlertCircle,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ZONAS_NOMBRES, CUOTA_VALORES } from '../data/mockData';

export const RendicionCobrador: React.FC = () => {
  const { rendiciones, cupones, crearRendicionSemanal, aprobarRendicion, currentUser } = useApp();

  const [selectedZona, setSelectedZona] = useState<number>(currentUser.zonaAsignada || 1);
  const [selectedCuponesIds, setSelectedCuponesIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cupones pagados de la zona elegida que aún no estén en una rendición aprobada
  const cuponesDeLaZona = cupones.filter(
    (c) => c.zonaCobro === selectedZona && c.estadoPago === 'PAGADO'
  );

  const toggleSelectCupon = (id: string) => {
    setSelectedCuponesIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedCuponesIds.length === cuponesDeLaZona.length) {
      setSelectedCuponesIds([]);
    } else {
      setSelectedCuponesIds(cuponesDeLaZona.map((c) => c.id));
    }
  };

  const totalCobradoCalculado = cuponesDeLaZona
    .filter((c) => selectedCuponesIds.includes(c.id))
    .reduce((acc, c) => acc + c.totalPagar, 0);

  const comisionCalculada = Math.round(totalCobradoCalculado * CUOTA_VALORES.COMISION_COBRADOR_PORCENTAJE); // 10%
  const netoClub = totalCobradoCalculado - comisionCalculada;

  const handleCrearRendicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCuponesIds.length === 0) return;

    const cobradorNombre = ZONAS_NOMBRES[selectedZona]?.cobradorDefault || currentUser.nombreCompleto;
    crearRendicionSemanal(selectedZona, currentUser.id, cobradorNombre, selectedCuponesIds);

    setSelectedCuponesIds([]);
    setIsModalOpen(false);
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
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generar Nueva Rendición Semanal</span>
        </button>
      </div>

      {/* Historical Rendiciones List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Planillas de Rendición y Liquidación Emitidas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rendiciones.map((rend) => {
            const isAprobada = rend.estado === 'APROBADA';
            const zona = ZONAS_NOMBRES[rend.zonaCobro];

            return (
              <div
                key={rend.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      SEMANA N° {rend.semanaNumero}
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
                    {rend.cobradorNombre}
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">
                    {zona?.nombre || `Zona ${rend.zonaCobro}`} • Período: {rend.periodoFecha}
                  </p>

                  {/* Financial Breakdown */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-xs mb-3">
                    <div className="flex justify-between text-slate-700">
                      <span>Total Cupones Rendidos:</span>
                      <strong>{rend.recibosCobradosIds.length} comprobantes</strong>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Monto Bruto Cobrado:</span>
                      <strong className="font-mono">${rend.totalCobrado.toLocaleString('es-AR')}</strong>
                    </div>
                    <div className="flex justify-between text-amber-800 font-bold pt-1 border-t border-slate-200">
                      <span>Comisión Cobrador (10%):</span>
                      <span className="font-mono">+${rend.montoComisionCobrador.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-[#1A365D] font-black text-sm pt-1 border-t border-slate-300">
                      <span>Neto a Rendir al Club:</span>
                      <span className="font-mono">${rend.netoRendidoClub.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-2 flex justify-between items-center border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Fecha: {rend.fechaRendicion}</span>
                  {!isAprobada && currentUser.role === 'ADMIN' && (
                    <button
                      onClick={() => aprobarRendicion(rend.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs transition-colors flex items-center space-x-1"
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
      </div>

      {/* Modal: New Rendición Creator */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
            
            <div className="flex items-center justify-between px-6 py-3.5 bg-[#1A365D] text-white border-b-2 border-[#C53030]">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-red-400" />
                <span className="font-bold text-sm tracking-wide">
                  NUEVA RENDICIÓN SEMANAL — 10% COMISIÓN
                </span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-white/80 hover:text-white rounded">
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
                    <option value="1">Zona 1 - Centro & Barrio Norte (Roberto Gómez)</option>
                    <option value="2">Zona 2 - Sur & Estación (Laura Méndez)</option>
                    <option value="3">Zona 3 - Este & Costanera (Carlos Benítez)</option>
                    <option value="0">Zona 0 - Sede Central (Cobranza Ventanilla)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cobrador Responsable:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={ZONAS_NOMBRES[selectedZona]?.cobradorDefault || currentUser.nombreCompleto}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded text-xs text-slate-600 font-semibold"
                  />
                </div>
              </div>

              {/* Select cupones checklist */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Seleccionar Cupones Cobrados en la Semana:
                  </label>
                  {cuponesDeLaZona.length > 0 && (
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[11px] font-semibold text-[#2B6CB0] hover:underline"
                    >
                      {selectedCuponesIds.length === cuponesDeLaZona.length ? 'Desmarcar todos' : 'Marcar todos'}
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
                      const isChecked = selectedCuponesIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-center justify-between p-2 hover:bg-white rounded cursor-pointer text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectCupon(c.id)}
                              className="w-4 h-4 text-amber-600 rounded focus:ring-0"
                            />
                            <div>
                              <strong className="text-slate-900 block">{c.socioNombre}</strong>
                              <span className="text-[11px] text-slate-500 font-mono">{c.numeroComprobante} • {c.periodoMes}</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-800">
                            ${c.totalPagar.toLocaleString('es-AR')}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Automatic 10% Commission Calculation Box */}
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Total Bruto Seleccionado ({selectedCuponesIds.length} cupones):</span>
                  <strong className="font-mono">${totalCobradoCalculado.toLocaleString('es-AR')}</strong>
                </div>
                <div className="flex justify-between text-amber-900 font-bold">
                  <span>Comisión del Cobrador (10% s/ recaudación):</span>
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
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selectedCuponesIds.length === 0}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded text-xs font-bold transition-colors shadow-xs"
                >
                  Emitir y Enviar Rendición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
