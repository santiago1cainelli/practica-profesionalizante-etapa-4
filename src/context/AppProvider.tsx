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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const usersApi = useApi('/users');
  const sociosApi = useApi('/socios');
  const cobradoresApi = useApi('/cobradores');
  const instructoresApi = useApi('/instructores');
  const casillerosApi = useApi('/casilleros');
  const actividadesApi = useApi('/actividades');
  const inscripcionesApi = useApi('/inscripciones');
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

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalEmail, setLoginModalEmail] = useState('');

  const openLoginModal = (prefillEmail: string = '') => {
    setLoginModalEmail(prefillEmail);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setLoginModalEmail('');
  };

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

  // ✅ 1. CARGA INICIAL UNIFICADA
  const fetchAllData = useCallback(async () => {
    try {
      const savedUserStr = localStorage.getItem('el_globo_current_user');
      const activeUser: AppUser | null = savedUserStr ? JSON.parse(savedUserStr) : null;
      const isSocio = activeUser?.role === 'SOCIO' || currentUser?.role === 'SOCIO';

      // Si el rol es SOCIO, intentar obtener datos propios vía /socios/me
      const sociosPromise = isSocio
        ? api
            .get('/socios/me')
            .then((res) => {
              const d = res.data?.data || res.data;
              return Array.isArray(d) ? d : (d ? [d] : []);
            })
            .catch(() => sociosApi.get())
        : sociosApi.get();

      const [
        usersRes,
        sociosRes,
        cobradoresRes,
        instructoresRes,
        casillerosRes,
        actividadesRes,
        inscripcionesRes,
        cuponesRes,
        rendicionesRes,
      ] = await Promise.allSettled([
        usersApi.get(),
        sociosPromise,
        cobradoresApi.get(),
        instructoresApi.get(),
        casillerosApi.get(),
        actividadesApi.get(),
        inscripcionesApi.get(),
        cuponesApi.get(),
        rendicionesApi.get(),
      ]);

      if (usersRes.status === 'fulfilled') {
        const val = usersRes.value;
        setUsersList(Array.isArray(val) ? val : []);
      }
      if (sociosRes.status === 'fulfilled') {
        const raw = sociosRes.value;
        const rawSocios = Array.isArray(raw) ? raw : (raw ? [raw] : []);
        const enrichedSocios = rawSocios.map((s: any) => ({
          ...s,
          numeroSocio: s.numeroSocio || s.id,
          nombreCompleto: s.nombreCompleto || `${s.nombre || ''} ${s.apellido || ''}`.trim(),
          actividadesIds:
            s.actividadesIds ||
            s.inscripciones
              ?.filter((i: any) => i.activa !== false)
              .map((i: any) => i.actividad?.id || i.actividadId)
              .filter(Boolean) ||
            [],
          casilleroAsignadoId: s.casilleroAsignadoId || s.casillero?.id || s.casillero?.numero,
          edad:
            s.edad ||
            (s.fechaNacimiento
              ? Math.floor(
                  (Date.now() - new Date(s.fechaNacimiento).getTime()) / (365.25 * 24 * 3600 * 1000),
                )
              : 30),
          antiguedadAnios:
            s.antiguedadAnios ||
            (s.fechaAlta
              ? Math.max(0, new Date().getFullYear() - new Date(s.fechaAlta).getFullYear())
              : 0),
          montoCuotaSocial:
            s.montoCuotaSocial ??
            (s.categoria === 'VITALICIO'
              ? 0
              : s.categoria === 'CADETE'
              ? 4500
              : 8500),
          familiares:
            s.familiares ||
            s.grupoFamiliar?.integrantes
              ?.filter((i: any) => String(i.id) !== String(s.id))
              .map((fam: any) => ({
                id: fam.id,
                nombreCompleto: fam.nombreCompleto || `${fam.nombre || ''} ${fam.apellido || ''}`.trim(),
                dni: fam.dni,
                parentesco: fam.parentesco || fam.rolGrupoFamiliar || 'FAMILIAR',
                edad:
                  fam.edad ||
                  (fam.fechaNacimiento
                    ? Math.floor(
                        (Date.now() - new Date(fam.fechaNacimiento).getTime()) /
                          (365.25 * 24 * 3600 * 1000),
                      )
                    : 0),
              })) ||
            [],
        }));
        setSocios(enrichedSocios);
      }
      if (cobradoresRes.status === 'fulfilled') {
        const val = cobradoresRes.value;
        const list = Array.isArray(val) ? val : [];
        const enrichedCobradores = list.map((c: any) => ({
          ...c,
          nombreCompleto:
            c.nombreCompleto ||
            (c.nombre && c.apellido ? `${c.nombre} ${c.apellido}`.trim() : c.nombre || c.apellido || `Cobrador ${c.id}`),
          zonaAsignada: c.zonaAsignada ?? (c.zona !== undefined ? Number(String(c.zona).replace(/\D/g, '')) || c.zona : 0),
        }));
        setCobradores(enrichedCobradores);
      }
      if (instructoresRes.status === 'fulfilled') {
        const val = instructoresRes.value;
        setInstructores(Array.isArray(val) ? val : []);
      }
      if (casillerosRes.status === 'fulfilled') {
        const val = casillerosRes.value;
        setLockers(Array.isArray(val) ? val : []);
      }
      // 1. Normalizar instructores
      let normalizedInstructores: Instructor[] = [];
      if (instructoresRes.status === 'fulfilled') {
        const val = instructoresRes.value;
        const list = Array.isArray(val) ? val : [];
        normalizedInstructores = list.map((inst: any) => ({
          ...inst,
          nombre:
            `${inst.nombre || ''}`.trim() ||
            `Instructor ${inst.id}`,
        }));
        setInstructores(normalizedInstructores);
      }

      // 2. Normalizar actividades vinculando el nombre del instructor
      if (actividadesRes.status === 'fulfilled') {
        const val = actividadesRes.value;
        const list = Array.isArray(val) ? val : [];
        const allInscripciones =
          inscripcionesRes.status === 'fulfilled' && Array.isArray(inscripcionesRes.value)
            ? inscripcionesRes.value
            : [];

        const enrichedActividades = list.map((a: any) => {
          const insFromEndpoint = allInscripciones.filter(
            (ins: any) =>
              String(ins.actividadId || ins.actividad?.id) === String(a.id) &&
              ins.activa !== false
          );
          const insFromRelation = Array.isArray(a.inscripciones)
            ? a.inscripciones.filter((ins: any) => ins.activa !== false)
            : [];

          const totalInscriptos = Math.max(
            Number(a.cupoOcupado ?? a.inscriptosCount ?? a._count?.inscripciones ?? 0),
            insFromEndpoint.length,
            insFromRelation.length
          );

          return {
            ...a,
            cupoOcupado: totalInscriptos,
            inscripciones: insFromEndpoint.length > 0 ? insFromEndpoint : a.inscripciones,
          };
        });

        setActividades(enrichedActividades);
      }
      if (cuponesRes.status === 'fulfilled') {
        const val = cuponesRes.value;
        setCupones(Array.isArray(val) ? val : []);
      }
      if (rendicionesRes.status === 'fulfilled') {
        const val = rendicionesRes.value;
        const list = Array.isArray(val) ? val : [];
        const enrichedRendiciones = list.map((r: any) => ({
          ...r,
          cobradorId: r.cobradorId || r.cobrador?.id,
          cobradorNombre:
            r.cobradorNombre ||
            r.cobrador?.nombreCompleto ||
            (r.cobrador ? `${r.cobrador.nombre || ''} ${r.cobrador.apellido || ''}`.trim() : undefined),
          zonaCobro: r.zonaCobro ?? (r.cobrador?.zona !== undefined ? Number(String(r.cobrador.zona).replace(/\D/g, '')) || r.cobrador.zona : 0),
        }));
        setRendiciones(enrichedRendiciones);
      }
    } catch (error) {
      console.warn('Error al recuperar registros del servidor:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

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
      console.warn('Fallo login contra API:', error);

      if (error.response && error.response.status === 401) {
        const mensaje = error.response.data?.message || 'Credenciales inválidas. Verifique su email y contraseña.';
        return { success: false, message: Array.isArray(mensaje) ? mensaje.join(', ') : mensaje };
      }

      const errMsg = error.response?.data?.message || 'No se pudo conectar con el servidor (http://localhost:3000/api) ni validar credenciales.';
      return { success: false, message: Array.isArray(errMsg) ? errMsg.join(', ') : errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('el_globo_current_user');
    setCurrentUser(GUEST_USER);
    setUsersList([]);
    setSocios([]);
    setCobradores([]);
    setInstructores([]);
    setLockers([]);
    setActividades([]);
    setCupones([]);
    setRendiciones([]);
  };

  // Helper para sanitizar objetos de socio antes de enviar al backend (evita errores 400 por forbidNonWhitelisted)
  const sanitizeSocioPayload = (socio: any) => {
    const payload: any = {};
    if (socio.nombre !== undefined) payload.nombre = socio.nombre;
    if (socio.apellido !== undefined) payload.apellido = socio.apellido;
    if (socio.dni !== undefined) payload.dni = String(socio.dni);
    if (socio.fechaNacimiento !== undefined) {
      payload.fechaNacimiento =
        socio.fechaNacimiento instanceof Date
          ? socio.fechaNacimiento.toISOString().split('T')[0]
          : String(socio.fechaNacimiento).split('T')[0];
    }
    if (socio.fechaAlta !== undefined) {
      payload.fechaAlta =
        socio.fechaAlta instanceof Date
          ? socio.fechaAlta.toISOString().split('T')[0]
          : String(socio.fechaAlta).split('T')[0];
    }
    if (socio.direccion !== undefined) payload.direccion = socio.direccion;
    if (socio.localidad !== undefined) payload.localidad = socio.localidad;
    if (socio.telefono !== undefined) payload.telefono = socio.telefono;
    if (socio.email !== undefined) payload.email = socio.email;
    if (socio.zonaCobro !== undefined) payload.zonaCobro = socio.zonaCobro;
    return payload;
  };

  // ✅ Cambio rápido de usuario (para el botón "Iniciar Sesión" desde invitado)
  const quickSwitchUser = async (userIdOrRole: string) => {
    const found =
      usersList.find((u) => String(u.id) === userIdOrRole) ||
      usersList.find((u) => u.role === 'SOCIO');

    if (found) {
      openLoginModal(found.email);
    } else {
      openLoginModal();
    }
  };

  // 2. SOCIOS
  const agregarSocio = async (nuevoSocio: any) => {
    try {
      const payload = sanitizeSocioPayload(nuevoSocio);
      const data = await sociosApi.create(payload);
      const enriched = {
        ...data,
        actividadesIds: [],
        edad:
          data.edad ||
          (data.fechaNacimiento
            ? Math.floor(
                (Date.now() - new Date(data.fechaNacimiento).getTime()) / (365.25 * 24 * 3600 * 1000),
              )
            : 30),
      };
      setSocios((prev) => [...prev, enriched]);
      showToast('success', 'Socio agregado');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al agregar socio';
      showToast('error', 'Error al agregar socio', Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const actualizarSocio = async (socioActualizado: Socio) => {
    try {
      const payload = sanitizeSocioPayload(socioActualizado);
      const res = await sociosApi.update(socioActualizado.id, payload);
      setSocios((prev) =>
        prev.map((s) => (s.id === socioActualizado.id ? { ...s, ...socioActualizado, ...res } : s)),
      );
      showToast('success', 'Socio actualizado');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al actualizar socio';
      showToast('error', 'Error al actualizar socio', Array.isArray(msg) ? msg.join(', ') : msg);
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
  const sanitizeCobradorPayload = (cobrador: any) => {
    const payload: any = {};
    if (cobrador.nombre !== undefined) payload.nombre = cobrador.nombre;
    if (cobrador.apellido !== undefined) payload.apellido = cobrador.apellido;
    const correo = cobrador.correo || cobrador.email;
    if (correo !== undefined) payload.correo = correo;

    const zonaVal = cobrador.zona !== undefined ? cobrador.zona : cobrador.zonaAsignada;
    if (zonaVal !== undefined) {
      payload.zona = Number(zonaVal);
    }

    if (cobrador.comisionPorcentaje !== undefined) {
      payload.comisionPorcentaje = Number(cobrador.comisionPorcentaje);
    } else if (cobrador.porcentajeComision !== undefined) {
      const p = Number(cobrador.porcentajeComision);
      payload.comisionPorcentaje = p <= 1 ? Math.round(p * 100) : p;
    }
    return payload;
  };

  const agregarCobrador = async (nuevoCobrador: any) => {
    try {
      const payload = sanitizeCobradorPayload(nuevoCobrador);
      const data = await cobradoresApi.create(payload);
      setCobradores((prev) => [...prev, { ...nuevoCobrador, ...data }]);
      showToast('success', 'Cobrador agregado');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al agregar cobrador';
      showToast('error', 'Error al agregar cobrador', Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const actualizarCobrador = async (cobradorActualizado: Cobrador) => {
    try {
      const payload = sanitizeCobradorPayload(cobradorActualizado);
      const res = await cobradoresApi.update(cobradorActualizado.id, payload);
      setCobradores((prev) =>
        prev.map((c) => (c.id === cobradorActualizado.id ? { ...c, ...cobradorActualizado, ...res } : c)),
      );
      showToast('success', 'Cobrador actualizado');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al actualizar cobrador';
      showToast('error', 'Error al actualizar cobrador', Array.isArray(msg) ? msg.join(', ') : msg);
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
  const sanitizeInstructorPayload = (instructor: any) => {
    const payload: any = {};
    if (instructor.nombre !== undefined) payload.nombre = instructor.nombre;
    if (instructor.apellido !== undefined) payload.apellido = instructor.apellido;
    if (instructor.email !== undefined) payload.email = instructor.email;
    if (instructor.telefono !== undefined) payload.telefono = instructor.telefono;
    if (instructor.sueldo !== undefined) payload.sueldo = Number(instructor.sueldo);
    return payload;
  };

  const agregarInstructor = async (nuevoInstructor: any) => {
    try {
      const payload = sanitizeInstructorPayload(nuevoInstructor);
      const data = await instructoresApi.create(payload);
      setInstructores((prev) => [...prev, { ...nuevoInstructor, ...data }]);
      showToast('success', 'Instructor agregado');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al agregar instructor';
      showToast('error', 'Error al agregar instructor', Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const actualizarInstructor = async (instructorActualizado: Instructor) => {
    try {
      const payload = sanitizeInstructorPayload(instructorActualizado);
      const res = await instructoresApi.update(instructorActualizado.id, payload);
      setInstructores((prev) =>
        prev.map((i) => (i.id === instructorActualizado.id ? { ...i, ...instructorActualizado, ...res } : i)),
      );
      showToast('success', 'Instructor actualizado');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al actualizar instructor';
      showToast('error', 'Error al actualizar instructor', Array.isArray(msg) ? msg.join(', ') : msg);
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
  const sanitizeActividadPayload = (actividad: any) => {
    const payload: any = {};
    if (actividad.nombre !== undefined) payload.nombre = actividad.nombre;
    if (actividad.descripcion !== undefined) payload.descripcion = actividad.descripcion;
    if (actividad.arancel !== undefined) {
      payload.arancel = Number(actividad.arancel);
    } else if (actividad.costoMensual !== undefined) {
      payload.arancel = Number(actividad.costoMensual);
    }
    if (actividad.turno !== undefined) payload.turno = actividad.turno;
    if (actividad.diasSemana !== undefined) {
      payload.diasSemana = Array.isArray(actividad.diasSemana)
        ? actividad.diasSemana.join(', ')
        : String(actividad.diasSemana);
    } else if (actividad.dias !== undefined) {
      payload.diasSemana = Array.isArray(actividad.dias)
        ? actividad.dias.join(', ')
        : String(actividad.dias);
    }
    if (actividad.horaInicio !== undefined) payload.horaInicio = actividad.horaInicio;
    if (actividad.horaFin !== undefined) payload.horaFin = actividad.horaFin;
    if (actividad.cupoMaximo !== undefined) payload.cupoMaximo = Number(actividad.cupoMaximo);
    if (actividad.instructorId !== undefined && actividad.instructorId !== 'sin-asignar') {
      const instId = Number(actividad.instructorId);
      if (!isNaN(instId) && instId > 0) payload.instructorId = instId;
    }
    return payload;
  };

  const agregarActividad = async (nuevaActividad: any) => {
    try {
      const payload = sanitizeActividadPayload(nuevaActividad);
      const data = await actividadesApi.create(payload);
      setActividades((prev) => [...prev, { ...nuevaActividad, ...data }]);
      showToast('success', 'Actividad agregada');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al agregar actividad';
      showToast('error', 'Error al agregar actividad', Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const actualizarActividad = async (actividadActualizada: Actividad) => {
    try {
      const payload = sanitizeActividadPayload(actividadActualizada);
      const res = await actividadesApi.update(actividadActualizada.id, payload);
      setActividades((prev) =>
        prev.map((a) => (a.id === actividadActualizada.id ? { ...a, ...actividadActualizada, ...res } : a)),
      );
      showToast('success', 'Actividad actualizada');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al actualizar actividad';
      showToast('error', 'Error al actualizar actividad', Array.isArray(msg) ? msg.join(', ') : msg);
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

  // ✅ Inscribir socio en actividad mediante POST /api/inscripciones y sincronizar estado
  const enrollSocioInActividad = async (socioId: string, actividadId: string): Promise<boolean> => {
    const sId = Number(socioId);
    const aId = Number(actividadId);
    const socio = socios.find((s) => String(s.id) === String(socioId)) || (currentUser?.socioId && Number(currentUser.socioId) === sId ? { id: sId, actividadesIds: [] } as any : null);
    const actividad = actividades.find((a) => String(a.id) === String(actividadId));

    if (!socio || !actividad) {
      showToast('error', 'Error', 'Socio o actividad no encontrados.');
      return false;
    }

    const actuales = socio.actividadesIds || [];
    if (actuales.some((id: any) => String(id) === String(actividadId))) {
      showToast('warning', 'Ya inscripto', 'El socio ya forma parte de esta actividad.');
      return false;
    }

    try {
      await api.post('/inscripciones', { socioId: sId, actividadId: aId });

      const socioActualizado: Socio = {
        ...socio,
        actividadesIds: [...actuales, actividad.id],
      };

      const actividadActualizada: Actividad = {
        ...actividad,
        cupoOcupado: Number(actividad.cupoOcupado || 0) + 1,
      };

      setSocios((prev) => prev.map((s) => (s.id === socio.id ? socioActualizado : s)));
      setActividades((prev) => prev.map((a) => (a.id === actividad.id ? actividadActualizada : a)));

      showToast('success', 'Inscripción confirmada', `Inscripto en ${actividad.nombre}.`);
      fetchAllData();
      return true;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'No se pudo guardar la inscripción en el servidor.';
      showToast('error', 'Error al inscribir', Array.isArray(msg) ? msg.join(', ') : msg);
      return false;
    }
  };

  // ✅ Dar de baja socio de actividad mediante DELETE /api/inscripciones y liberar cupo
  const unenrollSocioFromActividad = async (socioId: string, actividadId: string): Promise<boolean> => {
    const sId = Number(socioId);
    const aId = Number(actividadId);
    const socio =
      socios.find((s) => String(s.id) === String(socioId)) ||
      ({ id: sId, actividadesIds: [] } as any);
    const actividad = actividades.find((a) => String(a.id) === String(actividadId));

    if (!actividad) return false;

    try {
      await api.delete(`/inscripciones/socio/${sId}/actividad/${aId}`);

      const actuales = socio.actividadesIds || [];
      const socioActualizado: Socio = {
        ...socio,
        actividadesIds: actuales.filter((id: any) => String(id) !== String(actividadId)),
      };

      const actividadActualizada: Actividad = {
        ...actividad,
        cupoOcupado: Math.max(0, Number(actividad.cupoOcupado || 1) - 1),
      };

      setSocios((prev) => prev.map((s) => (s.id === socio.id ? socioActualizado : s)));
      setActividades((prev) => prev.map((a) => (a.id === actividad.id ? actividadActualizada : a)));

      const nombreSocio = socio.nombreCompleto || `${socio.nombre || ''} ${socio.apellido || ''}`.trim();
      const detalle = nombreSocio ? `Se dio de baja a ${nombreSocio} de ${actividad.nombre}.` : `Se dio de baja de ${actividad.nombre}.`;
      showToast('info', 'Baja confirmada', detalle);
      fetchAllData();
      return true;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'No se pudo actualizar el registro en el servidor.';
      showToast('error', 'Error al dar de baja', Array.isArray(msg) ? msg.join(', ') : msg);
      return false;
    }
  };

  // 6. CASILLEROS
  const actualizarCasillero = async (casilleroActualizado: Locker) => {
    try {
      const socioId = casilleroActualizado.socioId || (casilleroActualizado as any).socio?.id;
      const esLibre =
        casilleroActualizado.estado === 'DISPONIBLE' ||
        (casilleroActualizado.estado as string) === 'LIBRE' ||
        !socioId;
      if (esLibre) {
        await casillerosApi.update(casilleroActualizado.id, { estado: 'LIBRE', socioId: null });
      } else {
        await casillerosApi.update(casilleroActualizado.id, { socioId });
      }
      setLockers((prev) =>
        prev.map((l) => (l.id === casilleroActualizado.id ? casilleroActualizado : l)),
      );
      showToast('success', 'Casillero actualizado');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al actualizar casillero';
      showToast('error', 'Error al actualizar casillero', Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    login,
    logout,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
    loginModalEmail,
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