import React, { useState } from 'react';
import { X, UserPlus, Users, AlertCircle } from 'lucide-react';
import { Socio } from '../types';
import { useApp } from '../context/AppContext';
import titularCardBg from '../assets/images/titular_card_bg_1789672816138.jpg';

interface FamiliarModalProps {
  socio: Socio | null;
  onClose: () => void;
}

export const FamiliarModal: React.FC<FamiliarModalProps> = ({ socio, onClose }) => {
  const { addFamiliar, removeFamiliar } = useApp();

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [dni, setDni] = useState('');
  const [parentesco, setParentesco] = useState<'CONYUGE' | 'HIJO' | 'HIJA'>('HIJO');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!socio) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombreCompleto.trim() || !dni.trim() || !fechaNacimiento) {
      setErrorMsg('Todos los campos son obligatorios.');
      return;
    }

    // Validar edad para hijos (< 18 años)
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;

    if ((parentesco === 'HIJO' || parentesco === 'HIJA') && edad >= 18) {
      setErrorMsg('Regla Plan Familiar (R4): Los hijos mayores de 18 años deben registrarse como socios activos individuales.');
      return;
    }

    addFamiliar(socio.id, {
      nombreCompleto: nombreCompleto.trim(),
      dni: dni.trim(),
      parentesco,
      fechaNacimiento,
    });

    setNombreCompleto('');
    setDni('');
    setFechaNacimiento('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#1A365D] text-white border-b-2 border-[#C53030]">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-red-400" />
            <span className="font-bold text-sm tracking-wide">
              PLAN GRUPO FAMILIAR (R4) — SOCIO N° {socio.numeroSocio}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs sm:text-sm text-slate-800">
          
          {/* Titular info */}
          <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
            <div className="absolute inset-0 z-0 pointer-events-none">
              <img
                src={titularCardBg}
                alt="Fondo titular"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A365D] via-[#1A365D]/90 to-slate-900/90" />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                <span>Titular del Plan Familiar</span>
              </span>
              <h4 className="font-bold text-white text-base mt-0.5">{socio.nombreCompleto}</h4>
              <p className="text-slate-200 text-xs mt-0.5">DNI: {socio.dni} • Categoría: <strong className="text-amber-300">{socio.categoria}</strong></p>
            </div>
            <div className="relative z-10 text-right">
              <span className="text-xs bg-white/20 backdrop-blur-xs text-white border border-white/20 font-semibold px-2.5 py-1 rounded">
                {socio.familiares.length} miembro(s) vinculado(s)
              </span>
            </div>
          </div>

          {/* List of current family members */}
          <div>
            <h4 className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wider">
              Miembros Vinculados al Grupo Familiar:
            </h4>

            {socio.familiares.length === 0 ? (
              <p className="text-slate-400 italic bg-slate-50 p-4 rounded text-center border border-dashed border-slate-200">
                No tiene cónyuge ni hijos vinculados en el plan actualmente.
              </p>
            ) : (
              <div className="space-y-2">
                {socio.familiares.map((fam) => (
                  <div
                    key={fam.id}
                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300"
                  >
                    <div>
                      <strong className="text-slate-900 text-xs block">{fam.nombreCompleto}</strong>
                      <span className="text-slate-500 text-[11px]">
                        Parentesco: <strong className="text-[#2B6CB0]">{fam.parentesco}</strong> • DNI: {fam.dni} • Edad: {fam.edad} años
                      </span>
                    </div>
                    <button
                      onClick={() => removeFamiliar(socio.id, fam.id)}
                      className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-semibold transition-colors"
                    >
                      Desvincular
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form to add a new family member */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-[#1A365D] mb-3 text-xs uppercase tracking-wider flex items-center space-x-1">
              <UserPlus className="w-4 h-4 text-[#C53030]" />
              <span>Vincular Nuevo Familiar</span>
            </h4>

            {errorMsg && (
              <div className="mb-3 p-2.5 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre y Apellido Completo *</label>
                <input
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej. Carla Varela"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">DNI del Familiar *</label>
                <input
                  type="text"
                  required
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Sin puntos ni espacios"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Parentesco *</label>
                <select
                  value={parentesco}
                  onChange={(e) => setParentesco(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="CONYUGE">Cónyuge / Pareja</option>
                  <option value="HIJO">Hijo (&lt; 18 años)</option>
                  <option value="HIJA">Hija (&lt; 18 años)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  required
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Nota (R4): Por estatuto del club, los hijos menores de 18 años obtienen un descuento de $1.500 en el recibo unificado familiar.
                </p>
              </div>

              <div className="sm:col-span-2 text-right pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2B6CB0] hover:bg-[#1A365D] text-white rounded font-bold text-xs transition-colors shadow-xs"
                >
                  Vincular al Grupo Familiar
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded font-semibold text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
