import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Socio,
  Locker,
  Actividad,
  AsistenciaRegistro,
  CuponRecibo,
  RendicionLiquidacion,
  AppUser,
  Familiar,
  Cobrador,
  Instructor,
  SocioCategoria,
  SocioEstado,
} from '../types';
import {
  INITIAL_SOCIOS,
  INITIAL_ACTIVIDADES,
  generateInitialLockers,
  INITIAL_CUPONES,
  INITIAL_RENDICIONES,
  INITIAL_COBRADORES,
  INITIAL_INSTRUCTORES,
  MOCK_USERS,
  CUOTA_VALORES,
} from '../data/mockData';
import { api } from '../services/api';

export type ActiveTab =
  | 'inicio'
  | 'dashboard'
  | 'socios'
  | 'cobradores'
  | 'instructores'
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

  // API & Database status
  isApiConnected: boolean;
  isSyncing: boolean;
  syncWithDatabase: () => Promise<void>;
  resetDatabaseToDefaults: () => Promise<void>;
  
  // Socios
  socios: Socio[];
  addSocio: (data: Omit<Socio, 'id' | 'numeroSocio' | 'edad' | 'antiguedadAnios' | 'categoria' | 'estado' | 'cuotasAdeudadas'>) => boolean;
  updateSocio: (id: string, data: Partial<Socio>) => void;
  deleteSocio: (id: string) => void;
  addFamiliar: (socioId: string, familiar: Omit<Familiar, 'id' | 'edad'>) => void;
  removeFamiliar: (socioId: string, familiarId: string) => void;
  regularizarDeudaSocio: (socioId: string) => void;

  // Cobradores CRUD (Solo Admin)
  cobradores: Cobrador[];
  addCobrador: (data: Omit<Cobrador, 'id' | 'fechaAlta'>) => boolean;
  updateCobrador: (id: string, data: Partial<Cobrador>) => void;
  deleteCobrador: (id: string) => void;
  toggleCobradorEstado: (id: string) => void;

  // Instructores CRUD (Solo Admin)
  instructores: Instructor[];
  addInstructor: (data: Omit<Instructor, 'id' | 'fechaAlta'>) => boolean;
  updateInstructor: (id: string, data: Partial<Instructor>) => void;
  deleteInstructor: (id: string) => void;
  toggleInstructorEstado: (id: string) => void;

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
  // Current user
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem('el_globo_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return MOCK_USERS[0]; // Admin por defecto
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // API State
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Entities state
  const [socios, setSocios] = useState<Socio[]>(INITIAL_SOCIOS);
  const [cobradores, setCobradores] = useState<Cobrador[]>(INITIAL_COBRADORES);
  const [instructores, setInstructores] = useState<Instructor[]>(INITIAL_INSTRUCTORES);
  const [lockers, setLockers] = useState<Locker[]>(() => generateInitialLockers(INITIAL_SOCIOS));
  const [actividades, setActividades] = useState<Actividad[]>(INITIAL_ACTIVIDADES);
  const [cupones, setCupones] = useState<CuponRecibo[]>(INITIAL_CUPONES);
  const [rendiciones, setRendiciones] = useState<RendicionLiquidacion[]>(INITIAL_RENDICIONES);
  const [asistencias, setAsistencias] = useState<AsistenciaRegistro[]>([
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
  ]);

  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) => {
    setToast({
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title,
      description,
    });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  // Sincronizar datos con la base de datos y API
  const syncWithDatabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      const fullDb = await api.getFullDatabase();
      if (fullDb) {
        if (Array.isArray(fullDb.socios)) setSocios(fullDb.socios);
        if (Array.isArray(fullDb.cobradores)) setCobradores(fullDb.cobradores);
        if (Array.isArray(fullDb.instructores)) setInstructores(fullDb.instructores);
        if (Array.isArray(fullDb.lockers)) setLockers(fullDb.lockers);
        if (Array.isArray(fullDb.actividades)) setActividades(fullDb.actividades);
        if (Array.isArray(fullDb.cupones)) setCupones(fullDb.cupones);
        if (Array.isArray(fullDb.rendiciones)) setRendiciones(fullDb.rendiciones);
        if (Array.isArray(fullDb.asistencias)) setAsistencias(fullDb.asistencias);
        setIsApiConnected(true);
      }
    } catch (err: any) {
      console.warn('[AppContext] No se pudo sincronizar con la API backend:', err.message);
      setIsApiConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Cargar datos reales de la base de datos al iniciar la aplicación
  useEffect(() => {
    syncWithDatabase();
  }, [syncWithDatabase]);

  // Persistir usuario logueado en sesión
  useEffect(() => {
    localStorage.setItem('el_globo_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const resetDatabaseToDefaults = async () => {
    try {
      setIsSyncing(true);
      await api.resetDatabase();
      await syncWithDatabase();
      showToast('info', 'Base de datos restaurada', 'Se restablecieron todos los datos originales del sistema.');
    } catch (err: any) {
      showToast('error', 'Error al reiniciar', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Cálculo de Categoría según Estatuto del Club El Globo
  const calcularCategoria = (fechaNacimiento: string, fechaIngreso: string) => {
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    if (isNaN(edad) || edad < 0) edad = 0;

    const ing = new Date(fechaIngreso);
    let antiguedad = hoy.getFullYear() - ing.getFullYear();
    const mIng = hoy.getMonth() - ing.getMonth();
    if (mIng < 0 || (mIng === 0 && hoy.getDate() < ing.getDate())) antiguedad--;
    if (isNaN(antiguedad) || antiguedad < 0) antiguedad = 0;

    let categoria: SocioCategoria = 'ACTIVO';
    if (edad < 18) {
      categoria = 'CADETE';
    } else if (antiguedad >= 30) {
      categoria = 'VITALICIO';
    }

    return { categoria, edad, antiguedadAnios: antiguedad };
  };

  // SOCIOS CRUD
  const addSocio = (data: Omit<Socio, 'id' | 'numeroSocio' | 'edad' | 'antiguedadAnios' | 'categoria' | 'estado' | 'cuotasAdeudadas'>): boolean => {
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

    // Optimistic update
    setSocios((prev) => [newSocio, ...prev]);

    // Async API call to persist in database
    api.addSocio(data)
      .then((savedSocio) => {
        setSocios((prev) => prev.map((s) => (s.id === newSocio.id ? savedSocio : s)));
        showToast('success', 'Socio registrado en Base de Datos', `N° ${savedSocio.numeroSocio} - ${savedSocio.nombreCompleto} (${savedSocio.categoria}) guardado.`);
      })
      .catch((err) => {
        console.error('Error al guardar socio en API:', err);
        showToast('warning', 'Guardado local', `Guardado en memoria. Error en persistencia: ${err.message}`);
      });

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

    api.updateSocio(id, data)
      .then((updated) => {
        setSocios((prev) => prev.map((s) => (s.id === id ? updated : s)));
        showToast('success', 'Padrón actualizado', 'Los datos del socio fueron persistidos en la base de datos.');
      })
      .catch((err) => {
        showToast('error', 'Error al actualizar socio', err.message);
      });
  };

  const deleteSocio = (id: string) => {
    const socio = socios.find((s) => s.id === id);
    if (!socio) return;

    if (socio.casilleroAsignadoId) {
      releaseLocker(socio.casilleroAsignadoId);
    }

    setSocios((prev) => prev.filter((s) => s.id !== id));

    api.deleteSocio(id)
      .then(() => {
        showToast('info', 'Socio dado de baja', `El socio ${socio.nombreCompleto} ha sido removido de la base de datos.`);
      })
      .catch((err) => {
        showToast('error', 'Error al eliminar socio', err.message);
      });
  };

  const addFamiliar = (socioId: string, familiarData: Omit<Familiar, 'id' | 'edad'>) => {
    const hoy = new Date();
    const nac = new Date(familiarData.fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    if (isNaN(edad) || edad < 0) edad = 0;

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

    api.addFamiliar(socioId, familiarData)
      .then(() => {
        showToast('success', 'Familiar vinculado', `${familiarData.nombreCompleto} registrado en la base de datos.`);
      })
      .catch((err) => {
        showToast('error', 'Error al registrar familiar', err.message);
      });
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

    api.removeFamiliar(socioId, familiarId)
      .then(() => {
        showToast('info', 'Familiar desvinculado', 'El miembro fue quitado de la base de datos.');
      })
      .catch((err) => {
        showToast('error', 'Error al desvincular familiar', err.message);
      });
  };

  const regularizarDeudaSocio = (socioId: string) => {
    setCupones((prev) =>
      prev.map((c) =>
        c.socioId === socioId && c.estadoPago !== 'PAGADO'
          ? {
              ...c,
              estadoPago: 'PAGADO',
              fechaPago: new Date().toISOString().split('T')[0],
              metodoPago: 'SEDE_CENTRAL',
              cobradorId: 'sede-central',
            }
          : c
      )
    );

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

    api.regularizarDeuda(socioId)
      .then(() => {
        showToast('success', 'Deuda Regularizada', 'Socio al día en la base de datos. Se rehabilitan los accesos.');
      })
      .catch((err) => {
        showToast('error', 'Error en regularización', err.message);
      });
  };

  // COBRADORES CRUD (Solo Admin)
  const addCobrador = (data: Omit<Cobrador, 'id' | 'fechaAlta'>): boolean => {
    const existeDni = cobradores.some((c) => c.dni.trim() === data.dni.trim());
    if (existeDni) {
      showToast('error', 'Error al registrar cobrador', `Ya existe un cobrador registrado con el DNI ${data.dni}.`);
      return false;
    }
    const newCobrador: Cobrador = {
      ...data,
      id: `cob-${Date.now()}`,
      fechaAlta: new Date().toISOString().split('T')[0],
    };
    setCobradores((prev) => [newCobrador, ...prev]);

    api.addCobrador(data)
      .then((saved) => {
        setCobradores((prev) => prev.map((c) => (c.id === newCobrador.id ? saved : c)));
        showToast('success', 'Cobrador registrado', `${saved.nombreCompleto} persistido en Base de Datos.`);
      })
      .catch((err) => {
        showToast('error', 'Error al registrar cobrador', err.message);
      });

    return true;
  };

  const updateCobrador = (id: string, data: Partial<Cobrador>) => {
    setCobradores((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );

    api.updateCobrador(id, data)
      .then((updated) => {
        setCobradores((prev) => prev.map((c) => (c.id === id ? updated : c)));
        showToast('success', 'Cobrador actualizado', 'Datos guardados en base de datos.');
      })
      .catch((err) => {
        showToast('error', 'Error al actualizar', err.message);
      });
  };

  const deleteCobrador = (id: string) => {
    const cob = cobradores.find((c) => c.id === id);
    setCobradores((prev) => prev.filter((c) => c.id !== id));

    api.deleteCobrador(id)
      .then(() => {
        showToast('info', 'Cobrador dado de baja', `El cobrador ${cob?.nombreCompleto || ''} ha sido removido de la base de datos.`);
      })
      .catch((err) => {
        showToast('error', 'Error al eliminar', err.message);
      });
  };

  const toggleCobradorEstado = (id: string) => {
    const target = cobradores.find((c) => c.id === id);
    if (!target) return;
    const nuevoEstado = !target.activo;

    setCobradores((prev) =>
      prev.map((c) => (c.id === id ? { ...c, activo: nuevoEstado } : c))
    );

    api.updateCobrador(id, { activo: nuevoEstado })
      .then(() => {
        showToast('info', 'Estado modificado', `${target.nombreCompleto} marcado como ${nuevoEstado ? 'Activo' : 'Inactivo'}.`);
      })
      .catch((err) => {
        showToast('error', 'Error al cambiar estado', err.message);
      });
  };

  // INSTRUCTORES CRUD (Solo Admin)
  const addInstructor = (data: Omit<Instructor, 'id' | 'fechaAlta'>): boolean => {
    const existeDni = instructores.some((i) => i.dni.trim() === data.dni.trim());
    if (existeDni) {
      showToast('error', 'Error al registrar instructor', `Ya existe un instructor registrado con el DNI ${data.dni}.`);
      return false;
    }
    const newInstructor: Instructor = {
      ...data,
      id: `inst-${Date.now()}`,
      fechaAlta: new Date().toISOString().split('T')[0],
    };
    setInstructores((prev) => [newInstructor, ...prev]);

    api.addInstructor(data)
      .then((saved) => {
        setInstructores((prev) => prev.map((i) => (i.id === newInstructor.id ? saved : i)));
        showToast('success', 'Instructor registrado', `${saved.nombreCompleto} guardado en Base de Datos.`);
      })
      .catch((err) => {
        showToast('error', 'Error al guardar instructor', err.message);
      });

    return true;
  };

  const updateInstructor = (id: string, data: Partial<Instructor>) => {
    setInstructores((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, ...data } : inst))
    );

    api.updateInstructor(id, data)
      .then((saved) => {
        setInstructores((prev) => prev.map((inst) => (inst.id === id ? saved : inst)));
        syncWithDatabase();
        showToast('success', 'Instructor actualizado', 'Cambios guardados en la base de datos.');
      })
      .catch((err) => {
        showToast('error', 'Error al actualizar instructor', err.message);
      });
  };

  const deleteInstructor = (id: string) => {
    const inst = instructores.find((i) => i.id === id);
    setInstructores((prev) => prev.filter((i) => i.id !== id));

    api.deleteInstructor(id)
      .then(() => {
        syncWithDatabase();
        showToast('info', 'Instructor dado de baja', `${inst?.nombreCompleto || 'El docente'} fue removido de la base de datos.`);
      })
      .catch((err) => {
        showToast('error', 'Error al eliminar instructor', err.message);
      });
  };

  const toggleInstructorEstado = (id: string) => {
    const target = instructores.find((i) => i.id === id);
    if (!target) return;
    const nuevoEstado = !target.activo;

    setInstructores((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, activo: nuevoEstado } : inst))
    );

    api.updateInstructor(id, { activo: nuevoEstado })
      .then(() => {
        showToast('info', 'Estado modificado', `${target.nombreCompleto} marcado como ${nuevoEstado ? 'Activo' : 'Inactivo'}.`);
      })
      .catch((err) => {
        showToast('error', 'Error al cambiar estado', err.message);
      });
  };

  // CASILLEROS (1 a 100)
  const assignLocker = (lockerNumber: number, socioId: string): boolean => {
    const socio = socios.find((s) => s.id === socioId);
    if (!socio) {
      showToast('error', 'Error', 'Socio no encontrado.');
      return false;
    }

    if (socio.estado === 'SUSPENDIDO_MOROSIDAD') {
      showToast('error', 'Acción denegada por Morosidad', `El socio ${socio.nombreCompleto} está suspendido por adeudar 2 o más cuotas.`);
      return false;
    }

    if (socio.casilleroAsignadoId && socio.casilleroAsignadoId !== lockerNumber) {
      showToast('error', 'Límite alcanzado', `El socio ya cuenta con el casillero N° ${socio.casilleroAsignadoId} asignado.`);
      return false;
    }

    // Optimistic update
    setLockers((prev) =>
      prev.map((l) =>
        l.numero === lockerNumber
          ? {
              ...l,
              estado: 'OCUPADO',
              socioId: socio.id,
              socioNombre: socio.nombreCompleto,
              socioDni: socio.dni,
              fechaAsignacion: new Date().toISOString().split('T')[0],
            }
          : l
      )
    );
    setSocios((prev) =>
      prev.map((s) => (s.id === socioId ? { ...s, casilleroAsignadoId: lockerNumber } : s))
    );

    api.assignLocker(lockerNumber, socioId)
      .then(() => {
        showToast('success', 'Casillero asignado', `Casillero N° ${lockerNumber} asignado a ${socio.nombreCompleto} en BD.`);
      })
      .catch((err) => {
        showToast('error', 'Error al asignar casillero', err.message);
      });

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

    api.releaseLocker(lockerNumber)
      .then(() => {
        showToast('info', 'Casillero liberado', `El casillero N° ${lockerNumber} quedó disponible en BD.`);
      })
      .catch((err) => {
        showToast('error', 'Error al liberar casillero', err.message);
      });
  };

  const reserveLocker = (lockerNumber: number) => {
    setLockers((prev) =>
      prev.map((l) =>
        l.numero === lockerNumber
          ? { ...l, estado: l.estado === 'RESERVADO' ? 'DISPONIBLE' : 'RESERVADO' }
          : l
      )
    );

    api.reserveLocker(lockerNumber)
      .then(() => {
        showToast('info', 'Estado de Casillero', `Casillero N° ${lockerNumber} actualizado en BD.`);
      })
      .catch((err) => {
        showToast('error', 'Error al reservar casillero', err.message);
      });
  };

  // ACTIVIDADES
  const enrollSocioInActividad = (socioId: string, actividadId: string): boolean => {
    if (currentUser.role === 'PUBLICO') {
      showToast('error', 'Acceso denegado', 'Los visitantes no tienen permitido inscribir socios.');
      return false;
    }
    if (currentUser.role === 'SOCIO' && currentUser.socioId && socioId !== currentUser.socioId) {
      showToast('error', 'Permiso denegado', 'Como socio únicamente puedes inscribirte a ti mismo.');
      return false;
    }

    const socio = socios.find((s) => s.id === socioId);
    const actividad = actividades.find((a) => a.id === actividadId);
    if (!socio || !actividad) return false;

    if (socio.estado === 'SUSPENDIDO_MOROSIDAD') {
      showToast('error', 'Bloqueo por Morosidad', `El socio se encuentra suspendido. Regularice su deuda.`);
      return false;
    }

    if (socio.actividadesIds.includes(actividadId)) {
      showToast('info', 'Ya inscripto', `El socio ya está inscripto en ${actividad.nombre}.`);
      return false;
    }

    if (actividad.cupoOcupado >= actividad.cupoMaximo) {
      showToast('warning', 'Cupo agotado', `La actividad no tiene cupos disponibles.`);
      return false;
    }

    setSocios((prev) =>
      prev.map((s) => (s.id === socioId ? { ...s, actividadesIds: [...s.actividadesIds, actividadId] } : s))
    );
    setActividades((prev) =>
      prev.map((a) => (a.id === actividadId ? { ...a, cupoOcupado: a.cupoOcupado + 1 } : a))
    );

    api.enrollActividad(socioId, actividadId)
      .then(() => {
        showToast('success', 'Inscripción confirmada', `Inscripto a ${actividad.nombre} en la base de datos.`);
      })
      .catch((err) => {
        showToast('error', 'Error en inscripción', err.message);
      });

    return true;
  };

  const unenrollSocioFromActividad = (socioId: string, actividadId: string) => {
    if (currentUser.role === 'PUBLICO') {
      showToast('error', 'Acceso denegado', 'Los visitantes no pueden desinscribir socios.');
      return;
    }
    if (currentUser.role === 'SOCIO' && currentUser.socioId && socioId !== currentUser.socioId) {
      showToast('error', 'Permiso denegado', 'Solo puedes desinscribirte de tus propias actividades.');
      return;
    }

    setSocios((prev) =>
      prev.map((s) =>
        s.id === socioId ? { ...s, actividadesIds: s.actividadesIds.filter((id) => id !== actividadId) } : s
      )
    );
    setActividades((prev) =>
      prev.map((a) => (a.id === actividadId ? { ...a, cupoOcupado: Math.max(0, a.cupoOcupado - 1) } : a))
    );

    api.unenrollActividad(socioId, actividadId)
      .then(() => {
        showToast('info', 'Baja de actividad', `Se dio de baja la inscripción en la base de datos.`);
      })
      .catch((err) => {
        showToast('error', 'Error al desinscribir', err.message);
      });
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

    api.saveAsistencia(registro)
      .then(() => {
        showToast('success', 'Asistencia registrada', `Planilla del ${registro.fecha} guardada en BD.`);
      })
      .catch((err) => {
        showToast('error', 'Error al guardar asistencia', err.message);
      });
  };

  // CUPONES & RECIBOS
  const generarCuponMesActual = (socioId: string) => {
    api.generarCupon(socioId)
      .then((nuevoCupon) => {
        setCupones((prev) => [nuevoCupon, ...prev]);
        syncWithDatabase();
        showToast('success', 'Recibo emitido', `Cupón ${nuevoCupon.numeroComprobante} guardado en BD. Total: $${nuevoCupon.totalPagar.toLocaleString('es-AR')}`);
      })
      .catch((err) => {
        showToast('error', 'Error al generar recibo', err.message);
      });
  };

  const marcarCuponPagado = (cuponId: string, metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'SEDE_CENTRAL', cobradorId?: string) => {
    api.pagarCupon(cuponId, metodoPago, cobradorId || (currentUser.role === 'COBRADOR' ? currentUser.id : 'sede-central'))
      .then((updated) => {
        setCupones((prev) => prev.map((c) => (c.id === cuponId ? updated : c)));
        syncWithDatabase();
        showToast('success', 'Pago Registrado', `Recibo pagado vía ${metodoPago.replace('_', ' ')} y asentado en Base de Datos.`);
      })
      .catch((err) => {
        showToast('error', 'Error al registrar pago', err.message);
      });
  };

  const reemitirCuponConMora = (cuponId: string) => {
    api.moraCupon(cuponId)
      .then((updated) => {
        setCupones((prev) => prev.map((c) => (c.id === cuponId ? updated : c)));
        showToast('warning', 'Cupón Reemitido con 5% Mora', `Recargo del 5% aplicado en Base de Datos.`);
      })
      .catch((err) => {
        showToast('error', 'Error al aplicar mora', err.message);
      });
  };

  // RENDICIONES
  const crearRendicionSemanal = (zonaCobro: number, cobradorId: string, cobradorNombre: string, cuponesIds: string[]) => {
    const cuponesRendidos = cupones.filter((c) => cuponesIds.includes(c.id));
    const totalCobrado = cuponesRendidos.reduce((acc, c) => acc + c.totalPagar, 0);
    const montoComisionCobrador = Math.round(totalCobrado * CUOTA_VALORES.COMISION_COBRADOR_PORCENTAJE);
    const netoRendidoClub = totalCobrado - montoComisionCobrador;
    const hoy = new Date();

    const payload = {
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
      estado: 'PENDIENTE_SECRETARIA' as const,
    };

    api.addRendicion(payload)
      .then((nuevaRendicion) => {
        setRendiciones((prev) => [nuevaRendicion, ...prev]);
        showToast('success', 'Rendición Semanal Enviada', `Liquidación generada con 10% comisión ($${montoComisionCobrador.toLocaleString('es-AR')}) en BD.`);
      })
      .catch((err) => {
        showToast('error', 'Error al crear rendición', err.message);
      });
  };

  const aprobarRendicion = (rendicionId: string) => {
    api.aprobarRendicion(rendicionId)
      .then((aprobada) => {
        setRendiciones((prev) => prev.map((r) => (r.id === rendicionId ? aprobada : r)));
        showToast('success', 'Rendición Aprobada', 'Liquidación validada contablemente en BD.');
      })
      .catch((err) => {
        showToast('error', 'Error al aprobar liquidación', err.message);
      });
  };

  const quickSwitchUser = (userId: string) => {
    const found = MOCK_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
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
        isApiConnected,
        isSyncing,
        syncWithDatabase,
        resetDatabaseToDefaults,
        socios,
        addSocio,
        updateSocio,
        deleteSocio,
        addFamiliar,
        removeFamiliar,
        regularizarDeudaSocio,
        cobradores,
        addCobrador,
        updateCobrador,
        deleteCobrador,
        toggleCobradorEstado,
        instructores,
        addInstructor,
        updateInstructor,
        deleteInstructor,
        toggleInstructorEstado,
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
