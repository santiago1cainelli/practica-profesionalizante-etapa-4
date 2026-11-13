import React, { useState } from 'react';
import { useClub } from '../context/AppProvider';
import clubHeroBg from '../assets/images/club_hero_bg_1789672186691.jpg';
import clubArancelesBg from '../assets/images/club_aranceles_bg_1789673337907.jpg';
import {
  Trophy,
  ShieldCheck,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Lock,
  Award,
  LogIn,
  UserCheck,
  Check,
  Activity,
  Waves,
} from 'lucide-react';

interface GuestHomeProps {
  onOpenLoginModal?: () => void;
}

export const GuestHome: React.FC<GuestHomeProps> = () => {
  // ✅ Extraemos únicamente los métodos que existen en AppProvider (agregarSocio y setCurrentUser)
  const {
    setActiveTab,
    actividades,
    cobradores,
    usersList,
    agregarSocio,
    showToast,
    setCurrentUser,
    currentUser,
  } = useClub();

  const isLoggedIn = Boolean(currentUser && currentUser.role !== 'PUBLICO');

  // Valores predeterminados para renderizado visual basados en BD/API
  const CUOTA_ACTIVO_REF = 12500;
  const CUOTA_CADETE_REF = 8500;
  const CASILLERO_MENSUAL_REF = 2500;
  const DESCUENTO_HIJO_REF = 1500;

  // Estado del Formulario de Registro
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    dni: '',
    email: '',
    telefono: '',
    direccion: '',
    zonaCobro: 0,
    fechaNacimiento: '2000-05-15',
    actividadInteresId: '',
  });

  const [formSubmittedSuccess, setFormSubmittedSuccess] = useState<any | null>(null);
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>('TODAS');
  const [showDirectLogin, setShowDirectLogin] = useState(false);

  // ✅ Obtener nombre de la zona usando zonaAsignada (definido en AppContext)
  const getNombreZona = (zonaId: number) => {
    if (Number(zonaId) === 0) return 'Zona 0 - Sede Central (Ventanilla)';
    const c = cobradores.find(
      (cob) => Number(cob.zonaAsignada ?? (cob as any).zona) === Number(zonaId)
    );
    const nombreCob = c
      ? c.nombreCompleto || `${c.nombre || ''} ${c.apellido || ''}`.trim()
      : '';
    return nombreCob ? `Zona ${zonaId} - ${nombreCob}` : `Zona ${zonaId}`;
  };

  // Cálculo en tiempo real de la categoría para la vista previa del formulario
  const getCategoryPreview = (birthDate: string) => {
    if (!birthDate) return { label: 'Socio Activo', fee: CUOTA_ACTIVO_REF, isCadete: false };
    const hoy = new Date();
    const nac = new Date(birthDate);
    let age = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) age--;
    if (isNaN(age) || age < 0) age = 20;

    if (age < 18) {
      return {
        label: `Socio Cadete (${age} años)`,
        fee: CUOTA_CADETE_REF,
        isCadete: true,
      };
    }
    return {
      label: `Socio Activo (${age} años)`,
      fee: CUOTA_ACTIVO_REF,
      isCadete: false,
    };
  };

  const categoryPreview = getCategoryPreview(formData.fechaNacimiento);

  // ✅ Registro utilizando agregarSocio del contexto
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombreCompleto.trim() || !formData.dni.trim() || !formData.email.trim()) {
      showToast('error', 'Campos incompletos', 'Por favor ingresa nombre, DNI y correo electrónico.');
      return;
    }

    const partesNombre = formData.nombreCompleto.trim().split(' ');
    const nombre = partesNombre[0];
    const apellido = partesNombre.slice(1).join(' ') || partesNombre[0];
    const hoyStr = new Date().toISOString().split('T')[0];

    await agregarSocio({
      nombre,
      apellido,
      nombreCompleto: formData.nombreCompleto.trim(),
      dni: formData.dni.trim(),
      email: formData.email.trim(),
      telefono: formData.telefono.trim() || 'Sin teléfono',
      direccion: formData.direccion.trim() || 'Domicilio no informado',
      zonaCobro: Number(formData.zonaCobro),
      categoria: categoryPreview.isCadete ? 'CADETE' : 'ACTIVO',
      estado: 'ACTIVO',
      fechaNacimiento: formData.fechaNacimiento,
      fechaAlta: hoyStr,
      fechaIngreso: hoyStr,
      esTitularFamilia: false,
      familiares: [],
      actividadesIds: formData.actividadInteresId ? [formData.actividadInteresId] : [],
    });

    setFormSubmittedSuccess({
      nombre: formData.nombreCompleto.trim(),
      dni: formData.dni.trim(),
      categoria: categoryPreview.label,
      cuota: categoryPreview.fee,
      zona: getNombreZona(Number(formData.zonaCobro)),
    });

    setFormData({
      nombreCompleto: '',
      dni: '',
      email: '',
      telefono: '',
      direccion: '',
      zonaCobro: 0,
      fechaNacimiento: '2000-05-15',
      actividadInteresId: '',
    });
  };

  // Filtrado de Deportes
  const categoriesList = ['TODAS', 'Acuáticas', 'Fútbol', 'Básquetbol', 'Voleibol', 'Tenis', 'Gimnasia'];
  const filteredActivities = actividades.filter((act) => {
    if (selectedSportFilter === 'TODAS') return true;
    const catNorm = (act.categoria || (act as any).turno || '').toLowerCase();
    const nomNorm = (act.nombre || '').toLowerCase();
    const filtroNorm = selectedSportFilter.toLowerCase();
    return catNorm.includes(filtroNorm) || nomNorm.includes(filtroNorm);
  });

  // ✅ Opciones de zonas sin duplicados y usando zonaAsignada
  const zonasOpcionesForm = [
    {
      id: 0,
      label: 'Zona 0 - Sede Central (Pago por Ventanilla)',
      desc: 'Pago presencial en ventanilla del club',
    },
    ...[1, 2, 3].map((zonaNum) => {
      const cob = cobradores.find(
        (c) => Number(c.zonaAsignada ?? (c as any).zona) === zonaNum
      );
      const nombreCob = cob
        ? cob.nombreCompleto || `${cob.nombre || ''} ${cob.apellido || ''}`.trim()
        : 'Cobrador Asignado';
      return {
        id: zonaNum,
        label: `Zona ${zonaNum} - ${nombreCob}`,
        desc: `Cobranza domiciliaria a cargo de ${nombreCob}`,
      };
    }),
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* 1. SECCIÓN HERO */}
      <section
        id="hero-banner"
        className="relative -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 min-h-[580px] lg:min-h-[640px] flex items-center justify-center overflow-hidden border-b-4 border-[#C53030]"
      >
        <div className="absolute inset-0 z-0">
          <img
            src={clubHeroBg}
            alt="Campus e instalaciones deportivas Club El Globo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-[#1A365D]/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-600/20 via-transparent to-transparent opacity-60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-white w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-red-200 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#E53E3E] animate-pulse" />
              <span>Fundado en 1948 • Trayectoria y Pasión Deportiva</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white font-sans uppercase drop-shadow-sm">
              El Corazón Deportivo <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-200">
                y Social del Club
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-200 leading-relaxed font-normal max-w-2xl drop-shadow-xs">
              Bienvenido al Club Social y Deportivo <span className="font-bold text-white">"El Globo"</span>.
              Instalaciones climatizadas, canchas profesionales, actividades para todas las edades
              y un padrón sincronizado en tiempo real con nuestra base de datos.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              {!isLoggedIn ? (
                <a
                  href="#asociarse"
                  className="px-6 py-3.5 rounded-lg bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-red-900/40 flex items-center space-x-2 group"
                >
                  <span>¡Quiero ser Socio!</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              ) : currentUser?.role === 'SOCIO' ? (
                <button
                  onClick={() => setActiveTab('portal_socio')}
                  className="px-6 py-3.5 rounded-lg bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-red-900/40 flex items-center space-x-2 group cursor-pointer"
                >
                  <span>Mi Portal de Socio & Carnet</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : currentUser?.role === 'ADMIN' ? (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-6 py-3.5 rounded-lg bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-red-900/40 flex items-center space-x-2 group cursor-pointer"
                >
                  <span>Panel de Gestión Administrativa</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('cobranza')}
                  className="px-6 py-3.5 rounded-lg bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-red-900/40 flex items-center space-x-2 group cursor-pointer"
                >
                  <span>Cobranza & Rendición</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              <a
                href="#disciplinas"
                className="px-6 py-3.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium text-sm sm:text-base backdrop-blur-md border border-white/30 transition-all flex items-center space-x-2"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Ver Deportes & Horarios</span>
              </a>

              <button
                onClick={() => setShowDirectLogin(true)}
                className="px-5 py-3.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-200 hover:text-white font-medium text-xs sm:text-sm border border-slate-700 transition-all flex items-center space-x-2 cursor-pointer"
                title={
                  isLoggedIn
                    ? `Usuario conectado: ${currentUser?.nombreCompleto} (${currentUser?.role})`
                    : 'Acceder con usuarios de la BD'
                }
              >
                {isLoggedIn ? (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Conectado: {currentUser?.nombreCompleto?.split(' ')[0]}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-blue-400" />
                    <span>Acceso al Sistema BD</span>
                  </>
                )}
              </button>
            </div>

            {/* Métrica rápida */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/20">
              <div className="bg-slate-900/40 backdrop-blur-xs p-3 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl font-black text-white">Socios BD</div>
                <div className="text-xs text-slate-300 font-medium">Comunidad registrada</div>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-xs p-3 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl font-black text-red-400">{actividades.length}</div>
                <div className="text-xs text-slate-300 font-medium">Disciplinas deportivas</div>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-xs p-3 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl font-black text-amber-300">100</div>
                <div className="text-xs text-slate-300 font-medium">Casilleros individuales</div>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-xs p-3 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl font-black text-teal-300">{cobradores.length} Zonas</div>
                <div className="text-xs text-slate-300 font-medium">Cobranza domiciliaria</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BENEFICIOS Y PROPUESTA DE VALOR */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-1 text-[#C53030] font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>¿Por qué elegir El Globo?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase">
            Beneficios Exclusivos para Socios
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Disfrutá del deporte y la vida social con transparencia estatutaria conectada a la BD de MySQL.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <Waves className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Instalaciones de Primer Nivel</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Natatorio climatizado reglamentario, polideportivo cubierto de básquet y vóley, canchas de fútbol
              y tenis de polvo de ladrillo en constante mantenimiento.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-red-50 text-[#C53030] flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">100 Casilleros con Seguridad</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vestuarios renovados con 100 casilleros individuales con cerradura propia. Alquiler exclusivo para
              socios al día por un arancel mensual accesible de ${CASILLERO_MENSUAL_REF.toLocaleString('es-AR')}.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Plan Grupo Familiar</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bonificación estatutaria de ${DESCUENTO_HIJO_REF.toLocaleString('es-AR')} mensual por cada hijo menor
              de 18 años adherido al socio titular. Cuidamos la economía familiar.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Reconocimiento al Vitalicio</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Socios con más de 30 años ininterrumpidos en el club quedan 100% exentos de la cuota social como
              gratitud por su fidelidad e historia compartida.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Cobranza a Domicilio por Zonas</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cobradores domiciliarios oficiales asignados por zona recorren la ciudad con recibo troquelado
              oficial. También podés abonar en ventanilla de Sede Central.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Carnet Digital & Control API</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Portal del socio online con credencial digital y código QR para ingreso ágil, control de asistencia y
              sincronización directa con el servidor.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CATEGORÍAS Y VALORES DE CUOTA SOCIAL */}
      <section
        id="aranceles"
        className="relative overflow-hidden text-white p-8 sm:p-12 rounded-3xl shadow-2xl border border-slate-700/60"
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={clubArancelesBg}
            alt="Complejo polideportivo e instalaciones Club El Globo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/85 to-[#1A365D]/90 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-slate-950/60 to-black/75" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold uppercase tracking-widest backdrop-blur-xs mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            <span>Transparencia Estatutaria</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-1 uppercase tracking-tight text-white drop-shadow-md">
            Categorías de Socios y Aranceles Oficiales
          </h2>
          <p className="text-slate-200 text-xs sm:text-sm mt-2 max-w-2xl mx-auto drop-shadow-sm">
            Valores vigentes aprobados por Asamblea Ordinaria. Sin costos ocultos ni letras chicas.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Cadete */}
          <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-6 sm:p-7 border border-white/20 shadow-xl flex flex-col justify-between hover:border-teal-400/50 hover:bg-slate-900/95 transition-all">
            <div>
              <div className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span>Hasta 17 años inclusive</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">Socio Cadete</h3>
              <p className="text-xs text-slate-300 mt-1">
                Fomento deportivo para niños y adolescentes con acceso a escuelas formativas de iniciación.
              </p>

              <div className="my-6 p-4 rounded-xl bg-black/40 border border-white/10">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  ${CUOTA_CADETE_REF.toLocaleString('es-AR')}
                </span>
                <span className="text-xs text-slate-300 font-normal"> / mes</span>
                <span className="block text-[11px] text-teal-300/90 mt-1">Tarifa reducida institucional</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Acceso libre al club e instalaciones</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Inscripción a todas las escuelas formativas</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cobertura de seguro deportivo federado</span>
                </li>
              </ul>
            </div>

            {!isLoggedIn ? (
              <a
                href="#asociarse"
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold text-center block transition-colors border border-white/20 shadow-sm"
              >
                Asociar a un Menor
              </a>
            ) : (
              <button
                onClick={() => setActiveTab('socios')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold text-center block transition-colors border border-white/20 shadow-sm cursor-pointer"
              >
                Gestionar en Padrón
              </button>
            )}
          </div>

          {/* Activo */}
          <div className="bg-white/95 backdrop-blur-md text-slate-900 rounded-2xl p-6 sm:p-7 border-2 border-red-500 shadow-2xl relative flex flex-col justify-between transform md:-translate-y-3 hover:shadow-red-500/20 transition-all">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C53030] text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center space-x-1">
              <Trophy className="w-3 h-3 text-amber-300" />
              <span>Más Solicitado</span>
            </div>

            <div>
              <div className="text-xs font-bold text-[#C53030] uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C53030]" />
                <span>Desde los 18 años</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">Socio Activo</h3>
              <p className="text-xs text-slate-600 mt-1">
                Membresía plena con todos los derechos sociales, deportivos e institucionales.
              </p>

              <div className="my-6 p-4 rounded-xl bg-red-50/80 border border-red-200">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  ${CUOTA_ACTIVO_REF.toLocaleString('es-AR')}
                </span>
                <span className="text-xs text-slate-600 font-normal"> / mes</span>
                <span className="block text-[11px] text-[#C53030] font-semibold mt-1">
                  Apto para Plan Familiar (-$1.500/hijo)
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-[#C53030] shrink-0" />
                  <span className="font-semibold text-slate-900">Uso pleno de natatorio, gimnasio y canchas</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-[#C53030] shrink-0" />
                  <span>Prioridad en asignación de los 100 casilleros</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-[#C53030] shrink-0" />
                  <span>Voz y voto en asambleas estatutarias</span>
                </li>
              </ul>
            </div>

            {!isLoggedIn ? (
              <a
                href="#asociarse"
                className="mt-6 w-full py-3 px-4 rounded-xl bg-[#C53030] hover:bg-[#9B2C2C] text-white text-xs font-bold text-center block transition-all shadow-md hover:shadow-lg"
              >
                Asociarme Ahora
              </a>
            ) : (
              <button
                onClick={() => setActiveTab('portal_socio')}
                className="mt-6 w-full py-3 px-4 rounded-xl bg-[#C53030] hover:bg-[#9B2C2C] text-white text-xs font-bold text-center block transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                Ver Mi Estado de Socio
              </button>
            )}
          </div>

          {/* Vitalicio */}
          <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-6 sm:p-7 border border-white/20 shadow-xl flex flex-col justify-between hover:border-amber-400/50 hover:bg-slate-900/95 transition-all">
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>+30 Años Ininterrumpidos</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">Socio Vitalicio</h3>
              <p className="text-xs text-slate-300 mt-1">
                Homenaje estatutario a quienes forjaron el club con su lealtad comunitaria.
              </p>

              <div className="my-6 p-4 rounded-xl bg-black/40 border border-white/10">
                <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">$0</span>
                <span className="text-xs text-slate-300 font-normal"> / mes (Exento)</span>
                <span className="block text-[11px] text-amber-300/90 mt-1">100% bonificado de por vida</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Exención de cuota social vitalicia</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Acceso de honor a eventos y torneos oficiales</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 py-2.5 px-4 rounded-xl bg-amber-500/20 text-amber-200 text-xs font-medium text-center border border-amber-400/30">
              Categoría Automática por Antigüedad
            </div>
          </div>
        </div>
      </section>

      {/* 4. DISCIPLINAS DEPORTIVAS */}
      <section id="disciplinas" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1 text-[#C53030] font-bold text-xs uppercase tracking-wider mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Deportes y Actividades</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase">
              Disciplinas Federadas y Recreativas
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Entrenamientos guiados por profesores de educación física e instructores matriculados.
            </p>
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedSportFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedSportFilter === cat
                    ? 'bg-[#1A365D] text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0" />
            <span>
              {isLoggedIn ? (
                <>
                  <strong>Gestión Deportiva:</strong> Podés consultar la oferta deportiva conectada a la base de
                  datos de MySQL.
                </>
              ) : (
                <>
                  <strong>Reglamento Deportivo:</strong> La inscripción a actividades requiere estar registrado como
                  socio del club.
                </>
              )}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('actividades')}
            className="text-xs font-bold text-[#1A365D] hover:underline whitespace-nowrap cursor-pointer"
          >
            Ver Vitrina Deportiva →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((act) => {
            const cupoMax = Number(act.cupoMaximo || (act as any).cupo || 30);
            const cupoOcup = Number(act.cupoOcupado || (act as any).inscriptosCount || 0);
            const cupoDisponible = cupoMax - cupoOcup;
            const costoMensual = Number(act.costoMensual || act.arancel || 0);

            // ✅ Normalización de días y horarios compatibles con el esquema de BD
            const diasStr =
              act.diasSemana ||
              (Array.isArray(act.dias) ? act.dias.join(', ') : act.dias) ||
              'Días a coordinar';
            const horarioStr =
              act.horaInicio && act.horaFin
                ? `${act.horaInicio} a ${act.horaFin}`
                : act.horario || 'Horario a confirmar';

            return (
              <div
                key={act.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {act.categoria || (act as any).turno || 'Deporte'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cupoDisponible > 5
                          ? 'bg-emerald-100 text-emerald-800'
                          : cupoDisponible > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {cupoDisponible > 0 ? `${cupoDisponible} cupos libres` : 'Cupo Completo'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{act.nombre}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{act.descripcion}</p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{diasStr}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{horarioStr} hs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{act.lugar || 'Instalaciones del Club'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500">Arancel mensual:</span>
                    <p className="text-base font-black text-[#1A365D]">
                      ${costoMensual.toLocaleString('es-AR')}
                      <span className="text-[10px] font-normal text-slate-500"> /mes</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('actividades')}
                    className="px-3 py-1.5 rounded-md bg-[#1A365D] hover:bg-[#2B6CB0] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. FORMULARIO DE ALTA ONLINE */}
      {!isLoggedIn && (
        <section
          id="asociarse"
          className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="px-3 py-1 rounded-full bg-red-100 text-[#C53030] text-xs font-black uppercase tracking-wider">
                Solicitud de Admisión Online
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 uppercase">
                Completá tu Solicitud de Ingreso (BD)
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1">
                Ingresá tus datos para darte de alta en la base de datos de MySQL del club.
              </p>
            </div>

            {formSubmittedSuccess && (
              <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-300 rounded-xl animate-in fade-in zoom-in-95">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-emerald-950">
                      ¡Felicitaciones, {formSubmittedSuccess.nombre}!
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Tu solicitud fue asentada correctamente en la base de datos como
                      <strong> {formSubmittedSuccess.categoria}</strong> asignado a
                      <strong> {formSubmittedSuccess.zona}</strong>.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => setFormSubmittedSuccess(null)}
                        className="px-4 py-2 bg-emerald-700 text-white rounded-md text-xs font-bold hover:bg-emerald-800 cursor-pointer"
                      >
                        Inscribir a otro socio
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nombre y Apellido Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Lucía Martínez"
                    value={formData.nombreCompleto}
                    onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    DNI / Documento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 38450192"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    placeholder="(03482) 15-442200"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fechaNacimiento}
                    onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Categorización: <strong className="text-slate-800">{categoryPreview.label}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Dirección / Domicilio
                  </label>
                  <input
                    type="text"
                    placeholder="Calle y número de puerta"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Zona de Cobro Preferida
                  </label>
                  <select
                    value={formData.zonaCobro}
                    onChange={(e) => setFormData({ ...formData, zonaCobro: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    {zonasOpcionesForm.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Deporte de Interés (Opcional)
                  </label>
                  <select
                    value={formData.actividadInteresId}
                    onChange={(e) => setFormData({ ...formData, actividadInteresId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Solo Cuota Social (Sin disciplina adicional)</option>
                    {actividades.map((act) => (
                      <option key={act.id} value={act.id}>
                        {act.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 text-center sm:text-left">
                  Al enviar tu solicitud, aceptas el Estatuto Oficial del Club Social y Deportivo "El Globo".
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Confirmar y Registrarme en la BD
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* 6. CONTENIDO INFORMATIVO Y SEDE */}
      <section className="bg-slate-200/70 rounded-2xl p-6 sm:p-8 border border-slate-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#1A365D] text-white flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Sede Central y Secretaría</h4>
              <p className="text-xs text-slate-600 mt-0.5">Av. San Martín 1420, Ciudad Deportiva</p>
              <p className="text-[11px] text-slate-500">Cobro por ventanilla: Lunes a Viernes 08:00 a 20:00 hs</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#C53030] text-white flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Teléfonos & Urgencias</h4>
              <p className="text-xs text-slate-600 mt-0.5">Línea Fija: (03482) 420-1928</p>
              <p className="text-[11px] text-slate-500">Guardia & WhatsApp Socios: +54 9 3482 60-1928</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Secretaría y Deportes</h4>
              <p className="text-xs text-slate-600 mt-0.5">contacto@clubelglobo.com.ar</p>
              <p className="text-[11px] text-slate-500">Consultas de aranceles y aptos médicos</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. MODAL DE CAMBIO DE SESIÓN CON USUARIOS DE LA BD */}
      {showDirectLogin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#1A365D] text-white p-4 flex items-center justify-between border-b-2 border-[#C53030]">
              <div className="flex items-center space-x-2">
                <LogIn className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">Acceso al Sistema BD (RBAC)</h3>
              </div>
              <button
                onClick={() => setShowDirectLogin(false)}
                className="text-white/70 hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Seleccioná un usuario activo en la base de datos de MySQL para iniciar sesión:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {usersList.length === 0 ? (
                  <p className="text-center text-slate-400 italic py-4">
                    Cargando lista de usuarios de la base de datos...
                  </p>
                ) : (
                  usersList.map((u) => {
                    const nombreStr = u.nombreCompleto || u.email;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          // ✅ Reemplazo de quickSwitchUser usando setCurrentUser del contexto
                          setCurrentUser(u);
                          showToast('success', `Sesión iniciada como ${nombreStr}`);
                          setShowDirectLogin(false);
                        }}
                        className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">{nombreStr}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1A365D] text-white uppercase">
                          {u.role}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowDirectLogin(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};