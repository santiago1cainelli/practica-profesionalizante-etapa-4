import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Trophy,
  Users,
  Receipt,
  MapPin,
  Banknote
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReciboModal } from './ReciboModal';
import { CuponRecibo } from '../types';
import titularCardBg from '../assets/images/titular_card_bg_1789672816138.jpg';

export const SocioPortal: React.FC = () => {
  const { socios, actividades, cupones, cobradores, currentUser, unenrollSocioFromActividad, setActiveTab } = useApp();

  // Socio seleccionado (por defecto currentUser.socioId o el primero del padrón)
  const defaultSocioId = (currentUser?.role === 'SOCIO' && currentUser.socioId)
    ? currentUser.socioId
    : (currentUser?.socioId || socios[0]?.id || '');

  const [selectedSocioId, setSelectedSocioId] = useState<string>(String(defaultSocioId));
  const [viewingCupon, setViewingCupon] = useState<CuponRecibo | null>(null);

  // Sincronizar socio si el usuario con rol SOCIO cambia de sesión
  React.useEffect(() => {
    if (currentUser?.role === 'SOCIO' && currentUser.socioId) {
      setSelectedSocioId(String(currentUser.socioId));
    }
  }, [currentUser]);

  // Si el rol es SOCIO, solo puede visualizaciones de su propio perfil
  const effectiveSocioId = (currentUser?.role === 'SOCIO' && currentUser.socioId)
    ? currentUser.socioId
    : selectedSocioId;

  const socio = socios.find((s) => String(s.id) === String(effectiveSocioId)) || socios[0];

  if (!socio) {
    return <div className="p-8 text-center text-slate-500">No hay socios registrados en la base de datos.</div>;
  }

  const isSuspended = socio.estado === 'SUSPENDIDO_MOROSIDAD' || socio.estado === 'SUSPENDIDO';

  // Obtener el cobrador asignado a la zona del socio desde la BD
  const cobradorAsignado = cobradores.find((c) => Number(c.zona) === Number(socio.zonaCobro));
  const nombreZona = socio.zonaCobro === 0 
    ? 'Sede Central (Club)' 
    : `Zona ${socio.zonaCobro} - ${cobradorAsignado ? `${cobradorAsignado.nombre} ${cobradorAsignado.apellido}` : 'Cobrador de Zona'}`;

  // Actividades del socio traídas desde la BD
  const misActividades = actividades.filter((a) => 
    socio.actividadesIds?.includes(a.id) || (socio.actividadesIds as any)?.includes(Number(a.id))
  );
  
  // Cupones del socio traídos desde la BD
  const misCupones = cupones.filter((c) => String(c.socioId) === String(socio.id));

  // Importes de cuota y aranceles según datos reales de la BD
  const cuotaBase = (socio as any).montoCuotaSocial ?? 0;
  const costoActividades = misActividades.reduce((sum, a) => sum + Number((a as any).costoMensual || a.arancel || 0), 0);
  const costoCasillero = socio.casilleroAsignadoId ? Number((socio as any).costoCasillero || 2500) : 0;
  const hijosCount = (socio.familiares || []).filter((f) => f.parentesco === 'HIJO' || f.parentesco === 'HIJA').length;
  
  const subtotal = Math.max(0, cuotaBase + costoActividades + costoCasillero);
  const tieneMora = (socio.cuotasAdeudadas || 0) > 0;
  const montoRecargoMora = tieneMora ? Math.round(subtotal * 0.05) : 0; // Recargo por mora del 5%
  const totalMes = subtotal + montoRecargoMora;

  return (
    <div className="space-y-6">
      
      {/* Encabezado y Selector de Socio */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-indigo-600 text-white">
              Portal del Socio
            </span>
            <span className="text-xs text-slate-500 font-medium">Carnet Digital Oficial</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1A365D] tracking-tight flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-[#C53030]" />
            <span>Credencial Digital & Autogestión</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acceso a instalaciones, estado de cuenta, casillero y disciplinas deportivas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Valor de Cuota Social */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-300/80 px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] uppercase font-black text-emerald-800 tracking-wider">
                  Valor Cuota Social
                </span>
                <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded text-[9px] font-bold uppercase">
                  {socio.categoria}
                </span>
              </div>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-emerald-950 font-mono tracking-tight">
                  {cuotaBase > 0 ? `$${cuotaBase.toLocaleString('es-AR')}` : '$0'}
                </span>
                <span className="text-xs text-emerald-800 font-semibold">
                  {cuotaBase > 0 ? '/ mes' : '(Exento)'}
                </span>
              </div>
            </div>
          </div>

          {/* Selector exclusivo para Administrador */}
          {currentUser?.role === 'ADMIN' ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Ver como socio:</span>
              <select
                value={socio.id}
                onChange={(e) => setSelectedSocioId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {socios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombreCompleto || `${s.nombre} ${s.apellido}`} (Socio N° {s.numeroSocio})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold">
                Sesión de Socio: {socio.nombreCompleto || `${socio.nombre} ${socio.apellido}`}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Carnet Digital */}
        <div className="lg:col-span-1">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 bg-slate-900 text-white p-6 flex flex-col justify-between min-h-[440px]">
            {/* Imagen de fondo del carnet */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <img
                src={titularCardBg}
                alt="Fondo credencial socio titular"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#1A365D]/95 via-[#0F172A]/90 to-slate-950/95 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/20 rounded-full blur-2xl" />
            </div>

            {/* Cabecera del Carnet */}
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#C53030] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white/20">
                    G
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-wider uppercase leading-none">
                      Club El Globo
                    </h3>
                    <span className="text-[10px] text-blue-200 uppercase tracking-widest block mt-0.5 font-medium">
                      Carnet Digital Oficial
                    </span>
                  </div>
                </div>

                <span className="font-mono text-xs bg-white/10 backdrop-blur-xs px-2 py-1 rounded text-blue-100 font-bold border border-white/10">
                  N° {socio.numeroSocio}
                </span>
              </div>

              {/* Categoría y Estado */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    socio.categoria === 'CADETE'
                      ? 'bg-amber-400 text-amber-950'
                      : socio.categoria === 'VITALICIO'
                      ? 'bg-purple-300 text-purple-950'
                      : 'bg-blue-300 text-blue-950'
                  }`}
                >
                  {socio.categoria}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/20 font-mono shadow-xs">
                  Cuota: {cuotaBase > 0 ? `$${cuotaBase.toLocaleString('es-AR')}/mes` : '$0 (Exento)'}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isSuspended ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500 text-white'
                  }`}
                >
                  {isSuspended ? 'SUSPENDIDO' : 'HABILITADO'}
                </span>
              </div>

              {/* Datos del Titular */}
              <div className="relative overflow-hidden rounded-xl border border-white/25 bg-gradient-to-r from-white/15 via-white/10 to-white/5 backdrop-blur-md p-4 mb-4 shadow-lg">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase text-red-300 font-bold tracking-wider flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block animate-pulse" />
                      <span>Nombre del Titular</span>
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-white/15 text-slate-200 uppercase font-bold tracking-wider border border-white/10">
                      Titular Oficial
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight leading-snug drop-shadow-md">
                    {socio.nombreCompleto || `${socio.nombre} ${socio.apellido}`}
                  </h2>
                  <div className="flex items-center justify-between mt-1 text-xs text-blue-200 font-mono">
                    <span>DNI: {socio.dni}</span>
                    <span className="text-[10px] text-slate-300 font-sans">
                      Ingreso: {socio.fechaIngreso ? socio.fechaIngreso.slice(0, 4) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] text-blue-100 bg-black/30 backdrop-blur-xs p-2.5 rounded-lg border border-white/10 mb-4">
                <div>
                  <span className="text-[9px] text-blue-300 block uppercase">Cuota Base</span>
                  <strong className="text-white font-mono">{cuotaBase > 0 ? `$${cuotaBase.toLocaleString('es-AR')}` : '$0'}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-blue-300 block uppercase">Antigüedad</span>
                  <strong>{socio.antiguedadAnios || 0} años</strong>
                </div>
                <div>
                  <span className="text-[9px] text-blue-300 block uppercase">Casillero</span>
                  <strong>{socio.casilleroAsignadoId ? `N° ${socio.casilleroAsignadoId}` : 'Sin asignar'}</strong>
                </div>
              </div>
            </div>

            {/* Código QR */}
            <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] text-blue-300 uppercase tracking-widest block">Código de Acceso</span>
                <span className="text-xs font-mono text-white font-bold tracking-widest">
                  GLOBO-{socio.numeroSocio}-{socio.dni.slice(-4)}
                </span>
              </div>

              <div className="bg-white p-1.5 rounded-lg shadow-md flex items-center justify-center">
                <QrCode className="w-10 h-10 text-slate-900" />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center mt-2 italic">
            Presente este código QR en el molinete de entrada a la sede.
          </p>
        </div>

        {/* Detalles del Socio, Servicios e Historial */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Alerta de Estado */}
          {isSuspended ? (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-xl text-xs text-red-900 flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-red-950 mb-0.5">
                  Atención: Acceso Suspendido por Morosidad
                </strong>
                <p>
                  Usted registra {socio.cuotasAdeudadas || 0} cuotas consecutivas adeudadas. Para habilitar su carnet en los molinetes, hacer uso de su casillero o continuar en sus disciplinas deportivas, por favor regularice su saldo pendiente con el cobrador de zona o en secretaría.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-xl text-xs text-emerald-900 flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-sm font-bold text-emerald-950">
                  Cuota al Día • Carnet Habilitado
                </strong>
                <p className="text-emerald-800">
                  Acceso habilitado a todas las instalaciones, vestuarios y actividades inscriptas.
                </p>
              </div>
            </div>
          )}

          {/* Resumen de Cuota Mensual */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start sm:items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded">
                      Cuota Mensual Oficial
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Categoría {socio.categoria}</span>
                  </div>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                      {cuotaBase > 0 ? `$${cuotaBase.toLocaleString('es-AR')}` : '$0'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {cuotaBase > 0 ? '/ mes (Cuota Social Base)' : '(Exento de por vida por Estatuto)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:text-right sm:border-l sm:pl-5 border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">Total Mensual Estimado</span>
                <span className="text-2xl font-black text-[#1A365D] font-mono block">
                  ${totalMes.toLocaleString('es-AR')}
                </span>
                <span className="text-[11px] text-slate-500">
                  {(socio.cuotasAdeudadas || 0) > 0 ? `Registra deuda (${socio.cuotasAdeudadas} meses)` : 'Al día • Sin recargos'}
                </span>
              </div>
            </div>

            {/* Desglose de aranceles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Cuota Social ({socio.categoria})</span>
                <span className="text-sm font-extrabold text-slate-900 font-mono mt-0.5 block">
                  {cuotaBase > 0 ? `$${cuotaBase.toLocaleString('es-AR')}` : '$0'}
                </span>
                <span className="text-[10px] text-slate-500">Membresía institucional</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Deportes ({misActividades.length})</span>
                <span className="text-sm font-extrabold text-slate-900 font-mono mt-0.5 block">
                  {costoActividades > 0 ? `+$${costoActividades.toLocaleString('es-AR')}` : '$0'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {misActividades.length > 0 ? `${misActividades.length} disciplina(s)` : 'Sin actividades'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Casillero Mensual</span>
                <span className="text-sm font-extrabold text-slate-900 font-mono mt-0.5 block">
                  {costoCasillero > 0 ? `+$${costoCasillero.toLocaleString('es-AR')}` : '$0'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {socio.casilleroAsignadoId ? `Locker N° ${socio.casilleroAsignadoId}` : 'Sin casillero'}
                </span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200/80">
                <span className="text-[10px] text-emerald-800 uppercase block font-bold">Plan Familiar</span>
                <span className="text-sm font-extrabold text-emerald-700 font-mono mt-0.5 block">
                  $0
                </span>
                <span className="text-[10px] text-emerald-700">
                  {hijosCount > 0 ? `${hijosCount} hijo(s) vinculado(s)` : 'Sin miembros vinculados'}
                </span>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center text-[11px] text-slate-500 gap-2">
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Modalidad de Cobro: <strong>{nombreZona}</strong></span>
              </span>
              <span className="font-medium text-slate-600">
                Vencimiento regular: 10 de cada mes
              </span>
            </div>
          </div>

          {/* Actividades & Grupo Familiar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Actividades inscriptas */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <Trophy className="w-4 h-4 text-[#2B6CB0]" />
                    <span>Mis Disciplinas Deportivas</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('actividades')}
                    className="text-[11px] font-bold text-[#1A365D] hover:text-[#2B6CB0] flex items-center space-x-1"
                  >
                    <span>+ Inscribirme</span>
                  </button>
                </div>

                {misActividades.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-lg text-center border border-slate-100">
                    <p className="text-slate-400 text-xs mb-2">No estás inscripto en actividades deportivas.</p>
                    <button
                      onClick={() => setActiveTab('actividades')}
                      className="px-3 py-1.5 bg-[#1A365D] hover:bg-[#2B6CB0] text-white rounded text-xs font-bold transition-colors shadow-xs"
                    >
                      Explorar Vitrina de Deportes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {misActividades.map((act) => {
                      const costo = Number((act as any).costoMensual || act.arancel || 0);
                      return (
                        <div key={act.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-start gap-2">
                          <div>
                            <strong className="text-slate-900 block">{act.nombre}</strong>
                            <span className="text-[11px] text-slate-500 block">
                              {act.diasSemana || (act as any).dias?.join(', ')} • {act.horaInicio ? `${act.horaInicio} hs` : ''}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 font-mono">
                              ${costo.toLocaleString('es-AR')}/mes
                            </span>
                          </div>
                          <button
                            onClick={() => unenrollSocioFromActividad(String(socio.id), String(act.id))}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-semibold transition-colors shrink-0"
                            title="Darse de baja de esta actividad"
                          >
                            Darme de baja
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Grupo Familiar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-2 mb-3 text-slate-800 font-bold text-xs uppercase tracking-wider">
                <Users className="w-4 h-4 text-[#C53030]" />
                <span>Grupo Familiar Asociado</span>
              </div>

              {(!socio.familiares || socio.familiares.length === 0) ? (
                <p className="text-slate-400 text-xs italic">No tienes familiares vinculados en tu plan.</p>
              ) : (
                <div className="space-y-2">
                  {socio.familiares.map((fam) => (
                    <div key={fam.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                      <strong className="text-slate-900 block">{fam.nombreCompleto || fam.nombre}</strong>
                      <span className="text-[11px] text-slate-500">
                        {fam.parentesco} • DNI: {fam.dni} • {fam.edad || 0} años
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Historial de Cupones y Comprobantes */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-slate-600" />
              <span>Historial de Comprobantes y Recibos</span>
            </h3>

            {misCupones.length === 0 ? (
              <p className="text-slate-400 text-xs italic">No hay cupones emitidos todavía en la base de datos.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {misCupones.map((cup) => (
                  <div key={cup.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-900 block font-mono">
                        {(cup as any).numeroComprobante || `REC-${cup.id}`}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Período: {(cup as any).periodoMes || cup.periodo} • Vto: {(cup as any).fechaVencimiento || 'Al día'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-slate-800">
                        ${((cup as any).totalPagar || cup.montoTotal || 0).toLocaleString('es-AR')}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          (cup as any).estadoPago === 'PAGADO' || cup.estado === 'PAGADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : (cup as any).estadoPago === 'VENCIDO'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {(cup as any).estadoPago || cup.estado}
                      </span>

                      <button
                        onClick={() => setViewingCupon(cup)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                        title="Ver e Imprimir Comprobante Oficial"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ver Recibo</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ReciboModal cupon={viewingCupon} onClose={() => setViewingCupon(null)} />
    </div>
  );
};