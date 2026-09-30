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
  Calendar
} from 'lucide-react';
import { Socio } from '../types';
import { useApp } from '../context/AppContext';
import { ZONAS_NOMBRES } from '../data/mockData';
import { SocioFormModal } from './SocioFormModal';
import { FamiliarModal } from './FamiliarModal';

export const SocioList: React.FC = () => {
  const { socios, deleteSocio, generarCuponMesActual, regularizarDeudaSocio, setActiveTab } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [selectedZona, setSelectedZona] = useState<string>('TODAS');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [socioToEdit, setSocioToEdit] = useState<Socio | null>(null);
  const [socioFamilia, setSocioFamilia] = useState<Socio | null>(null);

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
            <span>Padrón de Socios y Categorización (R2 - R3)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión completa de socios, cálculo dinámico de categorías y vinculación al Plan Grupo Familiar (R4).
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Alta Nuevo Socio</span>
        </button>
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
            <option value="CADETE">Cadetes (&lt; 18 años)</option>
            <option value="ACTIVO">Activos (&ge; 18 años)</option>
            <option value="VITALICIO">Vitalicios (&gt; 30 años)</option>
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
            <option value="SUSPENDIDO_MOROSIDAD">Suspendido Morosidad (R10)</option>
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

      {/* Socios Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSocios.map((socio) => {
          const isSuspended = socio.estado === 'SUSPENDIDO_MOROSIDAD';
          const isDeudor = socio.estado === 'DEUDOR_1_MES';
          const zona = ZONAS_NOMBRES[socio.zonaCobro];

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
                <p className="text-xs text-slate-500 font-mono mb-3">DNI: {socio.dni}</p>

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

                {/* Warning if suspended R10 */}
                {isSuspended && (
                  <div className="mb-3 p-2 bg-red-100/70 border border-red-300 rounded text-[11px] text-red-800 flex items-start space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Bloqueo Activo (R10):</strong> Adeuda {socio.cuotasAdeudadas} cuotas. Acceso bloqueado a deportes y casilleros.
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
                    title="Administrar Grupo Familiar (R4)"
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
