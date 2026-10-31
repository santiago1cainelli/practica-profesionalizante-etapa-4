import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Socio,
  Locker,
  Actividad,
  AsistenciaRegistro,
  CuponRecibo,
  RendicionLiquidacion,
  AppUser,
  Familiar,
  UserRole,
  SocioCategoria,
  SocioEstado,
} from '../types';
import {
  INITIAL_SOCIOS,
  INITIAL_ACTIVIDADES,
  generateInitialLockers,
  INITIAL_CUPONES,
  INITIAL_RENDICIONES,
  MOCK_USERS,
  CUOTA_VALORES,
} from '../data/mockData';

export type ActiveTab =
  | 'inicio'
  | 'dashboard'
  | 'socios'
  | 'casilleros'
  | 'actividades'
  | 'asistencia'
  | 'cobranza'
  | 'rendicion'
  | 'morosidad'
  | 'portal_socio'
  | 'plan_doc';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

interface AppContextType {
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  toast: ToastMessage | null;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) => void;
  closeToast: () => void;
  
  // Socios
  socios: Socio[];
  addSocio: (data: Omit<Socio, 'id' | 'numeroSocio' | 'edad' | 'antiguedadAnios' | 'categoria' | 'estado' | 'cuotasAdeudadas'>) => boolean;
  updateSocio: (id: string, data: Partial<Socio>) => void;
  deleteSocio: (id: string) => void;
  addFamiliar: (socioId: string, familiar: Omit<Familiar, 'id' | 'edad'>) => void;
  removeFamiliar: (socioId: string, familiarId: string) => void;
  regularizarDeudaSocio: (socioId: string) => void;

  // Casilleros
  lockers: Locker[];
  assignLocker: (lockerNumber: number, socioId: string) => boolean;
  releaseLocker: (lockerNumber: number) => void;
  reserveLocker: (lockerNumber: number) => void;

  // Actividades
  actividades: Actividad[];
  enrollSocioInActividad: (socioId: string, actividadId: string) => boolean;
  unenrollSocioFromActividad: (socioId: string, actividadId: string) => void;

  // Asistencias
  asistencias: AsistenciaRegistro[];
  saveAsistencia: (registro: AsistenciaRegistro) => void;

  // Cupones y Cobranza
  cupones: CuponRecibo[];
  generarCuponMesActual: (socioId: string) => void;
  marcarCuponPagado: (cuponId: string, metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'SEDE_CENTRAL', cobradorId?: string) => void;
  reemitirCuponConMora: (cuponId: string) => void;

  // Rendiciones
  rendiciones: RendicionLiquidacion[];
  crearRendicionSemanal: (zonaCobro: number, cobradorId: string, cobradorNombre: string, cuponesIds: string[]) => void;
  aprobarRendicion: (rendicionId: string) => void;

  // Helpers
  calcularCategoria: (fechaNacimiento: string, fechaIngreso: string) => { categoria: SocioCategoria; edad: number; antiguedadAnios: number };
  quickSwitchUser: (userId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current User
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem('el_globo_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return MOCK_USERS[0]; // Admin por defecto
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) => {
    const id = Date.now().toString();
    setToast({ id, type, title, description });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4500);
  };

  const closeToast = () => setToast(null);

  // Helper de cálculo automático de categoría según fecha de nacimiento y fecha de ingreso
  const calcularCategoria = (fechaNacimiento: string, fechaIngreso: string) => {
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    const ing = new Date(fechaIngreso);

    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
      edad--;
    }
    if (isNaN(edad) || edad < 0) edad = 0;

    let antiguedadAnios = hoy.getFullYear() - ing.getFullYear();
    const mIng = hoy.getMonth() - ing.getMonth();
    if (mIng < 0 || (mIng === 0 && hoy.getDate() < ing.getDate())) {
      antiguedadAnios--;
    }
    if (isNaN(antiguedadAnios) || antiguedadAnios < 0) antiguedadAnios = 0;

    // Reglas estatutarias del Club:
    // 1. Vitalicio: > 30 años ininterrumpidos
    // 2. Cadete: < 18 años
    // 3. Activo: >= 18 años
    let categoria: SocioCategoria = 'ACTIVO';
    if (antiguedadAnios > 30) {
      categoria = 'VITALICIO';
    } else if (edad < 18) {
      categoria = 'CADETE';
    } else {
      categoria = 'ACTIVO';
    }

    return { categoria, edad, antiguedadAnios };
  };

  // State Socios
  const [socios, setSocios] = useState<Socio[]>(() => {
    const saved = localStorage.getItem('el_globo_socios');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_SOCIOS;
  });

  // State Lockers
  const [lockers, setLockers] = useState<Locker[]>(() => {
    const saved = localStorage.getItem('el_globo_lockers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return generateInitialLockers(INITIAL_SOCIOS);
  });

  // State Actividades
  const [actividades, setActividades] = useState<Actividad[]>(() => {
    const saved = localStorage.getItem('el_globo_actividades');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_ACTIVIDADES;
  });

  // State Cupones
  const [cupones, setCupones] = useState<CuponRecibo[]>(() => {
    const saved = localStorage.getItem('el_globo_cupones');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_CUPONES;
  });

  // State Rendiciones
  const [rendiciones, setRendiciones] = useState<RendicionLiquidacion[]>(() => {
    const saved = localStorage.getItem('el_globo_rendiciones');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_RENDICIONES;
  });

  // State Asistencia
  const [asistencias, setAsistencias] = useState<AsistenciaRegistro[]>(() => {
    const saved = localStorage.getItem('el_globo_asistencias');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'asis-1',
        actividadId: 'act-1',
        fecha: '2026-09-15',
        instructorId: 'user-instructor',
        asistencias: [
          { socioId: 'soc-1', socioNombre: 'Martín Rossi', presente: true },
          { socioId: 'soc-4', socioNombre: 'Lucía Lapenta Olmos', presente: true },
          { socioId: 'soc-6', socioNombre: 'Claudio Domínguez', presente: false },
        ],
      },
    ];
  });

  // Persistencias
  useEffect(() => {
    localStorage.setItem('el_globo_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('el_globo_socios', JSON.stringify(socios));
  }, [socios]);

  useEffect(() => {
    localStorage.setItem('el_globo_lockers', JSON.stringify(lockers));
  }, [lockers]);

  useEffect(() => {
    localStorage.setItem('el_globo_actividades', JSON.stringify(actividades));
  }, [actividades]);

  useEffect(() => {
    localStorage.setItem('el_globo_cupones', JSON.stringify(cupones));
  }, [cupones]);

  useEffect(() => {
    localStorage.setItem('el_globo_rendiciones', JSON.stringify(rendiciones));
  }, [rendiciones]);

  useEffect(() => {
    localStorage.setItem('el_globo_asistencias', JSON.stringify(asistencias));
  }, [asistencias]);

  // Recalcular estado de morosidad
  // Si tiene 2 o más cuotas adeudadas -> SUSPENDIDO_MOROSIDAD
  const refreshMorosidadStatus = (currentSocios: Socio[], currentCupones: CuponRecibo[]) => {
    return currentSocios.map((socio) => {
      const impagos = currentCupones.filter(
        (c) => c.socioId === socio.id && (c.estadoPago === 'PENDIENTE' || c.estadoPago === 'VENCIDO')
      );
      const cantImpagos = impagos.length;
      let nuevoEstado: SocioEstado = 'AL_DIA';

      if (cantImpagos >= 2) {
        nuevoEstado = 'SUSPENDIDO_MOROSIDAD';
      } else if (cantImpagos === 1) {
        nuevoEstado = 'DEUDOR_1_MES';
      }

      return {
        ...socio,
        cuotasAdeudadas: cantImpagos,
        estado: nuevoEstado,
      };
    });
  };

  // SOCIOS CRUD
  const addSocio = (data: Omit<Socio, 'id' | 'numeroSocio' | 'edad' | 'antiguedadAnios' | 'categoria' | 'estado' | 'cuotasAdeudadas'>): boolean => {
    // Validar DNI único
    const existeDni = socios.some((s) => s.dni.trim() === data.dni.trim());
    if (existeDni) {
      showToast('error', 'Error al registrar', `Ya existe un socio registrado con el DNI ${data.dni}.`);
      return false;
    }

    const { categoria, edad, antiguedadAnios } = calcularCategoria(data.fechaNacimiento, data.fechaIngreso);
    const maxNum = socios.reduce((max, s) => Math.max(max, s.numeroSocio), 1000);
    const nuevoNumero = maxNum + 1;

    const newSocio: Socio = {
      ...data,
      id: `soc-${Date.now()}`,
      numeroSocio: nuevoNumero,
      edad,
      antiguedadAnios,
      categoria,
      estado: 'AL_DIA',
      cuotasAdeudadas: 0,
      familiares: data.familiares || [],
      actividadesIds: data.actividadesIds || [],
    };

    setSocios((prev) => [newSocio, ...prev]);
    showToast('success', 'Socio registrado', `N° ${nuevoNumero} - ${newSocio.nombreCompleto} (${categoria}) registrado con éxito.`);
    return true;
  };

  const updateSocio = (id: string, data: Partial<Socio>) => {
    setSocios((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...data };
        const { categoria, edad, antiguedadAnios } = calcularCategoria(updated.fechaNacimiento, updated.fechaIngreso);
        return {
          ...updated,
          categoria,
          edad,
          antiguedadAnios,
        };
      })
    );
    showToast('success', 'Padrón actualizado', 'Los datos del socio fueron actualizados correctamente.');
  };

  const deleteSocio = (id: string) => {
    const socio = socios.find((s) => s.id === id);
    if (!socio) return;

    // Liberar casillero si tenía
    if (socio.casilleroAsignadoId) {
      releaseLocker(socio.casilleroAsignadoId);
    }

    setSocios((prev) => prev.filter((s) => s.id !== id));
    showToast('info', 'Socio dado de baja', `El socio ${socio.nombreCompleto} ha sido removido del padrón.`);
  };

  const addFamiliar = (socioId: string, familiarData: Omit<Familiar, 'id' | 'edad'>) => {
    const hoy = new Date();
    const nac = new Date(familiarData.fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    if (isNaN(edad) || edad < 0) edad = 0;

    // Si es hijo, validar regla de negocio: menor de 18 años
    if ((familiarData.parentesco === 'HIJO' || familiarData.parentesco === 'HIJA') && edad >= 18) {
      showToast('warning', 'Validación Plan Familiar', 'Los hijos mayores de 18 años deben asociarse individualmente como categoría Activo.');
      return;
    }

    const newFam: Familiar = {
      ...familiarData,
      id: `fam-${Date.now()}`,
      edad,
    };

    setSocios((prev) =>
      prev.map((s) => {
        if (s.id !== socioId) return s;
        return {
          ...s,
          esTitularFamilia: true,
          familiares: [...s.familiares, newFam],
        };
      })
    );

    showToast('success', 'Familiar vinculado', `${familiarData.nombreCompleto} vinculado al grupo familiar del socio.`);
  };

  const removeFamiliar = (socioId: string, familiarId: string) => {
    setSocios((prev) =>
      prev.map((s) => {
        if (s.id !== socioId) return s;
        const newFamList = s.familiares.filter((f) => f.id !== familiarId);
        return {
          ...s,
          familiares: newFamList,
          esTitularFamilia: newFamList.length > 0,
        };
      })
    );
    showToast('info', 'Familiar desvinculado', 'El miembro fue quitado del grupo familiar.');
  };

  // CASILLEROS (1 a 100)
  const assignLocker = (lockerNumber: number, socioId: string): boolean => {
    const socio = socios.find((s) => s.id === socioId);
    if (!socio) {
      showToast('error', 'Error', 'Socio no encontrado.');
      return false;
    }

    if (socio.estado === 'SUSPENDIDO_MOROSIDAD') {
      showToast('error', 'Acción denegada por Morosidad', `El socio ${socio.nombreCompleto} está suspendido por adeudar 2 o más cuotas. Debe regularizar su deuda en secretaría.`);
      return false;
    }

    // Regla: Asignación ÚNICA de casillero por socio
    if (socio.casilleroAsignadoId && socio.casilleroAsignadoId !== lockerNumber) {
      showToast('error', 'Límite de casillero alcanzado', `El socio ya cuenta con el casillero N° ${socio.casilleroAsignadoId} asignado. Máximo 1 casillero por socio.`);
      return false;
    }

    // Actualizar locker
    setLockers((prev) =>
      prev.map((l) => {
        if (l.numero === lockerNumber) {
          return {
            ...l,
            estado: 'OCUPADO',
            socioId: socio.id,
            socioNombre: socio.nombreCompleto,
            socioDni: socio.dni,
            fechaAsignacion: new Date().toISOString().split('T')[0],
          };
        }
        return l;
      })
    );

    // Actualizar socio
    setSocios((prev) =>
      prev.map((s) => (s.id === socioId ? { ...s, casilleroAsignadoId: lockerNumber } : s))
    );

    showToast('success', 'Casillero asignado', `Casillero N° ${lockerNumber} asignado exitosamente a ${socio.nombreCompleto}.`);
    return true;
  };

  const releaseLocker = (lockerNumber: number) => {
    const locker = lockers.find((l) => l.numero === lockerNumber);
    if (!locker) return;

    if (locker.socioId) {
      setSocios((prev) =>
        prev.map((s) => (s.id === locker.socioId ? { ...s, casilleroAsignadoId: undefined } : s))
      );
    }

    setLockers((prev) =>
      prev.map((l) =>
        l.numero === lockerNumber
          ? {
              ...l,
              estado: 'DISPONIBLE',
              socioId: undefined,
              socioNombre: undefined,
              socioDni: undefined,
              fechaAsignacion: undefined,
            }
          : l
      )
    );

    showToast('info', 'Casillero liberado', `El casillero N° ${lockerNumber} quedó disponible.`);
  };

  const reserveLocker = (lockerNumber: number) => {
    setLockers((prev) =>
      prev.map((l) => {
        if (l.numero !== lockerNumber) return l;
        const nuevoEstado = l.estado === 'RESERVADO' ? 'DISPONIBLE' : 'RESERVADO';
        return {
          ...l,
          estado: nuevoEstado,
        };
      })
    );
  };

  // ACTIVIDADES
  const enrollSocioInActividad = (socioId: string, actividadId: string): boolean => {
    // Regla de Permisos RBAC:
    // 1. El invitado NO tiene que poder inscribir socios a actividades
    if (currentUser.role === 'PUBLICO') {
      showToast('error', 'Acceso denegado', 'Los invitados no tienen permitido inscribir socios a las actividades.');
      return false;
    }

    // 2. El socio SOLO debe de poder inscribirse a sí mismo en las actividades
    if (currentUser.role === 'SOCIO') {
      if (currentUser.socioId && socioId !== currentUser.socioId) {
        showToast('error', 'Permiso denegado', 'Como socio, únicamente tienes permitido inscribirte a ti mismo en las actividades.');
        return false;
      }
    }

    const socio = socios.find((s) => s.id === socioId);
    const actividad = actividades.find((a) => a.id === actividadId);

    if (!socio || !actividad) return false;

    // Regla: Control de morosidad bloquea actividades
    if (socio.estado === 'SUSPENDIDO_MOROSIDAD') {
      showToast('error', 'Bloqueo por Morosidad', `El socio ${socio.nombreCompleto} se encuentra suspendido. Regularice su estado contable para inscribirse a deportes.`);
      return false;
    }

    if (socio.actividadesIds.includes(actividadId)) {
      showToast('info', 'Ya inscripto', `El socio ya está inscripto en ${actividad.nombre}.`);
      return false;
    }

    if (actividad.cupoOcupado >= actividad.cupoMaximo) {
      showToast('warning', 'Cupo agotado', `La actividad ${actividad.nombre} no posee cupos disponibles.`);
      return false;
    }

    // Actualizar socio
    setSocios((prev) =>
      prev.map((s) => (s.id === socioId ? { ...s, actividadesIds: [...s.actividadesIds, actividadId] } : s))
    );

    // Actualizar actividad cupo
    setActividades((prev) =>
      prev.map((a) => (a.id === actividadId ? { ...a, cupoOcupado: a.cupoOcupado + 1 } : a))
    );

    showToast('success', 'Inscripción confirmada', `Inscripto a ${actividad.nombre} exitosamente.`);
    return true;
  };

  const unenrollSocioFromActividad = (socioId: string, actividadId: string) => {
    // Regla de Permisos RBAC:
    // 1. El invitado no puede gestionar inscripciones
    if (currentUser.role === 'PUBLICO') {
      showToast('error', 'Acceso denegado', 'Los invitados no pueden gestionar actividades.');
      return;
    }

    // 2. El socio solo puede gestionar sus propias actividades
    if (currentUser.role === 'SOCIO') {
      if (currentUser.socioId && socioId !== currentUser.socioId) {
        showToast('error', 'Permiso denegado', 'Como socio, únicamente puedes desinscribirte de tus propias actividades.');
        return;
      }
    }

    const actividad = actividades.find((a) => a.id === actividadId);
    setSocios((prev) =>
      prev.map((s) =>
        s.id === socioId ? { ...s, actividadesIds: s.actividadesIds.filter((id) => id !== actividadId) } : s
      )
    );

    setActividades((prev) =>
      prev.map((a) => (a.id === actividadId ? { ...a, cupoOcupado: Math.max(0, a.cupoOcupado - 1) } : a))
    );

    showToast('info', 'Baja de actividad', `Se dio de baja la inscripción a ${actividad?.nombre || 'la actividad'}.`);
  };

  // ASISTENCIAS
  const saveAsistencia = (registro: AsistenciaRegistro) => {
    setAsistencias((prev) => {
      const idx = prev.findIndex((r) => r.actividadId === registro.actividadId && r.fecha === registro.fecha);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = registro;
        return copy;
      }
      return [registro, ...prev];
    });
    showToast('success', 'Asistencia registrada', `Planilla de asistencia del ${registro.fecha} guardada correctamente.`);
  };

  // CUPONES & RECIBOS
  const generarCuponMesActual = (socioId: string) => {
    const socio = socios.find((s) => s.id === socioId);
    if (!socio) return;

    // Calcular cuota social según categoría
    let cuotaSocialBase = CUOTA_VALORES.ACTIVO;
    if (socio.categoria === 'CADETE') cuotaSocialBase = CUOTA_VALORES.CADETE;
    if (socio.categoria === 'VITALICIO') cuotaSocialBase = CUOTA_VALORES.VITALICIO;

    // Actividades del socio
    const detalleActividades = socio.actividadesIds
      .map((actId) => {
        const act = actividades.find((a) => a.id === actId);
        return act ? { nombre: act.nombre, monto: act.costoMensual } : null;
      })
      .filter(Boolean) as { nombre: string; monto: number }[];

    const costoActividades = detalleActividades.reduce((sum, a) => sum + a.monto, 0);
    const costoCasillero = socio.casilleroAsignadoId ? CUOTA_VALORES.CASILLERO_MENSUAL : 0;

    // Descuento grupo familiar: si tiene hijos vinculados
    const hijosCount = socio.familiares.filter((f) => f.parentesco === 'HIJO' || f.parentesco === 'HIJA').length;
    const descuentoFamiliar = hijosCount * CUOTA_VALORES.DESCUENTO_FAMILIAR_POR_HIJO;

    const subtotal = Math.max(0, cuotaSocialBase + costoActividades + costoCasillero - descuentoFamiliar);

    // Regla estatutaria: 5% recargo por mora si ya tiene cuotas impagas
    const tieneMora = socio.cuotasAdeudadas > 0;
    const recargoMoraPorcentaje = tieneMora ? CUOTA_VALORES.RECARGO_MORA_PORCENTAJE : 0;
    const montoRecargoMora = tieneMora ? Math.round(subtotal * CUOTA_VALORES.RECARGO_MORA_PORCENTAJE) : 0;
    const totalPagar = subtotal + montoRecargoMora;

    const hoy = new Date();
    const periodoMes = hoy.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const fechaEmision = hoy.toISOString().split('T')[0];
    const vencimiento = new Date(hoy.getFullYear(), hoy.getMonth(), 15).toISOString().split('T')[0];

    const nuevoCupon: CuponRecibo = {
      id: `cup-${Date.now()}`,
      numeroComprobante: `REC-${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      socioId: socio.id,
      socioNombre: socio.nombreCompleto,
      socioDni: socio.dni,
      zonaCobro: socio.zonaCobro,
      periodoMes: periodoMes.charAt(0).toUpperCase() + periodoMes.slice(1),
      fechaEmision,
      fechaVencimiento: vencimiento,
      cuotaSocialBase,
      detalleActividades,
      costoCasillero,
      recargoMoraPorcentaje,
      montoRecargoMora,
      descuentoFamiliar,
      subtotal,
      totalPagar,
      estadoPago: 'PENDIENTE',
    };

    setCupones((prev) => [nuevoCupon, ...prev]);

    // Actualizar socios con refresco de morosidad
    setSocios((prev) => refreshMorosidadStatus(prev, [nuevoCupon, ...cupones]));

    showToast('success', 'Recibo emitido', `Cupón ${nuevoCupon.numeroComprobante} generado para ${socio.nombreCompleto}. Total: $${totalPagar.toLocaleString('es-AR')}`);
  };

  const marcarCuponPagado = (cuponId: string, metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'SEDE_CENTRAL', cobradorId?: string) => {
    const fechaPago = new Date().toISOString().split('T')[0];
    let updatedCupones: CuponRecibo[] = [];

    setCupones((prev) => {
      updatedCupones = prev.map((c) =>
        c.id === cuponId
          ? {
              ...c,
              estadoPago: 'PAGADO',
              fechaPago,
              metodoPago,
              cobradorId: cobradorId || (currentUser.role === 'COBRADOR' ? currentUser.id : 'sede-central'),
            }
          : c
      );
      return updatedCupones;
    });

    // Actualizar morosidad de socios
    setTimeout(() => {
      setSocios((prev) => refreshMorosidadStatus(prev, updatedCupones));
    }, 50);

    showToast('success', 'Pago Registrado', `El recibo ha sido cancelado exitosamente mediante ${metodoPago.replace('_', ' ')}.`);
  };

  // Reemisión de cupones con 5% de recargo
  const reemitirCuponConMora = (cuponId: string) => {
    let targetCupon: CuponRecibo | undefined;
    setCupones((prev) =>
      prev.map((c) => {
        if (c.id !== cuponId) return c;
        targetCupon = c;
        const subtotal = c.subtotal;
        const montoRecargoMora = Math.round(subtotal * CUOTA_VALORES.RECARGO_MORA_PORCENTAJE); // 5%
        const totalPagar = subtotal + montoRecargoMora;

        return {
          ...c,
          recargoMoraPorcentaje: 0.05,
          montoRecargoMora,
          totalPagar,
          estadoPago: 'VENCIDO',
        };
      })
    );

    showToast('warning', 'Cupón Reemitido con 5% Mora', `Se aplicó el recargo estatutario del 5% al recibo de ${targetCupon?.socioNombre || 'socio'}.`);
  };

  // Regularizar deuda total de un socio en secretaría
  const regularizarDeudaSocio = (socioId: string) => {
    const fechaPago = new Date().toISOString().split('T')[0];
    let updatedCupones: CuponRecibo[] = [];

    setCupones((prev) => {
      updatedCupones = prev.map((c) =>
        c.socioId === socioId && c.estadoPago !== 'PAGADO'
          ? {
              ...c,
              estadoPago: 'PAGADO',
              fechaPago,
              metodoPago: 'SEDE_CENTRAL',
              cobradorId: 'sede-central',
            }
          : c
      );
      return updatedCupones;
    });

    setSocios((prev) =>
      prev.map((s) =>
        s.id === socioId
          ? {
              ...s,
              estado: 'AL_DIA',
              cuotasAdeudadas: 0,
            }
          : s
      )
    );

    showToast('success', 'Deuda Regularizada', 'El socio ha regularizado todas sus obligaciones. Se rehabilitan los accesos a actividades y casilleros.');
  };

  // RENDICIONES SEMANALES DE COBRADORES (10% de comisión)
  const crearRendicionSemanal = (zonaCobro: number, cobradorId: string, cobradorNombre: string, cuponesIds: string[]) => {
    const cuponesRendidos = cupones.filter((c) => cuponesIds.includes(c.id));
    const totalCobrado = cuponesRendidos.reduce((acc, c) => acc + c.totalPagar, 0);
    const montoComisionCobrador = Math.round(totalCobrado * CUOTA_VALORES.COMISION_COBRADOR_PORCENTAJE); // 10%
    const netoRendidoClub = totalCobrado - montoComisionCobrador;

    const hoy = new Date();
    const nuevaRendicion: RendicionLiquidacion = {
      id: `rend-${Date.now()}`,
      cobradorId,
      cobradorNombre,
      zonaCobro,
      semanaNumero: 38,
      periodoFecha: `Semana en curso (${hoy.toLocaleDateString('es-AR')})`,
      recibosCobradosIds: cuponesIds,
      totalCobrado,
      porcentajeComision: 0.10,
      montoComisionCobrador,
      netoRendidoClub,
      estado: 'PENDIENTE_SECRETARIA',
      fechaRendicion: hoy.toISOString().split('T')[0],
    };

    setRendiciones((prev) => [nuevaRendicion, ...prev]);
    showToast('success', 'Rendición Semanal Enviada', `Liquidación generada con 10% comisión ($${montoComisionCobrador.toLocaleString('es-AR')}). Pendiente de aprobación por Secretaría.`);
  };

  const aprobarRendicion = (rendicionId: string) => {
    setRendiciones((prev) =>
      prev.map((r) => (r.id === rendicionId ? { ...r, estado: 'APROBADA' } : r))
    );
    showToast('success', 'Rendición Aprobada', 'La liquidación fue validada contablemente por Tesorería del Club.');
  };

  const quickSwitchUser = (userId: string) => {
    const found = MOCK_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      // Auto switch tabs to a meaningful view for that role
      if (found.role === 'ADMIN') setActiveTab('dashboard');
      else if (found.role === 'COBRADOR') setActiveTab('cobranza');
      else if (found.role === 'INSTRUCTOR') setActiveTab('asistencia');
      else if (found.role === 'SOCIO') setActiveTab('portal_socio');
      else if (found.role === 'PUBLICO') setActiveTab('inicio');
      else setActiveTab('inicio');

      showToast('info', 'Sesión cambiada', `Conectado como ${found.nombreCompleto} [${found.role}]`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeTab,
        setActiveTab,
        toast,
        showToast,
        closeToast,
        socios,
        addSocio,
        updateSocio,
        deleteSocio,
        addFamiliar,
        removeFamiliar,
        regularizarDeudaSocio,
        lockers,
        assignLocker,
        releaseLocker,
        reserveLocker,
        actividades,
        enrollSocioInActividad,
        unenrollSocioFromActividad,
        asistencias,
        saveAsistencia,
        cupones,
        generarCuponMesActual,
        marcarCuponPagado,
        reemitirCuponConMora,
        rendiciones,
        crearRendicionSemanal,
        aprobarRendicion,
        calcularCategoria,
        quickSwitchUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
