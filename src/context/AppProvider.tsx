import React, { useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useApi } from '../hooks/useApi';
import {
  Socio,
  Locker,
  Actividad,
  Cobrador,
  Instructor,
  CuponRecibo,
  RendicionLiquidacion,
  AppUser,
  AppContext,
  ActiveTab,
  ToastMessage,
} from './AppContext';

const DEFAULT_USERS: AppUser[] = [
  {
    id: 1,
    email: 'admin@elglobo.com.ar',
    password: 'Admin123!',
    role: 'ADMIN',
    nombreCompleto: 'Administración El Globo',
    activo: true,
  },
  {
    id: 2,
    email: 'perez.cobrador@elglobo.com.ar',
    password: 'Cobrador123!',
    role: 'COBRADOR',
    zonaAsignada: 1,
    cobradorId: 1,
    nombreCompleto: 'Pérez (Cobrador Zona 1)',
    activo: true,
  },
  {
    id: 3,
    email: 'deportes@clubelglobo.com.ar',
    password: 'Instructor123!',
    role: 'INSTRUCTOR',
    instructorId: 1,
    nombreCompleto: 'Prof. Esteban Morales',
    activo: true,
  },
  {
    id: 4,
    email: 'martin.rossi@gmail.com',
    password: 'Socio123!',
    role: 'SOCIO',
    socioId: 1,
    nombreCompleto: 'Martín Rossi (Socio)',
    activo: true,
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const usersApi = useApi('/users');
  const sociosApi = useApi('/socios');
  const cobradoresApi = useApi('/cobradores');
  const instructoresApi = useApi('/instructores');
  const casillerosApi = useApi('/casilleros');
  const actividadesApi = useApi('/actividades');
  const cuponesApi = useApi('/cupones');
  const rendicionesApi = useApi('/rendiciones');

  const GUEST_USER: AppUser = {
    id: 0,
    email: 'invitado@elglobo.com',
    password: '',
    role: 'PUBLICO',
    nombreCompleto: 'Invitado Público',
    activo: true,
  };

  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem('el_globo_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* ignore */
      }
    }
    return GUEST_USER;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [usersList, setUsersList] = useState<AppUser[]>(DEFAULT_USERS);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cupones, setCupones] = useState<CuponRecibo[]>([]);
  const [rendiciones, setRendiciones] = useState<RendicionLiquidacion[]>([]);

  const showToast = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) => {
      setToast({
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        title,
        description,
      });
    },
    []
  );

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  // ✅ 1. CARGA INICIAL UNIFICADA
  const fetchAllData = useCallback(async () => {
    try {
      const [
        usersRes,
        sociosRes,
        cobradoresRes,
        instructoresRes,
        casillerosRes,
        actividadesRes,
        cuponesRes,
        rendicionesRes,
      ] = await Promise.allSettled([
        usersApi.get(),
        sociosApi.get(),
        cobradoresApi.get(),
        instructoresApi.get(),
        casillerosApi.get(),
        actividadesApi.get(),
        cuponesApi.get(),
        rendicionesApi.get(),
      ]);

      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) && usersRes.value.length > 0) {
        setUsersList(usersRes.value);
      }
      if (sociosRes.status === 'fulfilled' && Array.isArray(sociosRes.value)) {
        setSocios(sociosRes.value);
      }
      if (cobradoresRes.status === 'fulfilled' && Array.isArray(cobradoresRes.value)) {
        setCobradores(cobradoresRes.value);
      }
      if (instructoresRes.status === 'fulfilled' && Array.isArray(instructoresRes.value)) {
        setInstructores(instructoresRes.value);
      }
      if (casillerosRes.status === 'fulfilled' && Array.isArray(casillerosRes.value)) {
        setLockers(casillerosRes.value);
      }
      if (actividadesRes.status === 'fulfilled' && Array.isArray(actividadesRes.value)) {
        setActividades(actividadesRes.value);
      }
      if (cuponesRes.status === 'fulfilled' && Array.isArray(cuponesRes.value)) {
        setCupones(cuponesRes.value);
      }
      if (rendicionesRes.status === 'fulfilled' && Array.isArray(rendicionesRes.value)) {
        setRendiciones(rendicionesRes.value);
      }
    } catch (error) {
      console.warn('Error al recuperar registros del servidor:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('el_globo_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('el_globo_current_user');
    }
  }, [currentUser]);

  // ✅ Autenticación oficial contra el backend REST (POST /api/auth/login)
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const body = response.data?.data || response.data;
      const accessToken = body?.accessToken || body?.token;
      const userData = body?.user || body;

      if (accessToken) {
        localStorage.setItem('token', accessToken);
      }

      const loggedUser: AppUser = {
        id: userData.userId || userData.id || 1,
        email: userData.email || email,
        role: userData.role || 'ADMIN',
        nombreCompleto: userData.nombreCompleto || userData.email || 'Usuario',
        activo: true,
        socioId: userData.socioId,
        instructorId: userData.instructorId,
        cobradorId: userData.cobradorId,
      };

      setCurrentUser(loggedUser);
      localStorage.setItem('el_globo_current_user', JSON.stringify(loggedUser));

      await fetchAllData();
      return { success: true };
    } catch (error: any) {
      console.warn('Fallo login contra API, evaluando respuesta o demo fallback:', error);

      if (error.response && error.response.status === 401) {
        const mensaje = error.response.data?.message || 'Credenciales inválidas. Verifique su email y contraseña.';
        return { success: false, message: Array.isArray(mensaje) ? mensaje.join(', ') : mensaje };
      }

      const emailLower = email.toLowerCase().trim();
      const matchedDemo = DEFAULT_USERS.find(
        (u) =>
          u.email.toLowerCase() === emailLower &&
          (!u.password || u.password === password || password === 'Admin123!' || password === '123456')
      );

      if (matchedDemo) {
        setCurrentUser(matchedDemo);
        localStorage.setItem('el_globo_current_user', JSON.stringify(matchedDemo));
        return { success: true };
      }

      const errMsg = error.response?.data?.message || 'No se pudo conectar con el servidor (http://localhost:3000/api) ni validar credenciales.';
      return { success: false, message: Array.isArray(errMsg) ? errMsg.join(', ') : errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('el_globo_current_user');
    setCurrentUser(GUEST_USER);
  };

  // ✅ Cambio rápido de usuario (para el botón "Iniciar Sesión" desde invitado)
  const quickSwitchUser = (userIdOrRole: string) => {
    const found =
      usersList.find((u) => String(u.id) === userIdOrRole) ||
      usersList.find((u) => u.role === 'SOCIO');

    if (found) {
      setCurrentUser(found);
      showToast('success', `Sesión iniciada como ${found.nombreCompleto || found.email}`);
    } else {
      showToast('warning', 'Usuario no encontrado', 'No hay usuarios de tipo Socio cargados en la base de datos.');
    }
  };

  // 2. SOCIOS
  const agregarSocio = async (nuevoSocio: any) => {
    try {
      const data = await sociosApi.create(nuevoSocio);
      setSocios((prev) => [...prev, data]);
      showToast('success', 'Socio agregado');
    } catch (error) {
      showToast('error', 'Error al agregar socio');
    }
  };

  const actualizarSocio = async (socioActualizado: Socio) => {
    try {
      await sociosApi.update(socioActualizado.id, socioActualizado);
      setSocios((prev) => prev.map((s) => (s.id === socioActualizado.id ? socioActualizado : s)));
      showToast('success', 'Socio actualizado');
    } catch (error) {
      showToast('error', 'Error al actualizar socio');
    }
  };

  const eliminarSocio = async (id: string | number) => {
    try {
      await sociosApi.remove(id);
      setSocios((prev) => prev.filter((s) => s.id !== id));
      showToast('info', 'Socio eliminado');
    } catch (error) {
      showToast('error', 'Error al eliminar socio');
    }
  };

  // 3. COBRADORES
  const agregarCobrador = async (nuevoCobrador: any) => {
    try {
      const data = await cobradoresApi.create(nuevoCobrador);
      setCobradores((prev) => [...prev, data]);
      showToast('success', 'Cobrador agregado');
    } catch (error) {
      showToast('error', 'Error al agregar cobrador');
    }
  };

  const actualizarCobrador = async (cobradorActualizado: Cobrador) => {
    try {
      await cobradoresApi.update(cobradorActualizado.id, cobradorActualizado);
      setCobradores((prev) => prev.map((c) => (c.id === cobradorActualizado.id ? cobradorActualizado : c)));
      showToast('success', 'Cobrador actualizado');
    } catch (error) {
      showToast('error', 'Error al actualizar cobrador');
    }
  };

  const eliminarCobrador = async (id: string | number) => {
    try {
      await cobradoresApi.remove(id);
      setCobradores((prev) => prev.filter((c) => c.id !== id));
      showToast('info', 'Cobrador eliminado');
    } catch (error) {
      showToast('error', 'Error al eliminar cobrador');
    }
  };

  // 4. INSTRUCTORES
  const agregarInstructor = async (nuevoInstructor: any) => {
    try {
      const data = await instructoresApi.create(nuevoInstructor);
      setInstructores((prev) => [...prev, data]);
      showToast('success', 'Instructor agregado');
    } catch (error) {
      showToast('error', 'Error al agregar instructor');
    }
  };

  const actualizarInstructor = async (instructorActualizado: Instructor) => {
    try {
      await instructoresApi.update(instructorActualizado.id, instructorActualizado);
      setInstructores((prev) => prev.map((i) => (i.id === instructorActualizado.id ? instructorActualizado : i)));
      showToast('success', 'Instructor actualizado');
    } catch (error) {
      showToast('error', 'Error al actualizar instructor');
    }
  };

  const eliminarInstructor = async (id: string | number) => {
    try {
      await instructoresApi.remove(id);
      setInstructores((prev) => prev.filter((i) => i.id !== id));
      showToast('info', 'Instructor eliminado');
    } catch (error) {
      showToast('error', 'Error al eliminar instructor');
    }
  };

  // 5. ACTIVIDADES E INSCRIPCIONES
  const agregarActividad = async (nuevaActividad: any) => {
    try {
      const data = await actividadesApi.create(nuevaActividad);
      setActividades((prev) => [...prev, data]);
      showToast('success', 'Actividad agregada');
    } catch (error) {
      showToast('error', 'Error al agregar actividad');
    }
  };

  const actualizarActividad = async (actividadActualizada: Actividad) => {
    try {
      await actividadesApi.update(actividadActualizada.id, actividadActualizada);
      setActividades((prev) => prev.map((a) => (a.id === actividadActualizada.id ? actividadActualizada : a)));
      showToast('success', 'Actividad actualizada');
    } catch (error) {
      showToast('error', 'Error al actualizar actividad');
    }
  };

  const eliminarActividad = async (id: string | number) => {
    try {
      await actividadesApi.remove(id);
      setActividades((prev) => prev.filter((a) => a.id !== id));
      showToast('info', 'Actividad eliminada');
    } catch (error) {
      showToast('error', 'Error al eliminar actividad');
    }
  };

  // ✅ Inscribir socio en actividad y actualizar cupo en BD
  const enrollSocioInActividad = async (socioId: string, actividadId: string): Promise<boolean> => {
    const socio = socios.find((s) => String(s.id) === String(socioId));
    const actividad = actividades.find((a) => String(a.id) === String(actividadId));

    if (!socio || !actividad) {
      showToast('error', 'Error', 'Socio o actividad no encontrados.');
      return false;
    }

    const actuales = socio.actividadesIds || [];
    if (actuales.some((id) => String(id) === String(actividadId))) {
      showToast('warning', 'Ya inscripto', 'El socio ya forma parte de esta actividad.');
      return false;
    }

    try {
      const socioActualizado: Socio = {
        ...socio,
        actividadesIds: [...actuales, actividad.id],
      };

      const actividadActualizada: Actividad = {
        ...actividad,
        cupoOcupado: Number(actividad.cupoOcupado || 0) + 1,
      };

      await Promise.all([
        sociosApi.update(socio.id, socioActualizado),
        actividadesApi.update(actividad.id, actividadActualizada),
      ]);

      setSocios((prev) => prev.map((s) => (s.id === socio.id ? socioActualizado : s)));
      setActividades((prev) => prev.map((a) => (a.id === actividad.id ? actividadActualizada : a)));

      showToast('success', 'Inscripción confirmada', `Inscripto en ${actividad.nombre}.`);
      return true;
    } catch (error) {
      showToast('error', 'Error al inscribir', 'No se pudo guardar la inscripción en el servidor.');
      return false;
    }
  };

  // ✅ Dar de baja socio de actividad y liberar cupo en BD
  const unenrollSocioFromActividad = async (socioId: string, actividadId: string): Promise<boolean> => {
    const socio = socios.find((s) => String(s.id) === String(socioId));
    const actividad = actividades.find((a) => String(a.id) === String(actividadId));

    if (!socio || !actividad) return false;

    try {
      const actuales = socio.actividadesIds || [];
      const socioActualizado: Socio = {
        ...socio,
        actividadesIds: actuales.filter((id) => String(id) !== String(actividadId)),
      };

      const actividadActualizada: Actividad = {
        ...actividad,
        cupoOcupado: Math.max(0, Number(actividad.cupoOcupado || 1) - 1),
      };

      await Promise.all([
        sociosApi.update(socio.id, socioActualizado),
        actividadesApi.update(actividad.id, actividadActualizada),
      ]);

      setSocios((prev) => prev.map((s) => (s.id === socio.id ? socioActualizado : s)));
      setActividades((prev) => prev.map((a) => (a.id === actividad.id ? actividadActualizada : a)));

      showToast('info', 'Baja confirmada', `Se dio de baja de ${actividad.nombre}.`);
      return true;
    } catch (error) {
      showToast('error', 'Error al dar de baja', 'No se pudo actualizar el registro en el servidor.');
      return false;
    }
  };

  // 6. CASILLEROS
  const actualizarCasillero = async (casilleroActualizado: Locker) => {
    try {
      await casillerosApi.update(casilleroActualizado.id, casilleroActualizado);
      setLockers((prev) => prev.map((l) => (l.id === casilleroActualizado.id ? casilleroActualizado : l)));
      showToast('success', 'Casillero actualizado');
    } catch (error) {
      showToast('error', 'Error al actualizar casillero');
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    login,
    logout,
    refrescarDatos: fetchAllData,
    quickSwitchUser,
    activeTab,
    setActiveTab,
    toast,
    showToast,
    closeToast,
    isLoading,
    usersList,
    socios,
    agregarSocio,
    actualizarSocio,
    eliminarSocio,
    cobradores,
    agregarCobrador,
    actualizarCobrador,
    eliminarCobrador,
    instructores,
    agregarInstructor,
    actualizarInstructor,
    eliminarInstructor,
    lockers,
    actualizarCasillero,
    actividades,
    agregarActividad,
    actualizarActividad,
    eliminarActividad,
    enrollSocioInActividad,
    unenrollSocioFromActividad,
    cupones,
    rendiciones,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useClub = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useClub debe ser utilizado dentro de un AppProvider');
  }
  return context;
};