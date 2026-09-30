import React, { useState } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  Receipt,
  Printer,
  DollarSign,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  Phone,
  Building
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ZONAS_NOMBRES, CUOTA_VALORES } from '../data/mockData';
import { ReciboModal } from './ReciboModal';
import { CuponRecibo } from '../types';

export const MorosidadControl: React.FC = () => {
  const { socios, cupones, regularizarDeudaSocio, reemitirCuponConMora } = useApp();
  const [filterType, setFilterType] = useState<'TODOS' | 'SUSPENDIDOS' | 'DEUDOR_1_MES'>('TODOS');
  const [viewingCupon, setViewingCupon] = useState<CuponRecibo | null>(null);

  // Filter delinquent socios
  const sociosConDeuda = socios.filter((s) => s.estado !== 'AL_DIA');

  const filteredSocios = sociosConDeuda.filter((s) => {
    if (filterType === 'SUSPENDIDOS') return s.estado === 'SUSPENDIDO_MOROSIDAD';
    if (filterType === 'DEUDOR_1_MES') return s.estado === 'DEUDOR_1_MES';
    return true;
  });

  const totalSuspendidos = socios.filter((s) => s.estado === 'SUSPENDIDO_MOROSIDAD').length;
  const totalDeudores1Mes = socios.filter((s) => s.estado === 'DEUDOR_1_MES').length;

  const totalDeudaAcumulada = cupones
    .filter((c) => c.estadoPago === 'PENDIENTE' || c.estadoPago === 'VENCIDO')
    .reduce((acc, c) => acc + c.totalPagar, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-red-600 text-white">
              Automatismos & Control
            </span>
            <span className="text-xs text-slate-500 font-medium">Requerimientos R10 y R11</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1A365D] tracking-tight flex items-center space-x-2">
            <AlertOctagon className="w-6 h-6 text-[#C53030]" />
            <span>Panel de Control de Morosidad y Recargos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detección de 2+ cuotas consecutivas impagas (Suspensión automática R10) y recargo moratorio del 5% (R11).
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
        >
          <Printer className="w-4 h-4 text-red-400" />
          <span>Imprimir Reporte de Morosidad</span>
        </button>
      </div>

      {/* Critical Rule Callout Banner (Matching document specifications) */}
      <div className="bg-red-50/90 border-l-4 border-[#C53030] p-4 rounded-r-xl shadow-xs">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-[#C53030] shrink-0 mt-0.5" />
          <div className="text-xs text-red-950">
            <h4 className="font-bold text-red-900 text-sm mb-0.5">
              Regla Crítica de Negocio - Control de Morosidad (R10):
            </h4>
            <p className="leading-relaxed">
              Si el socio acumula <strong>2 meses impagos consecutivos</strong>, el sistema bloquea automáticamente las opciones de inscripción a actividades, alquiler de casilleros y emite la alerta de suspensión temporal hasta que se regularice la deuda mediante el cobrador de zona o en la sede (Zona 0). Toda reemisión aplica un <strong>5% de recargo por mora</strong> (R11).
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-red-800 uppercase">Suspendidos por Morosidad (R10)</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-700">{totalSuspendidos} socios</div>
          <p className="text-[11px] text-slate-500 mt-1">Acumulan 2 o más cuotas adeudadas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-amber-800 uppercase">Aviso Deuda 1 Mes</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{totalDeudores1Mes} socios</div>
          <p className="text-[11px] text-slate-500 mt-1">Próximos a suspensión si no abonan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-600 uppercase">Deuda Total Acumulada</span>
            <DollarSign className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-[#1A365D]">
            ${totalDeudaAcumulada.toLocaleString('es-AR')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Incluye recargos estatutarios del 5%</p>
        </div>
      </div>

      {/* Delinquency List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Filter Tabs */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'TODOS' ? 'bg-[#1A365D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos con Deuda ({sociosConDeuda.length})
          </button>
          <button
            onClick={() => setFilterType('SUSPENDIDOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'SUSPENDIDOS' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Suspendidos 2+ Meses ({totalSuspendidos})
          </button>
          <button
            onClick={() => setFilterType('DEUDOR_1_MES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'DEUDOR_1_MES' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Aviso 1 Mes ({totalDeudores1Mes})
          </button>
        </div>

        {filteredSocios.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <strong className="text-sm text-slate-700 block">No hay socios en esta condición</strong>
            El padrón se encuentra al día.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredSocios.map((socio) => {
              const isSuspended = socio.estado === 'SUSPENDIDO_MOROSIDAD';
              const zona = ZONAS_NOMBRES[socio.zonaCobro];
              const impagos = cupones.filter(
                (c) => c.socioId === socio.id && (c.estadoPago === 'PENDIENTE' || c.estadoPago === 'VENCIDO')
              );
              const deudaSocio = impagos.reduce((acc, c) => acc + c.totalPagar, 0);

              return (
                <div key={socio.id} className="p-5 hover:bg-slate-50/80 transition-colors text-xs space-y-3">
                  
                  {/* Row Top: Socio Info & Status */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          SOCIO N° {socio.numeroSocio}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isSuspended ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isSuspended ? 'SUSPENSIÓN TEMPORAL ACTIVA (R10)' : 'AVISO PREVIO: 1 CUOTA IMPAGA'}
                        </span>
                        <span className="text-[11px] text-slate-500">Cat: {socio.categoria}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{socio.nombreCompleto}</h4>
                      <p className="text-slate-600 text-xs">
                        DNI: {socio.dni} • Tel: {socio.telefono || 'Sin registrar'} • Domicilio: {socio.direccion}
                      </p>
                    </div>

                    <div className="text-right sm:border-l sm:pl-4 border-slate-200">
                      <span className="text-slate-500 text-[10px] block uppercase">Deuda Total</span>
                      <strong className="font-mono text-lg text-red-700 font-black">
                        ${deudaSocio.toLocaleString('es-AR')}
                      </strong>
                      <span className="text-[11px] text-slate-500 block">
                        {impagos.length} {impagos.length === 1 ? 'cuota adeudada' : 'cuotas consecutivas'}
                      </span>
                    </div>
                  </div>

                  {/* Unpaid Receipts Breakdown */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-600 block">
                      Cupones Impagos Detallados:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {impagos.map((cup) => (
                        <div key={cup.id} className="bg-white p-2.5 rounded border border-slate-200 text-xs flex justify-between items-center">
                          <div>
                            <strong className="text-slate-800 block text-[11px]">{cup.periodoMes}</strong>
                            <span className="text-[10px] text-slate-500">{cup.numeroComprobante}</span>
                            {cup.montoRecargoMora > 0 && (
                              <span className="text-[10px] text-red-600 font-bold block">+5% Mora aplicada</span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 text-xs block">
                              ${cup.totalPagar.toLocaleString('es-AR')}
                            </span>
                            <button
                              onClick={() => setViewingCupon(cup)}
                              className="text-[10px] text-blue-600 hover:underline font-medium"
                            >
                              Ver Recibo
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <span>Cobrador de Zona asignado:</span>
                      <strong className="text-slate-700">{zona?.cobradorDefault} ({zona?.nombre})</strong>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Reemit with 5% surcharge if not yet applied */}
                      {impagos.some((c) => c.montoRecargoMora === 0) && (
                        <button
                          onClick={() => {
                            impagos.filter((c) => c.montoRecargoMora === 0).forEach((c) => reemitirCuponConMora(c.id));
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold transition-colors shadow-xs"
                        >
                          Aplicar 5% Mora (R11)
                        </button>
                      )}

                      {/* One click regularize */}
                      <button
                        onClick={() => regularizarDeudaSocio(socio.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Regularizar Deuda y Levantar Suspensión</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReciboModal cupon={viewingCupon} onClose={() => setViewingCupon(null)} />
    </div>
  );
};
