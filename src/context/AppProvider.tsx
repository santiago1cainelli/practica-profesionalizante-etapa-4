import React, { useContext, useState, useEffect, useCallback } from 'react';
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

  const [usersList, setUsersList] = useState<AppUser[]>([]);
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

  // ✅ 1. CARGA INICIAL UNIFICADA (incluye actividades dentro del mismo Promise.all)
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [
          usersData,
          sociosData,
          cobradoresData,
          instructoresData,
          casillerosData,
          actividadesData,
          cuponesData,
          rendicionesData,
        ] = await Promise.all([
          usersApi.get(),
          sociosApi.get(),
          cobradoresApi.get(),
          instructoresApi.get(),
          casillerosApi.get(),
          actividadesApi.get(),
          cuponesApi.get(),
          rendicionesApi.get(),
        ]);

        if (Array.isArray(usersData)) {
          setUsersList(usersData);
          if (!currentUser && usersData.length > 0) {
            setCurrentUser(usersData[0]);
          }
        }
        if (Array.isArray(sociosData)) setSocios(sociosData);
        if (Array.isArray(cobradoresData)) setCobradores(cobradoresData);
        if (Array.isArray(instructoresData)) setInstructores(instructoresData);
        if (Array.isArray(casillerosData)) setLockers(casillerosData);
        if (Array.isArray(actividadesData)) setActividades(actividadesData);
        if (Array.isArray(cuponesData)) setCupones(cuponesData);
        if (Array.isArray(rendicionesData)) setRendiciones(rendicionesData);
      } catch (error) {
        showToast('error', 'Error al cargar datos', 'No se pudieron recuperar los registros del servidor.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('el_globo_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('el_globo_current_user');
    }
  }, [currentUser]);

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

  if (isLoading) {
    return <h1>Cargando datos del servidor...</h1>;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useClub = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useClub debe ser utilizado dentro de un AppProvider');
  }
  return context;
};