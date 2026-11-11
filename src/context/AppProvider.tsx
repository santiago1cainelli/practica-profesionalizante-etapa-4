import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { Socio, Locker, Actividad, Cobrador, Instructor, CuponRecibo, RendicionLiquidacion, AppUser, AppContext, ActiveTab, ToastMessage } from './AppContext.tsx';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ⭐️ Instanciamos los hooks de API para cada endpoint (similar a VeterinariaProvider)
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
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return GUEST_USER;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // ⭐️ Manejo de carga estilo VeterinariaProvider

  // Estados de datos
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cupones, setCupones] = useState<CuponRecibo[]>([]);
  const [rendiciones, setRendiciones] = useState<RendicionLiquidacion[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) => {
    setToast({
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      description,
    });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  // ----------------------------------------------------
  // ⭐️ 1. LÓGICA DE CARGA INICIAL (GET - READ)
  // ----------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          usersData,
          sociosData,
          cobradoresData,
          instructoresData,
          casillerosData,
          cuponesData,
          rendicionesData,
        ] = await Promise.all([
          usersApi.get(),
          sociosApi.get(),
          cobradoresApi.get(),
          instructoresApi.get(),
          casillerosApi.get(),
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
        if (Array.isArray(cuponesData)) setCupones(cuponesData);
        if (Array.isArray(rendicionesData)) setRendiciones(rendicionesData);
      } catch (error) {
        showToast('error', 'Error al cargar datos', 'No se pudieron recuperar los registros del servidor.');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchActividades = async () => {
      try {
        const [
          actividadesData,
        ] = await Promise.all([
          actividadesApi.get(),
        ]);

        if (Array.isArray(actividadesData)) setActividades(actividadesData);
      } catch (error) {
        showToast('error', 'Error al cargar datos', 'No se pudieron recuperar las actividades del servidor.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    fetchActividades();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('el_globo_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('el_globo_current_user');
    }
  }, [currentUser]);

  // ----------------------------------------------------
  // ⭐️ 2. FUNCIONES DE SOCIOS (CREATE, UPDATE, DELETE)
  // ----------------------------------------------------
  const agregarSocio = async (nuevoSocio: any) => {
    try {
      const data = await sociosApi.create(nuevoSocio);
      setSocios([...socios, data]);
      showToast('success', 'Socio agregado');
    } catch (error) {
      showToast('error', 'Error al agregar socio');
    }
  };

  const actualizarSocio = async (socioActualizado: Socio) => {
    try {
      await sociosApi.update(socioActualizado.id, socioActualizado);
      setSocios(socios.map((s) => (s.id === socioActualizado.id ? socioActualizado : s)));
      showToast('success', 'Socio actualizado');
    } catch (error) {
      showToast('error', 'Error al actualizar socio');
    }
  };

  const eliminarSocio = async (id: string | number) => {
    try {
      await sociosApi.remove(id);
      setSocios(socios.filter((s) => s.id !== id));
      showToast('info', 'Socio eliminado');
    } catch (error) {
      showToast('error', 'Error al eliminar socio');
    }
  };

  // ----------------------------------------------------
  // ⭐️ 3. FUNCIONES DE COBRADORES (CREATE, UPDATE, DELETE)
  // ----------------------------------------------------
  const agregarCobrador = async (nuevoCobrador: any) => {
    try {
      const data = await cobradoresApi.create(nuevoCobrador);
      setCobradores([...cobradores, data]);
      showToast('success', 'Cobrador agregado');
    } catch (error) {
      showToast('error', 'Error al agregar cobrador');
    }
  };

  const actualizarCobrador = async (cobradorActualizado: Cobrador) => {
    try {
      await cobradoresApi.update(cobradorActualizado.id, cobradorActualizado);
      setCobradores(cobradores.map((c) => (c.id === cobradorActualizado.id ? cobradorActualizado : c)));
      showToast('success', 'Cobrador actualizado');
    } catch (error) {
      showToast('error', 'Error al actualizar cobrador');
    }
  };

  const eliminarCobrador = async (id: string | number) => {
    try {
      await cobradoresApi.remove(id);
      setCobradores(cobradores.filter((c) => c.id !== id));
      showToast('info', 'Cobrador eliminado');
    } catch (error) {
      showToast('error', 'Error al eliminar cobrador');
    }
  };

  // ----------------------------------------------------
  // ⭐️ 4. FUNCIONES DE INSTRUCTORES (CREATE, UPDATE, DELETE)
  // ----------------------------------------------------
  const agregarInstructor = async (nuevoInstructor: any) => {
    try {
      const data = await instructoresApi.create(nuevoInstructor);
      setInstructores([...instructores, data]);
      showToast('success', 'Instructor agregado');
    } catch (error) {
      showToast('error', 'Error al agregar instructor');
    }
  };

  const actualizarInstructor = async (instructorActualizado: Instructor) => {
    try {
      await instructoresApi.update(instructorActualizado.id, instructorActualizado);
      setInstructores(instructores.map((i) => (i.id === instructorActualizado.id ? instructorActualizado : i)));
      showToast('success', 'Instructor actualizado');
    } catch (error) {
      showToast('error', 'Error al actualizar instructor');
    }
  };

  const eliminarInstructor = async (id: string | number) => {
    try {
      await instructoresApi.remove(id);
      setInstructores(instructores.filter((i) => i.id !== id));
      showToast('info', 'Instructor eliminado');
    } catch (error) {
      showToast('error', 'Error al eliminar instructor');
    }
  };

  // ----------------------------------------------------
  // ⭐️ 5. FUNCIONES DE ACTIVIDADES (CREATE, UPDATE, DELETE)
  // ----------------------------------------------------
  const agregarActividad = async (nuevaActividad: any) => {
    try {
      const data = await actividadesApi.create(nuevaActividad);
      setActividades([...actividades, data]);
      showToast('success', 'Actividad agregada');
    } catch (error) {
      showToast('error', 'Error al agregar actividad');
    }
  };

  const actualizarActividad = async (actividadActualizada: Actividad) => {
    try {
      await actividadesApi.update(actividadActualizada.id, actividadActualizada);
      setActividades(actividades.map((a) => (a.id === actividadActualizada.id ? actividadActualizada : a)));
      showToast('success', 'Actividad actualizada');
    } catch (error) {
      showToast('error', 'Error al actualizar actividad');
    }
  };

  const eliminarActividad = async (id: string | number) => {
    try {
      await actividadesApi.remove(id);
      setActividades(actividades.filter((a) => a.id !== id));
      showToast('info', 'Actividad eliminada');
    } catch (error) {
      showToast('error', 'Error al eliminar actividad');
    }
  };

  // ----------------------------------------------------
  // ⭐️ 6. FUNCIONES DE CASILLEROS (UPDATE)
  // ----------------------------------------------------
  const actualizarCasillero = async (casilleroActualizado: Locker) => {
    try {
      await casillerosApi.update(casilleroActualizado.id, casilleroActualizado);
      setLockers(lockers.map((l) => (l.id === casilleroActualizado.id ? casilleroActualizado : l)));
      showToast('success', 'Casillero actualizado');
    } catch (error) {
      showToast('error', 'Error al actualizar casillero');
    }
  };

  // ----------------------------------------------------
  // ⭐️ 7. DEFINIR EL OBJETO DE VALOR
  // ----------------------------------------------------
  const value = {
    currentUser,
    setCurrentUser,
    activeTab,
    setActiveTab,
    toast,
    showToast,
    closeToast,
    isLoading, // Explicito para vistas igual que en VeterinariaProvider

    usersList,

    // Socios
    socios,
    agregarSocio,
    actualizarSocio,
    eliminarSocio,

    // Cobradores
    cobradores,
    agregarCobrador,
    actualizarCobrador,
    eliminarCobrador,

    // Instructores
    instructores,
    agregarInstructor,
    actualizarInstructor,
    eliminarInstructor,

    // Casilleros
    lockers,
    actualizarCasillero,

    // Actividades
    actividades,
    agregarActividad,
    actualizarActividad,
    eliminarActividad,

    // Cupones y Rendiciones
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