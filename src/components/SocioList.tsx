import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Users2,
  Receipt,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Grid,
  ShieldAlert,
  ArrowRight,
  Phone,
  MapPin,
  Calendar,
  Banknote,
  LayoutGrid,
  List,
  Sparkles,
  Info
} from 'lucide-react';
import { Socio, Actividad } from '../types';
import { useApp } from '../context/AppContext';
import { ZONAS_NOMBRES, CUOTA_VALORES } from '../data/mockData';
import { SocioFormModal } from './SocioFormModal';
import { FamiliarModal } from './FamiliarModal';

export const SocioList: React.FC = () => {
  const {
    socios,
    actividades,
    deleteSocio,
    generarCuponMesActual,
    regularizarDeudaSocio,
    setActiveTab,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [selectedZona, setSelectedZona] = useState<string>('TODAS');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [socioToEdit, setSocioToEdit] = useState<Socio | null>(null);
  const [socioFamilia, setSocioFamilia] = useState<Socio | null>(null);

  // Helper to calculate total fee for a socio
  const getCuotaInfo = (socio: Socio) => {
    const cuotaBase = CUOTA_VALORES[socio.categoria] ?? 0;

    const actividadesSocio = (socio.actividadesIds || [])
      .map((actId) => actividades.find((a) => a.id === actId))
      .filter(Boolean) as Actividad[];

    const costoActividades = actividadesSocio.reduce((sum, a) => sum + a.costoMensual, 0);
    const costoCasillero = socio.casilleroAsignadoId ? CUOTA_VALORES.CASILLERO_MENSUAL : 0;
    const hijosCount = (socio.familiares || []).filter(
      (f) => f.parentesco === 'HIJO' || f.parentesco === 'HIJA'
    ).length;
    const descuentoFamiliar = hijosCount * CUOTA_VALORES.DESCUENTO_FAMILIAR_POR_HIJO;

    const totalMensual = Math.max(0, cuotaBase + costoActividades + costoCasillero - descuentoFamiliar);

    return {
      cuotaBase,
      costoActividades,
      costoCasillero,
      descuentoFamiliar,
      totalMensual,
      actividadesSocio,
    };
  };

  // Filter logic
  const filteredSocios = socios.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      s.nombreCompleto.toLowerCase().includes(term) ||
      s.dni.includes(term) ||
      s.numeroSocio.toString().includes(term);

    const matchesCategoria = selectedCategoria === 'TODAS' || s.categoria === selectedCategoria;
    const matchesEstado = selectedEstado === 'TODOS' || s.estado === selectedEstado;
    const matchesZona = selectedZona === 'TODAS' || s.zonaCobro.toString() === selectedZona;

    return matchesSearch && matchesCategoria && matchesEstado && matchesZona;
  });

  const handleEdit = (socio: Socio) => {
    setSocioToEdit(socio);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSocioToEdit(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string, nombre: string) => {
    if (window.confirm(`¿Está seguro de dar de baja al socio ${nombre}?`)) {
      deleteSocio(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1A365D] tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-[#C53030]" />
            <span>Padrón de Socios y Categorización</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión completa de socios, valores de cuota mensual, categorías y grupo familiar.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View toggle */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center space-x-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-[#1A365D] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en Tarjetas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#1A365D] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en Tabla"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tabla</span>
            </button>
          </div>

          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Alta Nuevo Socio</span>
          </button>
        </div>
      </div>

      {/* Aranceles Oficiales Summary Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1A365D] to-slate-900 text-white p-4 rounded-xl shadow-xs border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Banknote className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center space-x-1.5">
              <span>Valores Oficiales de Cuotas Sociales</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-emerald-400/30">
                Periodo Vigente
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              Aranceles mensuales estipulados según categoría y beneficios del club
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-[10px] text-blue-200 uppercase block font-semibold">Activo (&ge;18)</span>
            <span className="font-mono font-bold text-sm text-emerald-300">
              ${CUOTA_VALORES.ACTIVO.toLocaleString('es-AR')}/mes
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-[10px] text-amber-200 uppercase block font-semibold">Cadete (&lt;18)</span>
            <span className="font-mono font-bold text-sm text-amber-300">
              ${CUOTA_VALORES.CADETE.toLocaleString('es-AR')}/mes
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-[10px] text-purple-200 uppercase block font-semibold">Vitalicio (&gt;30a)</span>
            <span className="font-mono font-bold text-sm text-purple-200">
              Exento ($0)
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-[10px] text-slate-300 uppercase block font-semibold">Casillero / Mes</span>
            <span className="font-mono font-bold text-sm text-slate-200">
              ${CUOTA_VALORES.CASILLERO_MENSUAL.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nombre, DNI o N°..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Categoria */}
        <div>
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODAS">Todas las Categorías</option>
            <option value="CADETE">Cadetes (&lt; 18 años) - ${CUOTA_VALORES.CADETE.toLocaleString('es-AR')}/m</option>
            <option value="ACTIVO">Activos (&ge; 18 años) - ${CUOTA_VALORES.ACTIVO.toLocaleString('es-AR')}/m</option>
            <option value="VITALICIO">Vitalicios (&gt; 30 años) - Exento ($0)</option>
          </select>
        </div>

        {/* Estado Morosidad */}
        <div>
          <select
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="AL_DIA">Al Día (Sin deuda)</option>
            <option value="DEUDOR_1_MES">Deudor 1 Mes (Aviso)</option>
            <option value="SUSPENDIDO_MOROSIDAD">Suspendido por Morosidad</option>
          </select>
        </div>

        {/* Zona */}
        <div>
          <select
            value={selectedZona}
            onChange={(e) => setSelectedZona(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODAS">Todas las Zonas</option>
            <option value="0">Zona 0 - Sede Central</option>
            <option value="1">Zona 1 - Centro & Norte</option>
            <option value="2">Zona 2 - Sur & Estación</option>
            <option value="3">Zona 3 - Este & Costanera</option>
          </select>
        </div>
      </div>

      {/* Roster View: Cards Mode */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSocios.map((socio) => {
            const isSuspended = socio.estado === 'SUSPENDIDO_MOROSIDAD';
            const isDeudor = socio.estado === 'DEUDOR_1_MES';
            const zona = ZONAS_NOMBRES[socio.zonaCobro];
            const cuotaInfo = getCuotaInfo(socio);

            return (
              <div
                key={socio.id}
                className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  isSuspended
                    ? 'border-red-300 bg-red-50/20 hover:border-red-400'
                    : isDeudor
                    ? 'border-amber-300 hover:border-amber-400'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div>
                  {/* Card Header: Socio Number & Category */}
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      SOCIO N° {socio.numeroSocio}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          socio.categoria === 'CADETE'
                            ? 'bg-amber-100 text-amber-800'
                            : socio.categoria === 'VITALICIO'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {socio.categoria}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSuspended
                            ? 'bg-red-600 text-white'
                            : isDeudor
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isSuspended ? 'SUSPENDIDO' : isDeudor ? '1 MES MORA' : 'AL DÍA'}
                      </span>
                    </div>
                  </div>

                  {/* Name & DNI */}
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {socio.nombreCompleto}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mb-2">DNI: {socio.dni}</p>

                  {/* Valor de Cuota del Socio */}
                  <div className="mb-3 p-2.5 bg-emerald-50/80 border border-emerald-200/90 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Banknote className="w-4 h-4 text-emerald-700" />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                            Cuota Social Mensual
                          </div>
                          <div className="text-sm font-mono font-black text-emerald-950">
                            {cuotaInfo.cuotaBase > 0 ? (
                              <span>${cuotaInfo.cuotaBase.toLocaleString('es-AR')}<span className="text-[11px] font-normal text-emerald-700">/mes</span></span>
                            ) : (
                              <span className="text-purple-800 font-bold">$0 <span className="text-[10px] font-medium text-purple-600">(Exento estatutario)</span></span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Total Mensual con actividades / casillero */}
                      {cuotaInfo.totalMensual !== cuotaInfo.cuotaBase && (
                        <div className="text-right pl-2 border-l border-emerald-200">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase">
                            Total c/ aranceles
                          </div>
                          <div className="text-sm font-mono font-black text-slate-900">
                            ${cuotaInfo.totalMensual.toLocaleString('es-AR')}
                            <span className="text-[10px] font-normal text-slate-500">/mes</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Breakdown details if any extras */}
                    {(cuotaInfo.costoActividades > 0 || cuotaInfo.costoCasillero > 0 || cuotaInfo.descuentoFamiliar > 0) && (
                      <div className="mt-2 pt-1.5 border-t border-emerald-200/60 flex flex-wrap gap-1 text-[10px]">
                        {cuotaInfo.costoActividades > 0 && (
                          <span className="bg-white/80 px-1.5 py-0.5 rounded text-slate-700 border border-emerald-200/50">
                            +{cuotaInfo.actividadesSocio.length} Actividad(es): ${cuotaInfo.costoActividades.toLocaleString('es-AR')}
                          </span>
                        )}
                        {cuotaInfo.costoCasillero > 0 && (
                          <span className="bg-white/80 px-1.5 py-0.5 rounded text-blue-800 border border-blue-200/50">
                            +Casillero: ${cuotaInfo.costoCasillero.toLocaleString('es-AR')}
                          </span>
                        )}
                        {cuotaInfo.descuentoFamiliar > 0 && (
                          <span className="bg-emerald-100/90 px-1.5 py-0.5 rounded text-emerald-800 font-semibold border border-emerald-300">
                            -Dto Familiar: -${cuotaInfo.descuentoFamiliar.toLocaleString('es-AR')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info List */}
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2 mb-3">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {socio.edad} años • Antigüedad: <strong>{socio.antiguedadAnios} años</strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{zona?.nombre || `Zona ${socio.zonaCobro}`}</span>
                    </div>

                    {socio.casilleroAsignadoId && (
                      <div className="flex items-center space-x-1.5 text-blue-700 font-semibold">
                        <Grid className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Casillero N° {socio.casilleroAsignadoId} asignado</span>
                      </div>
                    )}

                    {socio.familiares.length > 0 && (
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <Users2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{socio.familiares.length} familiar(es) vinculados</span>
                      </div>
                    )}
                  </div>

                  {/* Warning if suspended */}
                  {isSuspended && (
                    <div className="mb-3 p-2 bg-red-100/70 border border-red-300 rounded text-[11px] text-red-800 flex items-start space-x-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Bloqueo Activo:</strong> Adeuda {socio.cuotasAdeudadas} cuotas. Acceso bloqueado a deportes y casilleros.
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSocioFamilia(socio)}
                      className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2B6CB0] rounded text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                      title="Administrar Grupo Familiar"
                    >
                      <Users2 className="w-3.5 h-3.5" />
                      <span>Plan Familiar ({socio.familiares.length})</span>
                    </button>

                    <button
                      onClick={() => generarCuponMesActual(socio.id)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                      title="Emitir Cupón de Pago Mes en Curso"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleEdit(socio)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                      title="Editar Datos"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(socio.id, socio.nombreCompleto)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                      title="Dar de Baja"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Regularize debt button if delinquent */}
                  {isSuspended && (
                    <button
                      onClick={() => regularizarDeudaSocio(socio.id)}
                      className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Regularizar Deuda en Sede</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Roster View: Table Mode */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">N° Socio</th>
                  <th className="py-3 px-4">Nombre y DNI</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-emerald-800">Cuota Social</th>
                  <th className="py-3 px-4">Total Mensual</th>
                  <th className="py-3 px-4">Zona Cobro</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSocios.map((socio) => {
                  const isSuspended = socio.estado === 'SUSPENDIDO_MOROSIDAD';
                  const isDeudor = socio.estado === 'DEUDOR_1_MES';
                  const zona = ZONAS_NOMBRES[socio.zonaCobro];
                  const cuotaInfo = getCuotaInfo(socio);

                  return (
                    <tr
                      key={socio.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSuspended ? 'bg-red-50/30' : isDeudor ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        #{socio.numeroSocio}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{socio.nombreCompleto}</div>
                        <div className="text-[11px] text-slate-400 font-mono">DNI: {socio.dni}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            socio.categoria === 'CADETE'
                              ? 'bg-amber-100 text-amber-800'
                              : socio.categoria === 'VITALICIO'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {socio.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 font-mono font-bold text-xs text-emerald-700">
                          <Banknote className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {cuotaInfo.cuotaBase > 0
                              ? `$${cuotaInfo.cuotaBase.toLocaleString('es-AR')}/mes`
                              : '$0 (Exento)'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ${cuotaInfo.totalMensual.toLocaleString('es-AR')}
                        <span className="text-[10px] font-normal text-slate-500">/mes</span>
                        {cuotaInfo.costoActividades > 0 && (
                          <div className="text-[10px] text-slate-500 font-normal">
                            incl. {cuotaInfo.actividadesSocio.length} actividad(es)
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {zona?.nombre || `Zona ${socio.zonaCobro}`}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSuspended
                              ? 'bg-red-600 text-white'
                              : isDeudor
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {isSuspended ? 'SUSPENDIDO' : isDeudor ? '1 MES MORA' : 'AL DÍA'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setSocioFamilia(socio)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#2B6CB0] rounded transition-colors"
                            title="Plan Familiar"
                          >
                            <Users2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => generarCuponMesActual(socio.id)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                            title="Emitir Cupón"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(socio)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                            title="Editar Datos"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(socio.id, socio.nombreCompleto)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                            title="Dar de Baja"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredSocios.length === 0 && (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <h4 className="text-base font-bold text-slate-700">No se encontraron socios</h4>
          <p className="text-xs text-slate-500">Intente modificar los filtros o la búsqueda.</p>
        </div>
      )}

      {/* Modals */}
      <SocioFormModal
        isOpen={isFormOpen}
        socioToEdit={socioToEdit}
        onClose={() => setIsFormOpen(false)}
      />

      <FamiliarModal
        socio={socioFamilia}
        onClose={() => setSocioFamilia(null)}
      />
    </div>
  );
};
