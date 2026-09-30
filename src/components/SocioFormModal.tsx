import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, AlertCircle } from 'lucide-react';
import { Socio } from '../types';
import { useApp } from '../context/AppContext';
import { ZONAS_NOMBRES } from '../data/mockData';

interface SocioFormModalProps {
  socioToEdit: Socio | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SocioFormModal: React.FC<SocioFormModalProps> = ({ socioToEdit, isOpen, onClose }) => {
  const { addSocio, updateSocio, calcularCategoria } = useApp();

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [zonaCobro, setZonaCobro] = useState<number>(1);
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (socioToEdit) {
      setNombreCompleto(socioToEdit.nombreCompleto);
      setDni(socioToEdit.dni);
      setEmail(socioToEdit.email);
      setTelefono(socioToEdit.telefono);
      setDireccion(socioToEdit.direccion);
      setZonaCobro(socioToEdit.zonaCobro);
      setFechaNacimiento(socioToEdit.fechaNacimiento);
      setFechaIngreso(socioToEdit.fechaIngreso);
    } else {
      setNombreCompleto('');
      setDni('');
      setEmail('');
      setTelefono('');
      setDireccion('');
      setZonaCobro(1);
      setFechaNacimiento('1998-05-15');
      setFechaIngreso(new Date().toISOString().split('T')[0]);
    }
    setErrorMsg('');
  }, [socioToEdit, isOpen]);

  if (!isOpen) return null;

  // Live calculation of preview category
  const previewCalculation = (fechaNacimiento && fechaIngreso)
    ? calcularCategoria(fechaNacimiento, fechaIngreso)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombreCompleto.trim() || !dni.trim() || !fechaNacimiento || !fechaIngreso) {
      setErrorMsg('Por favor complete los campos obligatorios.');
      return;
    }

    if (socioToEdit) {
      updateSocio(socioToEdit.id, {
        nombreCompleto: nombreCompleto.trim(),
        dni: dni.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        zonaCobro,
        fechaNacimiento,
        fechaIngreso,
      });
      onClose();
    } else {
      const success = addSocio({
        nombreCompleto: nombreCompleto.trim(),
        dni: dni.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        zonaCobro,
        fechaNacimiento,
        fechaIngreso,
        esTitularFamilia: false,
        familiares: [],
        actividadesIds: [],
      });

      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#1A365D] text-white border-b-2 border-[#C53030]">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-red-400" />
            <span className="font-bold text-sm tracking-wide">
              {socioToEdit ? `EDITAR SOCIO N° ${socioToEdit.numeroSocio}` : 'ALTA DE NUEVO SOCIO (R2 - R3)'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm text-slate-800">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dynamic Categorization Badge Banner (R2) */}
          {previewCalculation && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Cálculo Automático de Categoría (R2):
                </span>
                <span className="text-xs text-slate-700">
                  Edad calculada: <strong>{previewCalculation.edad} años</strong> • Antigüedad: <strong>{previewCalculation.antiguedadAnios} años</strong>
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  previewCalculation.categoria === 'CADETE'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : previewCalculation.categoria === 'VITALICIO'
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {previewCalculation.categoria}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nombre y Apellido Completo *</label>
              <input
                type="text"
                required
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">DNI Único * (R3)</label>
              <input
                type="text"
                required
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Sin puntos ni guiones"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Zona de Cobro Asignada * (R7)</label>
              <select
                value={zonaCobro}
                onChange={(e) => setZonaCobro(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {[0, 1, 2, 3].map((num) => (
                  <option key={num} value={num}>
                    {ZONAS_NOMBRES[num].nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Fecha de Nacimiento *</label>
              <input
                type="date"
                required
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Cadete: &lt; 18 años | Activo: &ge; 18 años</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Fecha de Ingreso al Club *</label>
              <input
                type="date"
                required
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Vitalicio: &gt; 30 años de antigüedad ininterrumpida</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Teléfono Celular</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="011 15-xxxx-xxxx"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Dirección / Domicilio para Cobrador</label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número, piso y depto"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] text-white rounded text-xs font-bold transition-colors shadow-xs"
            >
              {socioToEdit ? 'Guardar Cambios' : 'Registrar Socio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
