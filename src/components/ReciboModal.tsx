import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, CheckCircle, Building, CreditCard, DollarSign } from 'lucide-react';
import { cupones } from '../types';
import { useApp } from '../context/AppContext';

interface ReciboModalProps {
  cupon: cupones | any | null;
  onClose: () => void;
}

export const ReciboModal: React.FC<ReciboModalProps> = ({ cupon, onClose }) => {
  const { marcarCuponPagado, currentUser, cobradores, showToast } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      document.body.classList.remove('printing-recibo-only');
    };
  }, []);

  if (!cupon || !mounted) return null;

  // Normalización de datos del cupón según la estructura de la API / BD SQL
  const numeroComprobanteNorm = (cupon as any).numeroComprobante || `REC-${cupon.id}`;
  const socioNombreNorm = (cupon as any).socioNombre || `Socio ID: ${cupon.socioId}`;
  const socioDniNorm = (cupon as any).socioDni || 'N/A';
  const periodoMesNorm = (cupon as any).periodoMes || cupon.periodo || 'Período en curso';
  const fechaVencimientoNorm = (cupon as any).fechaVencimiento || '10 de cada mes';
  const totalPagarNorm = Number((cupon as any).totalPagar || cupon.montoTotal || 0);
  const cuotaSocialBaseNorm = Number((cupon as any).cuotaSocialBase || cupon.montoCuotaSocial || 0);
  const costoCasilleroNorm = Number(cupon.montoCasillero || (cupon as any).costoCasillero || 0);
  const estadoPagoNorm = (cupon as any).estadoPago || cupon.estado;

  // Resolución de Zona a partir de la lista de Cobradores de la BD
  const zonaId = cupon.zona || (cupon as any).zonaCobro || 0;
  const cobradorActual = cobradores.find((c) => Number(c.zona) === Number(zonaId));
  const nombreZona = zonaId === 0
    ? 'Zona 0 - Sede Central (Ventanilla)'
    : cobradorActual
    ? `Zona ${zonaId} - ${cobradorActual.nombre} ${cobradorActual.apellido}`
    : `Zona ${zonaId}`;

  const handlePrint = () => {
    try {
      const originalTitle = document.title;
      const printDocTitle = `Recibo_${numeroComprobanteNorm}_${socioNombreNorm.replace(/\s+/g, '_')}`;

      // Aislar el modal para impresión mediante CSS
      document.body.classList.add('printing-recibo-only');
      document.title = printDocTitle;

      showToast('info', 'Imprimiendo recibo', `Abriendo diálogo de impresión para el comprobante ${numeroComprobanteNorm}...`);

      setTimeout(() => {
        try {
          window.focus();
          window.print();
        } catch (error) {
          console.error('Error al invocar window.print():', error);
        } finally {
          setTimeout(() => {
            document.body.classList.remove('printing-recibo-only');
            document.title = originalTitle;
          }, 1200);
        }
      }, 70);
    } catch (error) {
      console.error('Error general al imprimir comprobante:', error);
      window.print();
    }
  };

  const handlePagar = (metodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'SEDE_CENTRAL') => {
    marcarCuponPagado(String(cupon.id), metodo, String(currentUser?.id || ''));
  };

  const modalContent = (
    <div
      id="recibo-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs"
    >
      <div
        id="recibo-modal-card"
        className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95"
      >
        {/* Cabecera del Modal (Oculta durante impresión) */}
        <div
          id="recibo-modal-header"
          className="flex items-center justify-between px-6 py-3.5 bg-[#1A365D] text-white border-b-2 border-[#C53030]"
        >
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-red-400" />
            <span className="font-bold text-sm tracking-wide">COMPROBANTE OFICIAL DE COBRO (BD)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-md transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Área imprimible del recibo */}
        <div id="recibo-printable-content" className="p-6 bg-white text-slate-800 text-xs sm:text-sm">
          {/* Talón para el Socio */}
          <div className="border border-slate-300 rounded-md p-4 mb-4 bg-slate-50/50 print:bg-white print:border-slate-400">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-3">
              <div>
                <h4 className="text-base font-black text-[#1A365D]">CLUB SOCIAL Y DEPORTIVO "EL GLOBO"</h4>
                <p className="text-[11px] text-slate-500">Fundado el 15 de Octubre de 1948 • Personería Jurídica N° 4812</p>
                <p className="text-[11px] text-slate-500">Sede Social: Av. San Martín 1420 • Tel. (03482) 420-1928</p>
              </div>
              <div className="text-right">
                <div className="inline-block px-2.5 py-1 bg-slate-200 rounded font-mono font-bold text-xs text-slate-800 mb-1 print:border print:border-slate-300">
                  {numeroComprobanteNorm}
                </div>
                <div className="text-[11px] text-slate-600">Período: <strong className="text-slate-900">{periodoMesNorm}</strong></div>
                <div className="text-[11px] text-slate-600">Vto: <strong>{fechaVencimientoNorm}</strong></div>
              </div>
            </div>

            {/* Información del Socio y Zona */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 bg-white p-2.5 rounded border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Socio Titular</span>
                <strong className="text-slate-900">{socioNombreNorm}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">DNI</span>
                <span className="text-slate-700 font-mono font-medium">{socioDniNorm}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Zona de Cobro</span>
                <span className="text-slate-700 font-medium">{nombreZona}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Estado</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                  estadoPagoNorm === 'PAGADO' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  estadoPagoNorm === 'DEVUELTO' || estadoPagoNorm === 'ANULADO' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {estadoPagoNorm}
                </span>
              </div>
            </div>

            {/* Tabla de Conceptos */}
            <table className="w-full text-left text-xs mb-3 border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold print:bg-slate-100">
                  <th className="p-2 border-b border-slate-200">Concepto Facturado</th>
                  <th className="p-2 text-right border-b border-slate-200">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="p-2 text-slate-700">Cuota Social Base Mensual</td>
                  <td className="p-2 text-right font-medium font-mono">${cuotaSocialBaseNorm.toLocaleString('es-AR')}</td>
                </tr>
                {cupon.montoActividades > 0 && (
                  <tr>
                    <td className="p-2 text-slate-700">Aranceles de Disciplinas Deportivas</td>
                    <td className="p-2 text-right font-medium font-mono">${Number(cupon.montoActividades).toLocaleString('es-AR')}</td>
                  </tr>
                )}
                {(cupon as any).detalleActividades?.map((act: any, i: number) => (
                  <tr key={i}>
                    <td className="p-2 text-slate-700">Disciplina: {act.nombre}</td>
                    <td className="p-2 text-right font-medium font-mono">${Number(act.monto).toLocaleString('es-AR')}</td>
                  </tr>
                ))}
                {costoCasilleroNorm > 0 && (
                  <tr>
                    <td className="p-2 text-slate-700">Alquiler de Casillero Individual Mensual</td>
                    <td className="p-2 text-right font-medium font-mono">${costoCasilleroNorm.toLocaleString('es-AR')}</td>
                  </tr>
                )}
                {Number(cupon.recargoPorcentaje || (cupon as any).montoRecargoMora || 0) > 0 && (
                  <tr className="text-red-700 bg-red-50/50">
                    <td className="p-2 font-semibold">Recargo Estatutario por Mora ({cupon.recargoPorcentaje || 5}%)</td>
                    <td className="p-2 text-right font-bold font-mono">
                      +${Number((cupon as any).montoRecargoMora || Math.round(totalPagarNorm * 0.05)).toLocaleString('es-AR')}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 print:bg-slate-50">
                  <td className="p-2.5 text-xs uppercase tracking-wide">TOTAL CONSOLIDADO A ABONAR:</td>
                  <td className="p-2.5 text-right text-base text-[#1A365D] font-mono font-black">
                    ${totalPagarNorm.toLocaleString('es-AR')}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Código de barras y timbre de pago */}
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-300">
              <div className="space-y-1">
                <div className="font-mono text-xs tracking-widest text-slate-500 font-bold">
                  ||||| | |||| ||| ||||||| | ||||| |||| |||||
                </div>
                <p className="text-[9px] text-slate-400 font-mono">04812-{socioDniNorm}-{String(cupon.id).padStart(6, '0')}</p>
              </div>
              <div className="text-right text-[10px] text-slate-500">
                <span className="font-semibold block uppercase">Talón Oficial para el Socio</span>
                {estadoPagoNorm === 'PAGADO' ? (
                  <p className="text-emerald-700 font-bold">
                    PAGADO el {cupon.fechaPago ? cupon.fechaPago.slice(0, 10) : 'Fecha registrada en BD'} ({cupon.metodoPago || 'VENTANILLA'})
                  </p>
                ) : (
                  <p className="text-amber-700 font-medium">Pendiente de cobro</p>
                )}
              </div>
            </div>
          </div>

          {/* Línea de corte */}
          <div className="border-t-2 border-dashed border-slate-300 my-4 text-center">
            <span className="bg-white px-3 text-[10px] text-slate-400 uppercase tracking-widest relative -top-2.5">
              ✂ corte aquí para secretaría / cobranza
            </span>
          </div>

          {/* Talón para Tesorería */}
          <div className="border border-slate-300 rounded p-3 bg-slate-50/50 text-xs print:bg-white print:border-slate-400">
            <div className="flex justify-between items-center">
              <div>
                <strong className="text-slate-900 block font-bold">CLUB EL GLOBO — TALÓN DE TESORERÍA / COBRANZA</strong>
                <p className="text-[10px] text-slate-600">
                  Comprobante: <strong className="font-mono">{numeroComprobanteNorm}</strong> • Socio: <strong>{socioNombreNorm}</strong> (DNI: {socioDniNorm}) • Período: {periodoMesNorm}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Recaudado</span>
                <strong className="text-sm text-[#1A365D] font-mono font-black">
                  ${totalPagarNorm.toLocaleString('es-AR')}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción (Ocultos durante la impresión) */}
        <div
          id="recibo-modal-footer"
          className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3"
        >
          {estadoPagoNorm !== 'PAGADO' ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Registrar Cobro:</span>
              <button
                type="button"
                onClick={() => handlePagar('EFECTIVO')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => handlePagar('TRANSFERENCIA')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Transferencia</span>
              </button>
              <button
                type="button"
                onClick={() => handlePagar('SEDE_CENTRAL')}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Ventanilla Sede</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center text-emerald-700 font-semibold text-xs space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Recibo cancelado y asentado en la base de datos</span>
            </div>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            <button
              id="btn-imprimir-recibo"
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] active:scale-95 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              title="Imprimir comprobante oficial"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>Imprimir Recibo</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};