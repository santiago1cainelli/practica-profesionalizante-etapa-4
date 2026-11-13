import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle } from 'lucide-react';
import { socios, SocioCategoria } from '../types';
import { useClub } from '../context/AppProvider';

interface SocioFormModalProps {
  socioToEdit: socios | any | null;
  isOpen: boolean;
  onClose: () => void;
}

// ✅ Cálculo estatutario local de categoría, edad y antigüedad
const calcularCategoriaEstatuto = (
  fechaNacimientoStr: string,
  fechaIngresoStr: string
): { edad: number; antiguedadAnios: number; categoria: SocioCategoria } | null => {
  const nac = new Date(fechaNacimientoStr);
  const ing = new Date(fechaIngresoStr);
  if (isNaN(nac.getTime()) || isNaN(ing.getTime())) return null;

  const hoy = new Date();

  let edad = hoy.getFullYear() - nac.getFullYear();
  const mesDifEdad = hoy.getMonth() - nac.getMonth();
  if (mesDifEdad < 0 || (mesDifEdad === 0 && hoy.getDate() < nac.getDate())) {
    edad--;
  }

  let antiguedadAnios = hoy.getFullYear() - ing.getFullYear();
  const mesDifAnt = hoy.getMonth() - ing.getMonth();
  if (mesDifAnt < 0 || (mesDifAnt === 0 && hoy.getDate() < ing.getDate())) {
    antiguedadAnios--;
  }

  const edadSegura = Math.max(0, edad);
  const antiguedadSegura = Math.max(0, antiguedadAnios);

  let categoria: SocioCategoria = 'ACTIVO';
  if (edadSegura < 18) {
    categoria = 'CADETE';
  } else if (antiguedadSegura >= 30) {
    categoria = 'VITALICIO';
  }

  return {
    edad: edadSegura,
    antiguedadAnios: antiguedadSegura,
    categoria,
  };
};

export const SocioFormModal: React.FC<SocioFormModalProps> = ({
  socioToEdit,
  isOpen,
  onClose,
}) => {
  // ✅ Nombres reales de los métodos expuestos por AppProvider
  const { agregarSocio, actualizarSocio, cobradores, showToast } = useClub();

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [zonaCobro, setZonaCobro] = useState<number>(1);
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (socioToEdit) {
      const nombreNorm =
        socioToEdit.nombreCompleto ||
        `${socioToEdit.nombre || ''} ${socioToEdit.apellido || ''}`.trim();
      setNombreCompleto(nombreNorm);
      setDni(socioToEdit.dni || '');
      setEmail(socioToEdit.email || '');
      setTelefono(socioToEdit.telefono || '');
      setDireccion(socioToEdit.direccion || '');
      setZonaCobro(Number(socioToEdit.zonaCobro ?? 0));
      setFechaNacimiento(
        socioToEdit.fechaNacimiento ? socioToEdit.fechaNacimiento.slice(0, 10) : ''
      );

      const fechaAltaNorm = socioToEdit.fechaIngreso || socioToEdit.fechaAlta;
      setFechaIngreso(fechaAltaNorm ? fechaAltaNorm.slice(0, 10) : '');
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

  // Cálculo visual dinámico de la categoría según estatuto
  const previewCalculation =
    fechaNacimiento && fechaIngreso
      ? calcularCategoriaEstatuto(fechaNacimiento, fechaIngreso)
      : null;

  // ✅ Generar opciones de zonas usando zonaAsignada (definido en AppContext)
  const zonasOpciones = [
    { id: 0, label: 'Zona 0 - Sede Central (Club)' },
    ...cobradores.map((c) => {
      const zNum = Number(c.zonaAsignada ?? (c as any).zona ?? 0);
      const nomCob = c.nombreCompleto || `${c.nombre || ''} ${c.apellido || ''}`.trim();
      return {
        id: zNum,
        label: `Zona ${zNum} - ${nomCob}`,
      };
    }),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombreCompleto.trim() || !dni.trim() || !fechaNacimiento || !fechaIngreso) {
      setErrorMsg('Por favor complete todos los campos obligatorios.');
      return;
    }

    // Separación para mantener compatibilidad con BD
    const partesNombre = nombreCompleto.trim().split(' ');
    const nombre = partesNombre[0];
    const apellido = partesNombre.slice(1).join(' ') || partesNombre[0];
    const categoriaCalculada: SocioCategoria = previewCalculation?.categoria || 'ACTIVO';

    setIsSubmitting(true);
    try {
      if (socioToEdit) {
        // ✅ actualizarSocio recibe el objeto completo del socio como único argumento
        await actualizarSocio({
          ...socioToEdit,
          nombre,
          apellido,
          nombreCompleto: nombreCompleto.trim(),
          dni: dni.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          direccion: direccion.trim(),
          zonaCobro,
          fechaNacimiento,
          fechaAlta: fechaIngreso,
          fechaIngreso,
          categoria: categoriaCalculada,
        });
        onClose();
      } else {
        await agregarSocio({
          nombre,
          apellido,
          nombreCompleto: nombreCompleto.trim(),
          dni: dni.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          direccion: direccion.trim(),
          zonaCobro,
          fechaNacimiento,
          fechaAlta: fechaIngreso,
          fechaIngreso,
          categoria: categoriaCalculada,
          estado: 'AL_DIA',
          esTitularFamilia: false,
          familiares: [],
          actividadesIds: [],
        } as any);
        onClose();
      }
    } catch (error) {
      setErrorMsg('Ocurrió un error al guardar los datos del socio en la base de datos.');
      showToast('error', 'Error de guardado', 'No se pudo persistir el socio en el servidor.');
    } finally {
      setIsSubmitting(false);
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
              {socioToEdit
                ? `EDITAR SOCIO N° ${socioToEdit.numeroSocio || socioToEdit.id}`
                : 'ALTA DE NUEVO SOCIO (BD)'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded cursor-pointer"
          >
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

          {/* Cálculo dinámico de categoría */}
          {previewCalculation && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Cálculo Automático de Categoría:
                </span>
                <span className="text-xs text-slate-700">
                  Edad calculada: <strong>{previewCalculation.edad} años</strong> • Antigüedad:{' '}
                  <strong>{previewCalculation.antiguedadAnios} años</strong>
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
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Nombre y Apellido Completo *
              </label>
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
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                DNI Único *
              </label>
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
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Zona de Cobro Asignada *
              </label>
              <select
                value={zonaCobro}
                onChange={(e) => setZonaCobro(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {zonasOpciones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Fecha de Nacimiento *
              </label>
              <input
                type="date"
                required
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Cadete: &lt; 18 años | Activo: &ge; 18 años
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Fecha de Ingreso / Alta al Club *
              </label>
              <input
                type="date"
                required
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Vitalicio: &ge; 30 años de antigüedad
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Teléfono Celular
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="011 15-xxxx-xxxx"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Dirección / Domicilio para Cobrador
              </label>
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
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#1A365D] hover:bg-[#2B6CB0] disabled:bg-slate-400 text-white rounded text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              {isSubmitting
                ? 'Guardando...'
                : socioToEdit
                ? 'Guardar Cambios en BD'
                : 'Registrar Socio en BD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};