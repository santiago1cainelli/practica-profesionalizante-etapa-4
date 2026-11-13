import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  PlusCircle,
} from 'lucide-react';
import { cupones } from '../types';
import { useClub } from '../context/AppProvider';
import { useApi } from '../hooks/useApi';
import { ReciboModal } from './ReciboModal';

export type CuponData = cupones & {
  numeroComprobante?: string;
  socioNombre?: string;
  socioDni?: string;
  zonaCobro?: number;
  periodoMes?: string;
  cuotaSocialBase?: number;
  montoRecargoMora?: number;
  totalPagar?: number;
  estadoPago?: string;
  metodoPago?: string;
};

export const CobranzaZones: React.FC = () => {
  // ✅ Extraemos solo lo que existe en AppProvider
  const {
    cupones: initialCupones,
    socios,
    cobradores,
    actividades,
    currentUser,
    showToast,
  } = useClub();

  // ✅ Conexión directa a /cupones y estado local sincronizado con el contexto
  const cuponesApi = useApi('/cupones');
  const [cuponesList, setCuponesList] = useState<CuponData[]>(initialCupones as CuponData[]);

  useEffect(() => {
    setCuponesList(initialCupones as CuponData[]);
  }, [initialCupones]);

  const [selectedZone, setSelectedZone] = useState<string>('TODAS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingCupon, setViewingCupon] = useState<CuponData | null>(null);
  const [isEmitModalOpen, setIsEmitModalOpen] = useState(false);
  const [targetSocioEmit, setTargetSocioEmit] = useState('');

  // Auto-filtrar por zona asignada si es Cobrador
  useEffect(() => {
    if (currentUser?.role === 'COBRADOR' && currentUser?.zonaAsignada !== undefined) {
      setSelectedZone(currentUser.zonaAsignada.toString());
    }
  }, [currentUser]);

  // Construcción dinámica de la información de las zonas desde la BD
  const zonasInfoMap = [0, 1, 2, 3].map((zNum) => {
    if (zNum === 0) {
      return {
        num: 0,
        nombre: 'Zona 0 - Sede Central',
        cobrador: 'Ventanilla Central',
      };
    }
    const cobradorAsignado = cobradores.find(
      (c) => Number(c.zonaAsignada ?? (c as any).zona) === zNum
    );
    const nombreCobrador = cobradorAsignado
      ? cobradorAsignado.nombreCompleto ||
        `${cobradorAsignado.nombre || ''} ${cobradorAsignado.apellido || ''}`.trim()
      : 'Cobrador Asignado';

    return {
      num: zNum,
      nombre: `Zona ${zNum} - ${nombreCobrador.split(' ')[0]}`,
      cobrador: nombreCobrador,
    };
  });

  const getNombreZona = (zonaNum: number) => {
    const z = zonasInfoMap.find((item) => item.num === Number(zonaNum));
    return z ? z.nombre : `Zona ${zonaNum}`;
  };

  const filteredCupones = cuponesList.filter((c) => {
    const zonaCuponStr = String(c.zonaCobro ?? (c as any).zona ?? 0);
    const estadoCupon = c.estadoPago || (c as any).estado || 'PENDIENTE';
    const matchesZone = selectedZone === 'TODAS' || zonaCuponStr === selectedZone;
    const matchesEstado = selectedEstado === 'TODOS' || estadoCupon === selectedEstado;
    const term = searchTerm.toLowerCase();

    const nombreSocioNorm = (c.socioNombre || (c as any).socio?.nombreCompleto || '').toLowerCase();
    const dniSocioNorm = c.socioDni || (c as any).socio?.dni || '';
    const numComprobanteNorm = (c.numeroComprobante || String(c.id)).toLowerCase();

    const matchesSearch =
      nombreSocioNorm.includes(term) ||
      dniSocioNorm.includes(term) ||
      numComprobanteNorm.includes(term);

    return matchesZone && matchesEstado && matchesSearch;
  });

  // ✅ Emisión de nuevo cupón sin la propiedad inexistente subtotal
  const handleEmitirNuevo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSocioEmit) return;

    const socio = socios.find((s) => String(s.id) === String(targetSocioEmit));
    if (!socio) {
      showToast('error', 'Socio no encontrado');
      return;
    }

    const cuotaBase =
      socio.categoria === 'VITALICIO' ? 0 : socio.categoria === 'CADETE' ? 4500 : 7500;

    const actIds = socio.actividadesIds || [];
    const detalleActividades = actividades
      .filter((a) => actIds.some((id) => String(id) === String(a.id)))
      .map((a) => ({
        nombre: a.nombre,
        monto: Number(a.costoMensual ?? a.arancel ?? 0),
      }));

    const totalActividades = detalleActividades.reduce((acc, item) => acc + item.monto, 0);
    const costoCasillero = socio.casilleroAsignadoId ? 2500 : 0;
    const descuentoFamiliar =
      socio.esTitularFamilia && socio.categoria !== 'VITALICIO' ? Math.round(cuotaBase * 0.15) : 0;
    const totalPagar = Math.max(
      0,
      cuotaBase + totalActividades + costoCasillero - descuentoFamiliar
    );

    const hoy = new Date();
    const periodoMes = hoy.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const vencimiento = new Date(hoy.getFullYear(), hoy.getMonth(), 15).toISOString().split('T')[0];

    const nuevoCupon: any = {
      numeroComprobante: `REC-${Date.now().toString().slice(-6)}`,
      socioId: socio.id,
      socioNombre: socio.nombreCompleto || `${socio.nombre || ''} ${socio.apellido || ''}`.trim(),
      socioDni: socio.dni,
      zonaCobro: Number((socio as any).zonaCobro ?? 0),
      periodoMes: periodoMes.charAt(0).toUpperCase() + periodoMes.slice(1),
      fechaVencimiento: vencimiento,
      cuotaSocialBase: cuotaBase,
      detalleActividades,
      costoCasillero,
      recargoMoraPorcentaje: 0,
      montoRecargoMora: 0,
      descuentoFamiliar,
      totalPagar,
      estadoPago: 'PENDIENTE',
    };

    try {
      const creado = await cuponesApi.create(nuevoCupon);
      setCuponesList((prev) => [creado || { ...nuevoCupon, id: Date.now() }, ...prev]);
      showToast('success', 'Recibo emitido', `Comprobante generado para ${nuevoCupon.socioNombre}.`);
      setIsEmitModalOpen(false);
      setTargetSocioEmit('');
    } catch (error) {
      showToast('error', 'Error al emitir recibo', 'No se pudo registrar el cupón en el servidor.');
    }
  };

  // ✅ Marcar cupón como PAGADO mediante cuponesApi.update
  const handleMarcarPagado = async (cupon: CuponData) => {
    const actualizado: CuponData = {
      ...cupon,
      estadoPago: 'PAGADO',
      metodoPago: 'EFECTIVO',
    };

    try {
      await cuponesApi.update(cupon.id, actualizado);
      setCuponesList((prev) =>
        prev.map((c) => (String(c.id) === String(cupon.id) ? actualizado : c))
      );
      showToast('success', 'Cobro registrado', 'El recibo fue marcado como PAGADO.');
    } catch (error) {
      showToast('error', 'Error al registrar cobro', 'No se pudo actualizar el estado del cupón.');
    }
  };

  // ✅ Reemitir cupón aplicando recargo del 5% por mora sin depender de cupon.subtotal
  const handleReemitirMora = async (cupon: CuponData) => {
    const base = Number(cupon.totalPagar ?? (cupon as any).montoTotal ?? 0);
    const recargo = Math.round(base * 0.05);
    const actualizado: CuponData = {
      ...cupon,
      recargoPorcentaje: 5,
      montoRecargoMora: recargo,
      totalPagar: base + recargo,
      estadoPago: 'VENCIDO',
    };

    try {
      await cuponesApi.update(cupon.id, actualizado);
      setCuponesList((prev) =>
        prev.map((c) => (String(c.id) === String(cupon.id) ? actualizado : c))
      );
      showToast('warning', 'Mora aplicada (+5%)', 'El cupón fue reemitido con recargo por mora.');
    } catch (error) {
      showToast('error', 'Error al aplicar mora', 'No se pudo actualizar el cupón en el servidor.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#1A365D] text-white">
              Tesorería & Zonas BD
            </span>
            <span className="text-xs text-slate-500 font-medium">Gestión de Cobranza Oficial</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1A365D] tracking-tight flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-[#C53030]" />
            <span>Gestión de Cobranza por Zonas (0 a 3)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Emisión de recibos multiconcepto y control de cobro domiciliario registrado en la base de datos.
          </p>
        </div>

        <button
          onClick={() => setIsEmitModalOpen(true)}
          className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Emitir Recibo a Socio</span>
        </button>
      </div>

      {/* Zones Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {zonasInfoMap.map((zInfo) => {
          const zCupones = cuponesList.filter(
            (c) => Number(c.zonaCobro ?? (c as any).zona ?? 0) === zInfo.num
          );
          const zCobrados = zCupones.filter(
            (c) => (c.estadoPago || (c as any).estado) === 'PAGADO'
          );
          const zTotalCobrado = zCobrados.reduce(
            (acc, c) => acc + Number(c.totalPagar || (c as any).montoTotal || (c as any).monto || 0),
            0
          );
          const isSelected = selectedZone === zInfo.num.toString();

          return (
            <button
              key={zInfo.num}
              onClick={() => setSelectedZone(isSelected ? 'TODAS' : zInfo.num.toString())}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#2B6CB0] bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <strong className="text-xs text-[#1A365D] truncate">{zInfo.nombre.split('-')[0]}</strong>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                  {zCupones.length} cupones
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mb-2">{zInfo.cobrador}</p>
              <div className="text-xs text-slate-800 flex justify-between items-center pt-1.5 border-t border-slate-100">
                <span className="text-slate-500 text-[10px]">Cobrado:</span>
                <strong className="text-emerald-700 font-bold">
                  ${zTotalCobrado.toLocaleString('es-AR')}
                </strong>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por socio, DNI o N° comprobante..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODAS">Todas las Zonas (0 a 3)</option>
            <option value="0">Zona 0 - Sede Central</option>
            <option value="1">Zona 1</option>
            <option value="2">Zona 2</option>
            <option value="3">Zona 3</option>
          </select>
        </div>

        <div>
          <select
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="PENDIENTE">Pendientes de Cobro</option>
            <option value="VENCIDO">Vencidos / Con Mora (5%)</option>
            <option value="PAGADO">Pagados y Rendidos</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-3.5">Comprobante</th>
                <th className="p-3.5">Socio / DNI</th>
                <th className="p-3.5">Zona</th>
                <th className="p-3.5">Período</th>
                <th className="p-3.5 text-right">Total</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCupones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No se encontraron cupones de pago con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredCupones.map((cupon) => {
                  const estadoActual = cupon.estadoPago || (cupon as any).estado || 'PENDIENTE';
                  const isPagado = estadoActual === 'PAGADO';
                  const isVencido = estadoActual === 'VENCIDO';
                  const totalPagarNorm = Number(
                    cupon.totalPagar || (cupon as any).montoTotal || (cupon as any).monto || 0
                  );
                  const nombreSocioNorm =
                    cupon.socioNombre || (cupon as any).socio?.nombreCompleto || 'Socio';
                  const dniSocioNorm = cupon.socioDni || (cupon as any).socio?.dni || 'N/A';
                  const numComprobanteNorm = cupon.numeroComprobante || `REC-${cupon.id}`;
                  const recargoMora = Number(cupon.montoRecargoMora || 0);

                  return (
                    <tr key={cupon.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-800">
                        {numComprobanteNorm}
                      </td>
                      <td className="p-3.5">
                        <strong className="text-slate-900 block">{nombreSocioNorm}</strong>
                        <span className="text-[11px] text-slate-500 font-mono">DNI: {dniSocioNorm}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {getNombreZona(Number(cupon.zonaCobro ?? (cupon as any).zona ?? 0)).split('-')[0]}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {cupon.periodoMes || (cupon as any).periodo || 'Período Actual'}
                        {recargoMora > 0 && (
                          <span className="block text-[10px] text-red-600 font-bold">+5% Mora</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-sm text-slate-900">
                        ${totalPagarNorm.toLocaleString('es-AR')}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isPagado
                              ? 'bg-emerald-100 text-emerald-800'
                              : isVencido
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {estadoActual}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => setViewingCupon(cupon)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs transition-colors inline-flex items-center space-x-1 cursor-pointer"
                          title="Ver e Imprimir Comprobante Oficial"
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ver Recibo</span>
                        </button>

                        {!isPagado && (
                          <>
                            <button
                              onClick={() => handleMarcarPagado(cupon)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs transition-colors cursor-pointer"
                              title="Cobrar en Efectivo"
                            >
                              Cobrar
                            </button>

                            {recargoMora === 0 && (
                              <button
                                onClick={() => handleReemitirMora(cupon)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-semibold text-xs transition-colors cursor-pointer"
                                title="Reemitir con 5% Recargo por Mora"
                              >
                                +5% Mora
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emit New Coupon Modal */}
      {isEmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
            <div className="flex items-center justify-between px-6 py-3.5 bg-[#1A365D] text-white border-b-2 border-[#C53030]">
              <span className="font-bold text-sm tracking-wide">EMITIR NUEVO RECIBO DE CUOTA EN BD</span>
              <button
                onClick={() => setIsEmitModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEmitirNuevo} className="p-6 space-y-4 text-xs sm:text-sm text-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seleccionar Socio a Facturar:
                </label>
                <select
                  value={targetSocioEmit}
                  onChange={(e) => setTargetSocioEmit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                >
                  <option value="">-- Seleccionar socio --</option>
                  {socios.map((s) => {
                    const nombreSocio =
                      s.nombreCompleto || `${s.nombre || ''} ${s.apellido || ''}`.trim();
                    return (
                      <option key={s.id} value={String(s.id)}>
                        {nombreSocio} (DNI: {s.dni}) • Cat: {s.categoria}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 space-y-1">
                <p>El backend calculará automáticamente:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Cuota Social según categoría (Cadete, Activo, Vitalicio).</li>
                  <li>Aranceles de actividades deportivas en las que esté inscripto.</li>
                  <li>Alquiler de casillero si tiene uno asignado.</li>
                  <li>Descuento por hijos del Plan Familiar.</li>
                  <li>Recargo de mora si adeuda períodos anteriores.</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmitModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!targetSocioEmit}
                  className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white rounded text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Generar Cupón Oficial BD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Viewer Modal */}
      <ReciboModal cupon={viewingCupon} onClose={() => setViewingCupon(null)} />
    </div>
  );
};