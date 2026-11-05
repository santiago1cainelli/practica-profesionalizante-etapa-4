import React, { useState } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  Printer,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReciboModal } from './ReciboModal';
import { cupones } from '../types';

export const MorosidadControl: React.FC = () => {
  const { socios, cupones, cobradores, regularizarDeudaSocio, reemitirCuponConMora } = useApp();
  const [filterType, setFilterType] = useState<'TODOS' | 'SUSPENDIDOS' | 'DEUDORES'>('TODOS');
  const [viewingCupon, setViewingCupon] = useState<cupones | any | null>(null);

  // Filtrar socios con deuda (no están al día)
  const sociosConDeuda = socios.filter(
    (s) => s.estado !== 'AL_DIA' && s.estado !== 'ACTIVO'
  );

  const filteredSocios = sociosConDeuda.filter((s) => {
    if (filterType === 'SUSPENDIDOS') return s.estado === 'SUSPENDIDO' || s.estado === 'SUSPENDIDO_MOROSIDAD' || s.estado === 'BAJA';
    if (filterType === 'DEUDORES') return s.estado === 'MOROSO' || s.estado === 'DEUDOR_1_MES';
    return true;
  });

  const totalSuspendidos = socios.filter(
    (s) => s.estado === 'SUSPENDIDO' || s.estado === 'SUSPENDIDO_MOROSIDAD' || s.estado === 'BAJA'
  ).length;

  const totalDeudores1Mes = socios.filter(
    (s) => s.estado === 'MOROSO' || s.estado === 'DEUDOR_1_MES'
  ).length;

  // Cálculo del total adeudado en cupones no cancelados
  const totalDeudaAcumulada = cupones
    .filter((c) => c.estado === 'PENDIENTE' || c.estado === 'VENCIDO' || (c as any).estadoPago === 'PENDIENTE' || (c as any).estadoPago === 'VENCIDO')
    .reduce((acc, c) => acc + Number((c as any).totalPagar || c.montoTotal || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const getNombreCobradorZona = (zonaCobro: number) => {
    if (zonaCobro === 0) return 'Sede Central (Ventanilla)';
    const cobrador = cobradores.find((c) => Number(c.zona) === Number(zonaCobro));
    return cobrador
      ? `${cobrador.nombre} ${cobrador.apellido} (Zona ${zonaCobro})`
      : `Zona ${zonaCobro}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-red-600 text-white">
              Automatismos & Control BD
            </span>
            <span className="text-xs text-slate-500 font-medium">Control Estatutario</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1A365D] tracking-tight flex items-center space-x-2">
            <AlertOctagon className="w-6 h-6 text-[#C53030]" />
            <span>Panel de Control de Morosidad y Recargos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detección de cuotas impagas en la base de datos y aplicación del recargo moratorio estatutario.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-red-400" />
          <span>Imprimir Reporte de Morosidad</span>
        </button>
      </div>

      {/* Regla de Negocio */}
      <div className="bg-red-50/90 border-l-4 border-[#C53030] p-4 rounded-r-xl shadow-xs">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-[#C53030] shrink-0 mt-0.5" />
          <div className="text-xs text-red-950">
            <h4 className="font-bold text-red-900 text-sm mb-0.5">
              Regla de Negocio - Control de Morosidad:
            </h4>
            <p className="leading-relaxed">
              Si la API registra que el socio acumula <strong>cuotas impagas</strong>, el sistema bloquea automáticamente la inscripción a actividades, alquiler de casilleros y emite la alerta de suspensión temporal hasta que se regularice la deuda. Toda reemisión aplica un <strong>recargo por mora (5%)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Fila de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-red-800 uppercase">Suspendidos por Morosidad</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-700">{totalSuspendidos} socios</div>
          <p className="text-[11px] text-slate-500 mt-1">Registran suspensión en la BD</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-amber-800 uppercase">Aviso Deuda / Morosos</span>
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
          <p className="text-[11px] text-slate-500 mt-1">Suma consolidada de cupones pendientes</p>
        </div>
      </div>

      {/* Lista de Socios Morosos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Pestañas de Filtro */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'TODOS' ? 'bg-[#1A365D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos con Deuda ({sociosConDeuda.length})
          </button>
          <button
            onClick={() => setFilterType('SUSPENDIDOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'SUSPENDIDOS' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Suspendidos ({totalSuspendidos})
          </button>
          <button
            onClick={() => setFilterType('DEUDORES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'DEUDORES' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Morosos / Aviso ({totalDeudores1Mes})
          </button>
        </div>

        {filteredSocios.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <strong className="text-sm text-slate-700 block">No hay socios registrados en esta condición</strong>
            El padrón de socios se encuentra al día.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredSocios.map((socio) => {
              const isSuspended = socio.estado === 'SUSPENDIDO' || socio.estado === 'SUSPENDIDO_MOROSIDAD' || socio.estado === 'BAJA';
              const nombreCompleto = socio.nombreCompleto || `${socio.nombre || ''} ${socio.apellido || ''}`.trim();
              const numeroSocio = socio.numeroSocio || socio.id;

              const impagos = cupones.filter(
                (c) => String(c.socioId) === String(socio.id) && 
                       (c.estado === 'PENDIENTE' || c.estado === 'VENCIDO' || (c as any).estadoPago === 'PENDIENTE' || (c as any).estadoPago === 'VENCIDO')
              );
              
              const deudaSocio = impagos.reduce(
                (acc, c) => acc + Number((c as any).totalPagar || c.montoTotal || 0),
                0
              );

              return (
                <div key={socio.id} className="p-5 hover:bg-slate-50/80 transition-colors text-xs space-y-3">
                  
                  {/* Fila Superior: Datos del Socio y Estado */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          SOCIO N° {numeroSocio}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isSuspended ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {socio.estado}
                        </span>
                        <span className="text-[11px] text-slate-500">Cat: {socio.categoria}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{nombreCompleto}</h4>
                      <p className="text-slate-600 text-xs">
                        DNI: {socio.dni} • Tel: {socio.telefono || 'Sin registrar'} • Domicilio: {socio.direccion || 'Sin registrar'}
                      </p>
                    </div>

                    <div className="text-right sm:border-l sm:pl-4 border-slate-200">
                      <span className="text-slate-500 text-[10px] block uppercase">Deuda Total</span>
                      <strong className="font-mono text-lg text-red-700 font-black">
                        ${deudaSocio.toLocaleString('es-AR')}
                      </strong>
                      <span className="text-[11px] text-slate-500 block">
                        {impagos.length} {impagos.length === 1 ? 'cuota adeudada' : 'cuotas adeudadas'}
                      </span>
                    </div>
                  </div>

                  {/* Desglose de Cupones Impagos */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-600 block">
                      Cupones Impagos Detallados en BD:
                    </span>
                    {impagos.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No hay comprobantes pendientes adjuntos.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {impagos.map((cup) => {
                          const montoCup = Number((cup as any).totalPagar || cup.montoTotal || 0);
                          const periodoStr = cup.periodo || (cup as any).periodoMes || 'S/N';
                          const comprobanteStr = (cup as any).numeroComprobante || `CUP-${cup.id}`;
                          const tieneMora = Number(cup.recargoPorcentaje || (cup as any).montoRecargoMora || 0) > 0;

                          return (
                            <div key={cup.id} className="bg-white p-2.5 rounded border border-slate-200 text-xs flex justify-between items-center">
                              <div>
                                <strong className="text-slate-800 block text-[11px]">{periodoStr}</strong>
                                <span className="text-[10px] text-slate-500 font-mono">{comprobanteStr}</span>
                                {tieneMora && (
                                  <span className="text-[10px] text-red-600 font-bold block">+5% Mora Aplicada</span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-slate-900 text-xs block">
                                  ${montoCup.toLocaleString('es-AR')}
                                </span>
                                <button
                                  onClick={() => setViewingCupon(cup)}
                                  className="text-[10px] text-blue-600 hover:underline font-medium cursor-pointer"
                                >
                                  Ver Recibo
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Fila de Acciones */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <span>Cobrador Asignado:</span>
                      <strong className="text-slate-700">{getNombreCobradorZona(socio.zonaCobro)}</strong>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Reemitir aplicando 5% de recargo en la BD */}
                      {impagos.some((c) => !c.recargoPorcentaje && !(c as any).montoRecargoMora) && (
                        <button
                          onClick={() => {
                            impagos
                              .filter((c) => !c.recargoPorcentaje && !(c as any).montoRecargoMora)
                              .forEach((c) => reemitirCuponConMora(String(c.id)));
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold transition-colors shadow-xs cursor-pointer"
                        >
                          Aplicar 5% Mora
                        </button>
                      )}

                      {/* Regularización en 1-click */}
                      <button
                        onClick={() => regularizarDeudaSocio(String(socio.id))}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Regularizar Deuda en BD</span>
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