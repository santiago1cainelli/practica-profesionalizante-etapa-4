import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  UserCheck,
  UserX,
  Plus,
  Search,
  Phone,
  Mail,
  Edit2,
  Trash2,
  AlertTriangle,
  Award,
  ShieldAlert,
  ArrowLeft,
  X,
  Briefcase,
  DollarSign,
} from 'lucide-react';
import { useClub } from '../context/AppProvider';
import { useApi } from '../hooks/useApi';
import { instructores } from '../types';

export type InstructorData = instructores & {
  nombre: string;
  apellido: string;
  email: string;
  dni?: string;
  sueldo?: number;
  telefono: string;
  createdAt?: number;
};

export const InstructoresAdmin: React.FC = () => {
  // ✅ Extraemos únicamente lo que existe en AppProvider
  const {
    currentUser,
    setActiveTab,
    instructores: initialInstructores,
    actividades,
    showToast,
  } = useClub();

  // ✅ Conexión directa a /instructores y estado local sincronizado con el contexto
  const instructoresApi = useApi('/instructores');
  const [instructoresList, setInstructoresList] = useState<InstructorData[]>(
    initialInstructores as InstructorData[]
  );

  useEffect(() => {
    setInstructoresList(initialInstructores as InstructorData[]);
  }, [initialInstructores]);

  // Búsqueda por texto
  const [searchTerm, setSearchTerm] = useState('');

  // Estado del modal de creación/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<InstructorData | null>(null);

  // Estado del modal de confirmación de eliminación
  const [instructorToDelete, setInstructorToDelete] = useState<InstructorData | null>(null);

  // Formulario
  const [formData, setFormData] = useState<{
    nombre: string;
    apellido: string;
    dni: string;
    telefono: string;
    email: string;
    sueldo: number;
    createdAt: number;
  }>({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    sueldo: 350000,
    createdAt: Date.now(),
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // ✅ Normaliza los IDs de actividades sin importar cómo vengan de la BD
  const getInstructorDisciplinasIds = (inst: any): string[] => {
    const raw =
      inst.disciplinasIds ??
      inst.actividadesIds ??
      inst.disciplinas ??
      inst.actividades ??
      inst.actividad_id ??
      inst.actividadId ??
      inst.disciplina_id;

    if (!raw) return [];

    if (Array.isArray(raw)) {
      return raw.map((item) =>
        typeof item === 'object' && item !== null ? String(item.id ?? item.actividad_id) : String(item)
      );
    }

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // Si no es JSON válido, lo separamos por coma
      }
      return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return [String(raw)];
  };

  // ✅ Normaliza el sueldo/remuneración sin importar el nombre de la columna en MySQL o el tipo de dato
  const getInstructorRemuneracion = (inst: any): number => {
    const raw =
      inst.remuneracionMensual ??
      inst.sueldo ??
      inst.montoMensual ??
      inst.remuneracion ??
      inst.salario ??
      inst.honorarios ??
      inst.monto ??
      0;

    if (typeof raw === 'number') {
      return isNaN(raw) ? 0 : raw;
    }

    if (typeof raw === 'string') {
      const cleaned = raw.replace(/[^0-9.-]+/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  };

  // ✅ Filtrado únicamente por término de búsqueda (nombre, apellido, DNI, email o teléfono)
  const filteredInstructores = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return instructoresList;

    return instructoresList.filter((inst) => {
      const nombreNorm = `${inst.nombre || ''} ${inst.apellido || ''}`.toLowerCase();
      const dniNorm = inst.dni || '';
      const emailNorm = (inst.email || '').toLowerCase();
      const telNorm = inst.telefono || '';

      return (
        nombreNorm.includes(term) ||
        dniNorm.includes(term) ||
        emailNorm.includes(term) ||
        telNorm.includes(term)
      );
    });
  }, [instructoresList, searchTerm]);

  // Control de Acceso Estricto RBAC: Solo ADMINISTRADOR
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="bg-white rounded-xl shadow-md border border-red-200 p-8 text-center max-w-2xl mx-auto my-12 animate-in fade-in">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Acceso Restringido a Administradores</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          El módulo de Gestión de Instructores y Cuerpo Técnico Deportivo es de acceso exclusivo para la Secretaría y Comisión Directiva con rol de <strong>ADMINISTRADOR</strong>.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() =>
              setActiveTab(
                currentUser?.role === 'PUBLICO'
                  ? 'inicio'
                  : currentUser?.role === 'SOCIO'
                  ? 'portal_socio'
                  : 'dashboard'
              )
            }
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#1A365D] hover:bg-[#142847] text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la pantalla principal</span>
          </button>
        </div>
      </div>
    );
  }

  // KPIs
  const totalInstructores = instructoresList.length;

  const handleOpenCreateModal = () => {
    setEditingInstructor(null);
    setFormData({
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      email: '',
      sueldo: 350000,
      createdAt: Date.now(),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inst: InstructorData) => {
    setEditingInstructor(inst);
    const remuNorm = getInstructorRemuneracion(inst);

    setFormData({
      nombre: inst.nombre || '',
      apellido: inst.apellido || '',
      dni: inst.dni || '',
      telefono: inst.telefono || '',
      email: inst.email || '',
      sueldo: remuNorm,
      createdAt: Date.now(),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!formData.apellido.trim()) errors.apellido = 'El apellido es obligatorio';
    if (!formData.dni.trim()) {
      errors.dni = 'El DNI es obligatorio';
    } else if (!/^\d{7,9}$/.test(formData.dni.replace(/\D/g, ''))) {
      errors.dni = 'DNI inválido (debe contener entre 7 y 9 dígitos)';
    }
    if (!formData.telefono.trim()) errors.telefono = 'El teléfono de contacto es obligatorio';
    if (!formData.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Formato de correo electrónico inválido';
    }
    if (formData.sueldo < 0) {
      errors.sueldo = 'El sueldo no puede ser negativo';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ Alta y Edición directamente contra instructoresApi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const sueldoNumerico = Number(formData.sueldo);

    const payload = {
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      email: formData.email.trim(),
      telefono: formData.telefono.trim(),
      sueldo: sueldoNumerico,
      dni: formData.dni.replace(/\D/g, ''),
    };

    try {
      if (editingInstructor) {
        // ✅ Enviamos solo `payload` (sin `actividades` ni `createdAt` sobrescrito)
        await instructoresApi.update(editingInstructor.id, payload);

        // Para el estado local de la UI sí conservamos `editingInstructor` (para no perder las etiquetas de actividades en la tabla)
        const actualizadoLocal = { ...editingInstructor, ...payload };
        setInstructoresList((prev) =>
          prev.map((item) =>
            String(item.id) === String(editingInstructor.id) ? actualizadoLocal : item
          )
        );
        showToast(
          'success',
          'Instructor actualizado',
          `Se actualizaron los datos de ${payload.nombre} ${payload.apellido}.`
        );
      } else {
        const creado = await instructoresApi.create({
          ...payload,
          createdAt: Date.now(),
        });
        setInstructoresList((prev) => [...prev, creado || { ...payload, id: Date.now() }]);
        showToast(
          'success',
          'Instructor registrado',
          `${payload.nombre} ${payload.apellido} fue dado de alta en la BD.`
        );
      }
      setIsModalOpen(false);
    } catch (error) {
      showToast('error', 'Error al guardar', 'No se pudo persistir el instructor en el servidor.');
    }
  };

  // ✅ Eliminación usando instructoresApi.remove
  const confirmDelete = async () => {
    if (!instructorToDelete) return;

    try {
      await instructoresApi.remove(instructorToDelete.id);
      setInstructoresList((prev) =>
        prev.filter((item) => String(item.id) !== String(instructorToDelete.id))
      );
      showToast('success', 'Instructor eliminado', 'El legajo fue removido de la base de datos.');
      setInstructorToDelete(null);
    } catch (error) {
      showToast('error', 'Error al eliminar', 'No se pudo eliminar el instructor del servidor.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Botón Nuevo */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#1A365D] text-white flex items-center justify-center shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Gestión de Instructores BD
                </h1>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 uppercase">
                  Módulo Administrador
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Alta, baja, actualización y asignación de disciplinas deportivas persistidas en la BD de MySQL
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#C53030] hover:bg-[#9B2C2C] text-white text-xs font-bold rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Instructor</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cuerpo Docente</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalInstructores}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Instructores en nómina BD</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">En Actividad</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Dictando clases regulares</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Deportes Asignados</p>
            <p className="text-2xl font-black text-blue-700 mt-1">
              {totalInstructores} / {actividades.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Instructores vs. actividades</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Secretaría de Deportes</p>
            <p className="text-2xl font-black text-amber-600 mt-1">100%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cobertura institucional</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, DNI, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] focus:border-transparent"
          />
        </div>

        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="px-2 py-1.5 text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Limpiar búsqueda
          </button>
        )}
      </div>

      {/* Tabla de Instructores */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Instructor / Docente</th>
                <th className="py-3.5 px-4">Disciplinas Asignadas</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4">Remuneración</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredInstructores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <UserX className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">
                      No se encontraron instructores registrados en la BD con el criterio buscado.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInstructores.map((inst) => {
                  const nombreNorm = `${inst.nombre || ''} ${inst.apellido || ''}`.trim();
                  const remuNorm = getInstructorRemuneracion(inst);

                  const disciplinasArr = getInstructorDisciplinasIds(inst);
                  const actividadesAsignadas = actividades.filter((a) =>
                    disciplinasArr.includes(String(a.id))
                  );

                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-9 h-9 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            {nombreNorm.replace('Prof. ', '').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">{nombreNorm}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              DNI: {inst.dni || 'N/A'} • Legajo ID: #{inst.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {actividadesAsignadas.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">Sin deportes asignados</span>
                          ) : (
                            actividadesAsignadas.map((act) => (
                              <span
                                key={act.id}
                                className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {act.nombre}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{inst.telefono || 'Sin registrar'}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[170px]">{inst.email || 'Sin registrar'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="text-[11px] font-mono font-bold text-slate-700 flex items-center space-x-1">
                            <DollarSign className="w-3 h-3 text-emerald-600" />
                            <span>${remuNorm.toLocaleString('es-AR')}/mes</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(inst)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Editar legajo del instructor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setInstructorToDelete(inst)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Eliminar instructor de la BD"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Alta / Edición de Instructor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1A365D] text-white rounded-t-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-white" />
                <h3 className="font-black text-sm uppercase tracking-wider">
                  {editingInstructor
                    ? `Editar Legajo #${editingInstructor.id}`
                    : 'Registrar Nuevo Instructor en BD'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ej. Valeria"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                    formErrors.nombre ? 'border-red-500 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {formErrors.nombre && (
                  <p className="text-[11px] text-red-600 mt-1">{formErrors.nombre}</p>
                )}
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ej. Fontana"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                    formErrors.apellido ? 'border-red-500 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {formErrors.apellido && (
                  <p className="text-[11px] text-red-600 mt-1">{formErrors.apellido}</p>
                )}
              </div>

              {/* DNI y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    DNI <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 32401889"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                      formErrors.dni ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.dni && <p className="text-[11px] text-red-600 mt-1">{formErrors.dni}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono Celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 011 15-5120-7788"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                      formErrors.telefono ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.telefono && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.telefono}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="profesor@clubelglobo.com.ar"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                    formErrors.email ? 'border-red-500 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {formErrors.email && <p className="text-[11px] text-red-600 mt-1">{formErrors.email}</p>}
              </div>

              {/* Remuneración */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remuneración Mensual ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={formData.sueldo}
                      onChange={(e) =>
                        setFormData({ ...formData, sueldo: Number(e.target.value) })
                      }
                      className={`w-full pl-7 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A365D] ${
                        formErrors.sueldo ? 'border-red-500 bg-red-50' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {formErrors.sueldo && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.sueldo}</p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1A365D] hover:bg-[#142847] text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {editingInstructor ? 'Guardar Cambios' : 'Confirmar Alta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {instructorToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">¿Eliminar Instructor?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              ¿Estás seguro de que deseas eliminar el registro de{' '}
              <strong>
                {instructorToDelete.nombre ||
                  `${(instructorToDelete as any).nombre || ''} ${
                    (instructorToDelete as any).apellido || ''
                  }`}
              </strong>
              ? La acción eliminará el legajo de la base de datos de MySQL.
            </p>

            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setInstructorToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Sí, Eliminar instructor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};