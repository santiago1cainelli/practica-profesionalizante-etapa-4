import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  Heart,
  Lock,
  Compass,
  Award,
  ChevronRight,
  LogIn,
  UserCheck,
  Check,
  HelpCircle,
  Activity,
  Waves,
  Building,
} from 'lucide-react';
import { CUOTA_VALORES, ZONAS_NOMBRES } from '../data/mockData';

interface GuestHomeProps {
  onOpenLoginModal?: () => void;
}

export const GuestHome: React.FC<GuestHomeProps> = ({ onOpenLoginModal }) => {
  const { setActiveTab, actividades, addSocio, showToast, quickSwitchUser, currentUser } = useApp();
  const isLoggedIn = currentUser.role !== 'PUBLICO';

  // Registration Form State
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

  // Calculate age and category in real time for preview in the form
  const getCategoryPreview = (birthDate: string) => {
    if (!birthDate) return { label: 'Socio Activo', fee: CUOTA_VALORES.ACTIVO, isCadete: false };
    const hoy = new Date();
    const nac = new Date(birthDate);
    let age = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) age--;
    if (isNaN(age) || age < 0) age = 20;

    if (age < 18) {
      return {
        label: `Socio Cadete (${age} años)`,
        fee: CUOTA_VALORES.CADETE,
        isCadete: true,
      };
    }
    return {
      label: `Socio Activo (${age} años)`,
      fee: CUOTA_VALORES.ACTIVO,
      isCadete: false,
    };
  };

  const categoryPreview = getCategoryPreview(formData.fechaNacimiento);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombreCompleto.trim() || !formData.dni.trim() || !formData.email.trim()) {
      showToast('error', 'Campos incompletos', 'Por favor ingresa nombre, DNI y correo electrónico.');
      return;
    }

    const hoyStr = new Date().toISOString().split('T')[0];
    const success = addSocio({
      nombreCompleto: formData.nombreCompleto.trim(),
      dni: formData.dni.trim(),
      email: formData.email.trim(),
      telefono: formData.telefono.trim() || 'Sin teléfono',
      direccion: formData.direccion.trim() || 'Domicilio no informado',
      zonaCobro: Number(formData.zonaCobro),
      fechaNacimiento: formData.fechaNacimiento,
      fechaIngreso: hoyStr,
      esTitularFamilia: false,
      familiares: [],
      actividadesIds: formData.actividadInteresId ? [formData.actividadInteresId] : [],
    });

    if (success) {
      setFormSubmittedSuccess({
        nombre: formData.nombreCompleto,
        dni: formData.dni,
        categoria: categoryPreview.label,
        cuota: categoryPreview.fee,
        zona: ZONAS_NOMBRES[Number(formData.zonaCobro)].nombre,
      });

      // Clear fields
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
    }
  };

  // Filter activities
  const categoriesList = ['TODAS', 'Acuáticas', 'Fútbol', 'Básquetbol', 'Voleibol', 'Tenis', 'Gimnasia'];
  const filteredActivities = actividades.filter((act) => {
    if (selectedSportFilter === 'TODAS') return true;
    return act.categoria.toLowerCase().includes(selectedSportFilter.toLowerCase()) ||
           act.nombre.toLowerCase().includes(selectedSportFilter.toLowerCase());
  });

  return (
    <div className="space-y-16 pb-12">
      {/* 1. HERO SECTION WITH BACKGROUND IMAGE */}
      <section
        id="hero-banner"
        className="relative -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 min-h-[580px] lg:min-h-[640px] flex items-center justify-center overflow-hidden border-b-4 border-[#C53030]"
      >
        {/* Background Image with optimized loading and overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={clubHeroBg}
            alt="Campus e instalaciones deportivas Club El Globo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-700 hover:scale-105"
          />
          {/* Dual tone gradient overlay ensuring maximum legibility & branded atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-[#1A365D]/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/40" />
          {/* Subtle noise/grid ambient pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-600/20 via-transparent to-transparent opacity-60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-white w-full">
          <div className="max-w-3xl">
            {/* Historical Heritage Tag */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-red-200 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#E53E3E] animate-pulse" />
              <span>Fundado en 1928 • 98 Años de Trayectoria y Pasión</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white font-sans uppercase drop-shadow-sm">
              El Corazón Deportivo <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-200">
                y Social de la Ciudad
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-slate-200 leading-relaxed font-normal max-w-2xl drop-shadow-xs">
              Bienvenido al Club Social y Deportivo <span className="font-bold text-white">"El Globo"</span>. 
              Instalaciones olímpicas climatizadas, canchas profesionales, actividades para todas las edades 
              y un ambiente familiar con más de 1.200 socios activos.
            </p>

            {/* Primary Calls to Action */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              {!isLoggedIn ? (
                <a
                  href="#asociarse"
                  className="px-6 py-3.5 rounded-lg bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-red-900/40 flex items-center space-x-2 group"
                >
                  <span>¡Quiero ser Socio!</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              ) : currentUser.role === 'SOCIO' ? (
                <button
                  onClick={() => setActiveTab('portal_socio')}
                  className="px-6 py-3.5 rounded-lg bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-red-900/40 flex items-center space-x-2 group"
                >
                  <span>Mi Portal de Socio & Carnet</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : currentUser.role === 'ADMIN' ? (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-6 py-3.5 rounded-lg bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-red-900/40 flex items-center space-x-2 group"
                >
                  <span>Panel de Gestión Administrativa</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : currentUser.role === 'COBRADOR' ? (
                <button
                  onClick={() => setActiveTab('cobranza')}
                  className="px-6 py-3.5 rounded-lg bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-red-900/40 flex items-center space-x-2 group"
                >
                  <span>Cobranza & Rendición</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('asistencia')}
                  className="px-6 py-3.5 rounded-lg bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-red-900/40 flex items-center space-x-2 group"
                >
                  <span>Planilla de Asistencia</span>
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
                className="px-5 py-3.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-200 hover:text-white font-medium text-xs sm:text-sm border border-slate-700 transition-all flex items-center space-x-2"
                title={isLoggedIn ? `Usuario conectado: ${currentUser.nombreCompleto} (${currentUser.role})` : 'Acceder con credenciales de Socio, Cobrador, Instructor o Administrador'}
              >
                {isLoggedIn ? (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Conectado: {currentUser.nombreCompleto.split(' ')[0]}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-blue-400" />
                    <span>Acceso al Sistema</span>
                  </>
                )}
              </button>
            </div>

            {/* Fast Stats Bar under Hero */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/20">
              <div className="bg-slate-900/40 backdrop-blur-xs p-3 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl font-black text-white">1.250+</div>
                <div className="text-xs text-slate-300 font-medium">Socios en la comunidad</div>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-xs p-3 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl font-black text-red-400">6</div>
                <div className="text-xs text-slate-300 font-medium">Disciplinas deportivas</div>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-xs p-3 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl font-black text-amber-300">100</div>
                <div className="text-xs text-slate-300 font-medium">Casilleros individuales</div>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-xs p-3 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl font-black text-teal-300">4 Zonas</div>
                <div className="text-xs text-slate-300 font-medium">Cobranza domiciliaria</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION & STATUTORY BENEFITS */}
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
            Disfrutá del deporte, la recreación y la vida social con transparencia estatutaria y comodidad para toda la familia.
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
              socios al día por un arancel mensual accesible de ${CUOTA_VALORES.CASILLERO_MENSUAL.toLocaleString('es-AR')}.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Plan Grupo Familiar</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bonificación estatutaria de ${CUOTA_VALORES.DESCUENTO_FAMILIAR_POR_HIJO.toLocaleString('es-AR')} mensual por cada hijo menor de 18 años adherido al socio titular. Cuidamos la economía familiar.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Reconocimiento al Vitalicio</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Socios con más de 30 años ininterrumpidos en el club quedan 100% exentos de la cuota social como gratitud por su fidelidad e historia compartida.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Cobranza a Domicilio por Zonas</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              3 cobradores domiciliarios oficiales recorren Centro, Sur y Costanera con recibo troquelado oficial. También podés abonar en ventanilla de Sede Central.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Carnet Digital & Apto Médico</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Portal del socio online con credencial digital y código QR para ingreso ágil a molinetes, control de asistencia y verificación médica al día.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CATEGORÍAS Y VALORES DE CUOTA SOCIAL */}
      <section id="aranceles" className="relative overflow-hidden text-white p-8 sm:p-12 rounded-3xl shadow-2xl border border-slate-700/60">
        {/* Background Sports Club Image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={clubArancelesBg}
            alt="Complejo polideportivo e instalaciones Club El Globo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transform scale-105"
          />
          {/* Multi-layer atmospheric dark gradients for vibrant contrast and high legibility */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/85 to-[#1A365D]/90 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-slate-950/60 to-black/75" />
          {/* Vibrant sports ambient flare spots (Navy and Crimson) */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Section Header */}
        <div className="relative z-10 max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold uppercase tracking-widest backdrop-blur-xs mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            <span>Transparencia Estatutaria</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-1 uppercase tracking-tight text-white drop-shadow-md">
            Categorías de Socios y Aranceles Oficiales
          </h2>
          <p className="text-slate-200 text-xs sm:text-sm mt-2 max-w-2xl mx-auto drop-shadow-sm">
            Valores vigentes aprobados por Asamblea Ordinaria para la Temporada 2026. Sin costos ocultos ni letras chicas.
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
                  ${CUOTA_VALORES.CADETE.toLocaleString('es-AR')}
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
            ) : currentUser.role === 'SOCIO' ? (
              <button
                onClick={() => setActiveTab('portal_socio')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold text-center block transition-colors border border-white/20 shadow-sm"
              >
                Ver Mi Grupo Familiar
              </button>
            ) : currentUser.role === 'ADMIN' ? (
              <button
                onClick={() => setActiveTab('socios')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold text-center block transition-colors border border-white/20 shadow-sm"
              >
                Gestionar en Padrón
              </button>
            ) : null}
          </div>

          {/* Activo (Featured) */}
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
                  ${CUOTA_VALORES.ACTIVO.toLocaleString('es-AR')}
                </span>
                <span className="text-xs text-slate-600 font-normal"> / mes</span>
                <span className="block text-[11px] text-[#C53030] font-semibold mt-1">Apto para Plan Familiar (-$1.500/hijo)</span>
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
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-[#C53030] shrink-0" />
                  <span className="font-medium text-emerald-700">Descuento de $1.500 por cada hijo menor</span>
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
            ) : currentUser.role === 'SOCIO' ? (
              <button
                onClick={() => setActiveTab('portal_socio')}
                className="mt-6 w-full py-3 px-4 rounded-xl bg-[#C53030] hover:bg-[#9B2C2C] text-white text-xs font-bold text-center block transition-all shadow-md hover:shadow-lg"
              >
                Ver Mi Estado de Socio
              </button>
            ) : currentUser.role === 'ADMIN' ? (
              <button
                onClick={() => setActiveTab('socios')}
                className="mt-6 w-full py-3 px-4 rounded-xl bg-[#C53030] hover:bg-[#9B2C2C] text-white text-xs font-bold text-center block transition-all shadow-md hover:shadow-lg"
              >
                Administrar Padrón Socios
              </button>
            ) : null}
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
                <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                  $0
                </span>
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
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Aporte voluntario optativo ($2.500)</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 py-2.5 px-4 rounded-xl bg-amber-500/20 text-amber-200 text-xs font-medium text-center border border-amber-400/30">
              Categoría Automática por Antigüedad
            </div>
          </div>
        </div>
      </section>

      {/* 4. DISCIPLINAS DEPORTIVAS (CATÁLOGO PÚBLICO) */}
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

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedSportFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
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

        {/* Notice for Guests about sports enrollment */}
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0" />
            <span>
              {isLoggedIn ? (
                currentUser.role === 'SOCIO' ? (
                  <>
                    <strong>Reglamento Deportivo:</strong> Como socio activo del club, podés inscribirte a cualquiera de las actividades deportivas habilitadas desde tu portal o la vitrina deportiva.
                  </>
                ) : (
                  <>
                    <strong>Gestión Deportiva:</strong> Consulta de horarios, cupos y profesores de las 6 disciplinas federadas del club.
                  </>
                )
              ) : (
                <>
                  <strong>Reglamento Deportivo:</strong> La inscripción a actividades deportivas es de uso exclusivo para socios del club. Los invitados no pueden inscribir socios a actividades directamente; para anotarte, asóciate completando la solicitud o inicia sesión.
                </>
              )}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('actividades')}
            className="text-xs font-bold text-[#1A365D] hover:underline whitespace-nowrap"
          >
            Ver Vitrina Deportiva →
          </button>
        </div>

        {/* Sports Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((act) => {
            const cupoDisponible = act.cupoMaximo - act.cupoOcupado;
            return (
              <div
                key={act.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {act.categoria}
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
                      <span>{act.dias.join(', ')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{act.horario} hs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{act.lugar}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{act.instructorNombre}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500">Arancel adicional:</span>
                    <p className="text-base font-black text-[#1A365D]">
                      ${act.costoMensual.toLocaleString('es-AR')}
                      <span className="text-[10px] font-normal text-slate-500"> /mes</span>
                    </p>
                  </div>
                  {currentUser.role === 'SOCIO' ? (
                    <button
                      onClick={() => setActiveTab('actividades')}
                      className="px-3 py-1.5 rounded-md bg-[#1A365D] hover:bg-[#2B6CB0] text-white text-xs font-bold transition-colors"
                      title="Ir a vitrina deportiva para inscribirte"
                    >
                      Inscribirme (Mi Perfil)
                    </button>
                  ) : !isLoggedIn ? (
                    <a
                      href="#asociarse"
                      onClick={() => setFormData((prev) => ({ ...prev, actividadInteresId: act.id }))}
                      className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-red-50 text-[#C53030] text-xs font-bold transition-colors"
                      title="Asociarte al club seleccionando esta actividad"
                    >
                      Asociarme e Inscribirme
                    </a>
                  ) : (
                    <button
                      onClick={() => setActiveTab('actividades')}
                      className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[#1A365D] text-xs font-bold transition-colors"
                    >
                      Ver Cupos
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. FORMULARIO DE ALTA ONLINE / SOLICITUD DE INGRESO (SOLO VISIBLE PARA NO LOGUEADOS) */}
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
              Completá tu Solicitud de Ingreso
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Ingresá tus datos para darte de alta inmediatamente en el padrón del club. El sistema asignará 
              tu categoría oficial según tu fecha de nacimiento.
            </p>
          </div>

          {/* Success Banner if form was submitted */}
          {formSubmittedSuccess && (
            <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-300 rounded-xl animate-in fade-in zoom-in-95">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-emerald-950">
                    ¡Felicitaciones, {formSubmittedSuccess.nombre}!
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Tu solicitud fue procesada exitosamente. Ya formás parte del padrón de socios del Club El Globo 
                    como <strong>{formSubmittedSuccess.categoria}</strong> con una cuota base de 
                    <strong> ${formSubmittedSuccess.cuota.toLocaleString('es-AR')}/mes</strong> asignado a la 
                    <strong> {formSubmittedSuccess.zona}</strong>.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        // Switch to socio portal to test
                        quickSwitchUser('user-socio-activo');
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold transition-colors"
                    >
                      Ver Portal del Socio & Carnet Digital
                    </button>
                    <button
                      onClick={() => setFormSubmittedSuccess(null)}
                      className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 rounded-md text-xs font-medium hover:bg-emerald-100"
                    >
                      Inscribir a otro socio o familiar
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
                  Categorización: <strong className="text-slate-800">{categoryPreview.label}</strong> (Cuota base: ${categoryPreview.fee.toLocaleString('es-AR')})
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
                  <option value={0}>Zona 0 - Sede Central (Pago por Ventanilla)</option>
                  <option value={1}>Zona 1 - Centro & Barrio Norte (Roberto Gómez)</option>
                  <option value={2}>Zona 2 - Sur & Estación (Laura Méndez)</option>
                  <option value={3}>Zona 3 - Este & Costanera (Carlos Benítez)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ZONAS_NOMBRES[Number(formData.zonaCobro)].descripcion}
                </p>
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
                      {act.nombre} (+${act.costoMensual.toLocaleString('es-AR')})
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
                className="w-full sm:w-auto px-8 py-3 bg-[#C53030] hover:bg-[#9B2C2C] text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Confirmar y Registrarme como Socio
              </button>
            </div>
          </form>
        </div>
      </section>
      )}

      {/* 6. SEDE, HORARIOS Y CONTACTO */}
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

      {/* 7. QUICK LOGIN SIMULATOR MODAL (RBAC) */}
      {showDirectLogin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#1A365D] text-white p-4 flex items-center justify-between border-b-2 border-[#C53030]">
              <div className="flex items-center space-x-2">
                <LogIn className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">Acceso al Sistema (RBAC)</h3>
              </div>
              <button
                onClick={() => setShowDirectLogin(false)}
                className="text-white/70 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Seleccioná el perfil con el que deseas ingresar para probar las distintas funcionalidades del sistema según los roles del club:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    quickSwitchUser('user-socio-activo');
                    setShowDirectLogin(false);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">Socio del Club (Martín Rossi)</div>
                    <div className="text-[11px] text-slate-500">Carnet digital, QR, estado de cuotas y actividades</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">SOCIO</span>
                </button>

                <button
                  onClick={() => {
                    quickSwitchUser('user-cobrador-1');
                    setShowDirectLogin(false);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">Cobrador de Zona (Roberto Gómez)</div>
                    <div className="text-[11px] text-slate-500">Zona 1 Centro, emisión de recibos y rendición del 10%</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">COBRADOR</span>
                </button>

                <button
                  onClick={() => {
                    quickSwitchUser('user-instructor');
                    setShowDirectLogin(false);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">Instructor (Prof. Esteban Morales)</div>
                    <div className="text-[11px] text-slate-500">Planilla de asistencia y cupos deportivos</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white">INSTRUCTOR</span>
                </button>

                <button
                  onClick={() => {
                    quickSwitchUser('user-admin');
                    setShowDirectLogin(false);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">Administrador General (Lic. Claudia Lapenta)</div>
                    <div className="text-[11px] text-slate-500">Control total: padrón, casilleros, finanzas y morosidad</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-700 text-white">ADMIN</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowDirectLogin(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-md transition-colors"
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
