/**
 * LocaleEngine — render-path localization (English / Spanish).
 *
 * IMPORTANT: this engine deliberately performs NO DOM mutation and uses NO
 * MutationObserver. Rewriting text nodes under a React-rendered tree is the
 * classic "Google-Translate-crashes-React" bug (removeChild / hydration
 * errors). Instead, translations flow through React's own render: components
 * call `t(text)`; misses are fetched from the secure /api/translate proxy,
 * cached, and surfaced via a change notification so React re-renders.
 *
 * Lookups are keyed by the English source string, so wiring a component is
 * just `t('Book Inspection')` — no separate key namespace to maintain.
 */
import { emitDiversityEvent } from './telemetry'

export type Locale = 'en' | 'es'

export const LOCALE_STORAGE_KEY = 'psi-locale'
const CACHE_STORAGE_KEY = 'psi-locale-cache-2026-09-psi-idc'
const SUPPORTED: Locale[] = ['en', 'es']

export type LocaleDictionary = Partial<Record<Locale, Record<string, string>>>

/** Seed dictionary — instant, offline coverage of high-visibility strings.
 *  Anything not listed here falls through to the Google Translation proxy.
 *
 *  MAINTENANCE WARNING: keys must match the English source string in the
 *  component BYTE-FOR-BYTE (punctuation, em-dashes, &amp; entities, casing).
 *  If you edit ANY user-visible English copy, check whether it has a key here
 *  and update the key to match — otherwise that string silently reverts to
 *  machine translation and nobody gets an error. ~175 hand-vetted entries as
 *  of 2026-07-31 (adversarially reviewed). */
const DEFAULT_DICTIONARY: LocaleDictionary = {
  es: {
    "Standard Sewer Scope": "Inspección estándar de alcantarillado",
    "Standard Inspection": "Inspección estándar",
    "One-Business-Day Response": "Respuesta en un día hábil",
    "No Purchase Required": "No es necesario comprar",
    "Can you help with cleaning, repairs, or next-step recommendations?": "¿Pueden ayudar con limpieza, reparaciones o recomendaciones sobre los próximos pasos?",
    "PSI provides inspections, clear reporting, and separately approved hydro jetting. Our sister company, Indiana Drain Company, is the service arm of our shared team, offering cleaning, maintenance, and qualifying repair services. Contractor recommendations are available only when you ask and follow your needs: if IDC is not the right fit, it will not be our recommendation. You can choose IDC, another provider, or no additional service. Your findings do not depend on that choice.": "PSI ofrece inspecciones, informes claros e hidrojetado aprobado por separado. Nuestra empresa hermana, Indiana Drain Company, es el área de servicios de nuestro equipo y ofrece limpieza, mantenimiento y reparaciones dentro de su alcance. Solo recomendamos contratistas cuando usted lo solicita y según sus necesidades: si IDC no es la opción adecuada, no la recomendaremos. Puede elegir IDC, otro proveedor o ningún servicio adicional. Los resultados de su inspección no dependen de esa decisión.",
    "What if cleaning is needed to complete my inspection?": "¿Qué sucede si hace falta limpiar para completar la inspección?",
    "If an obstruction limits the camera, we explain what is visible and whether cleaning or hydro jetting could help. We explain the scope and price separately and proceed only with your approval. If you decline, we document the accessible portions and the inspection limitation. Cleaning does not guarantee that every section can be reached or that an underlying defect is repaired.": "Si una obstrucción limita la cámara, explicamos lo que se puede ver y si la limpieza o el hidrojetado podrían ayudar. Explicamos el alcance y el precio por separado y procedemos solo con su aprobación. Si no acepta, documentamos las partes accesibles y la limitación de la inspección. La limpieza no garantiza el acceso a todos los tramos ni la reparación de un defecto subyacente.",
    "Clear answers. A clearer way forward.": "Respuestas claras. Un camino más claro para seguir.",
    "Start with PSI for clear findings.": "Comience con PSI para obtener resultados claros.",
    "Turn to IDC for the next step.": "Acuda a IDC para el siguiente paso.",
    "Precision Sewer Inspections and Indiana Drain Company are sister companies under shared ownership. Together, we connect careful inspection and clear reporting with practical help when you want it.": "Precision Sewer Inspections e Indiana Drain Company son empresas hermanas que comparten propietarios. Juntas conectamos una inspección cuidadosa e informes claros con ayuda práctica cuando usted la desea.",
    "Residential and commercial drain and sewer inspections, household and pool pump inspections, and other ordinary liquid lines within our equipment and expertise. PSI also offers separately approved hydro jetting, written reports, and free video second opinions. We explain what we observe and what we cannot confirm. Highly specialized systems require a suitable specialist.": "Inspecciones de drenajes y alcantarillado residencial y comercial, bombas domésticas y de piscina, y otras tuberías comunes de líquidos dentro de nuestra capacidad y experiencia. PSI también ofrece hidrojetado aprobado por separado, informes escritos y segundas opiniones gratuitas sobre videos. Explicamos lo que observamos y lo que no podemos confirmar. Los sistemas altamente especializados requieren un especialista adecuado.",
    "Indiana Drain Company is the service arm of our shared team: drain cleaning, hydro jetting, pump cleaning, maintenance, and qualifying repair work. IDC confirms the service, location, access requirements, and price before you authorize work. A recommendation depends on your needs, not our shared ownership.": "Indiana Drain Company es el área de servicios de nuestro equipo: limpieza de drenajes, hidrojetado, limpieza de bombas, mantenimiento y reparaciones dentro de su alcance. IDC confirma el servicio, la ubicación, los requisitos de acceso y el precio antes de que usted autorice el trabajo. Una recomendación depende de sus necesidades, no de que compartamos propietarios.",
    "Clear answers.": "Respuestas claras.",
    "A clearer way forward.": "Un camino más claro para seguir.",
    "Sewer Inspections · Central Indiana": "Inspecciones de alcantarillado · Centro de Indiana",
    "Video evidence. Clear reporting. Your next step.": "Evidencia en video. Informes claros. Su próximo paso.",
    "Book an Inspection": "Reservar una inspección",
    "Explore Drain & Pump Services": "Ver servicios de drenaje y bombas",
    "Inspection Findings First": "Primero, los resultados de la inspección",
    "You Choose the Next Step": "Usted elige el próximo paso",
    "Video Evidence": "Evidencia en video",
    "Standard Cleanout Scope": "Inspección con acceso estándar",
    "Local Service Areas": "Áreas de servicio locales",
    "Guidance When You Ask": "Orientación cuando la solicite",
    "Free Video Second Opinion": "Segunda opinión gratuita sobre su video",
    "Free Sewer Video Second Opinion": "Segunda opinión gratuita sobre video de alcantarillado",
    "Next-Step Guidance When You Ask": "Orientación sobre los próximos pasos cuando la solicite",
    "Additional Work Only With Your Approval": "Trabajo adicional solo con su aprobación",
    "One-Business-Day Report Delivery": "Entrega del informe en un día hábil",
    "Good service starts with understanding.": "Un buen servicio comienza con comprender.",
    "The same care, from understanding the problem to addressing it.": "El mismo cuidado, desde comprender el problema hasta solucionarlo.",
    "How Inspection & Service Work Together": "Cómo se relacionan la inspección y el servicio",
    "Explore Indiana Drain Company": "Conozca Indiana Drain Company",
    "One local team. Two focused brands.": "Un equipo local. Dos marcas especializadas.",
    "Your findings. Your choice.": "Sus resultados. Su decisión.",
    "Get a Free Video Second Opinion": "Obtenga una segunda opinión gratuita sobre su video",
    "PSI + Indiana Drain Company: inspection and service, connected.": "PSI + Indiana Drain Company: inspección y servicio conectados.",
    "An inspection gives you the information to make a decision. Sometimes that is all you need. Sometimes you want help putting that information to work.": "Una inspección le da la información para decidir. A veces eso es todo lo que necesita. Otras veces desea ayuda para actuar con esa información.",
    "Bringing PSI and Indiana Drain Company together connects clear inspection findings with practical service options. PSI documents and explains what we find. Our sister company provides the next step when you choose it.": "La unión de PSI e Indiana Drain Company conecta resultados claros con opciones prácticas de servicio. PSI documenta y explica lo que encontramos. Nuestra empresa hermana ofrece el siguiente paso cuando usted lo elige.",
    "Understand what is happening below the surface with video evidence, clear reporting, and straightforward explanations. Through our sister company, Indiana Drain Company, that same approach now extends to cleaning, maintenance, and repair services when you want help taking the next step.": "Comprenda lo que ocurre bajo la superficie con evidencia en video, informes claros y explicaciones sencillas. A través de nuestra empresa hermana, Indiana Drain Company, ese enfoque también abarca limpieza, mantenimiento y reparaciones cuando desea ayuda para dar el siguiente paso.",
    "Our findings reflect what we observe, whether or not you choose additional service. Guidance is available when you ask, and any work is separately quoted and approved.": "Nuestros resultados reflejan lo observado, contrate o no servicios adicionales. Hay orientación disponible cuando la solicita; cualquier trabajo se cotiza y aprueba por separado.",
    "I would like optional next-step recommendations if the review identifies a concern.": "Deseo recibir recomendaciones opcionales sobre los próximos pasos si la revisión identifica un problema.",
    "PSI and Indiana Drain Company are sister companies. If you request guidance, we can discuss IDC services where appropriate. Any work is quoted and approved separately.": "PSI e Indiana Drain Company son empresas hermanas. Si solicita orientación, podemos hablar de servicios de IDC cuando corresponda. Todo trabajo se cotiza y aprueba por separado.",
    "Next-step recommendations are available when you ask": "Puede solicitar recomendaciones sobre los próximos pasos",
    "No purchase is required; you may choose any service provider": "No es necesario comprar ningún servicio; puede elegir cualquier proveedor",
    "View Sample Report": "Ver informe de ejemplo",
    // Header / nav
    Services: 'Servicios',
    Pricing: 'Precios',
    'Utility Locating': 'Localización de Servicios',
    About: 'Acerca de',
    FAQ: 'Preguntas Frecuentes',
    Contact: 'Contacto',
    'Book Inspection': 'Reservar Inspección',
    // Hero
    "Central Indiana's Trusted Choice": 'La Opción de Confianza del Centro de Indiana',
    'See Sample Footage': 'Ver Video de Muestra',
    'Google Rating': 'Calificación de Google',
    'Hour Delivery': 'Entrega en Horas',
    'Hidden Fees': 'Tarifas Ocultas',
    // Hero — claims, CTAs, trust badges
    "See What's Really In Your": 'Vea lo Que Realmente Hay en Sus',
    Pipes: 'Tuberías',
    'Business-Day Reports': 'Informes en Días Hábiles',
    'Indiana Areas Served': 'Zonas de Indiana Atendidas',
    'InterNACHI Member': 'Miembro de InterNACHI',
    'Fully Insured': 'Totalmente Asegurado',
    // Why Choose Us — trust block
    'Why Choose Us': 'Por Qué Elegirnos',
    'The Difference is in the Details': 'La Diferencia Está en los Detalles',
    "We built Precision Sewer Inspections around one simple principle: give people the truth, and they'll make smart decisions.":
      'Creamos Precision Sewer Inspections en torno a un principio simple: Darle la verdad a la gente, y esta tomará decisiones acertadas.',
    'Evidence You Can See': 'Evidencia Que Puede Ver',
    "We don't just tell you what we found—we show you. Every inspection includes HD video you can watch, pause, and share.":
      'No solo le contamos lo que encontramos: se lo mostramos. Cada inspección incluye video en HD que puede ver, pausar y compartir.',
    'Answers in One Business Day': 'Respuestas en Un Día Hábil',
    "We know timing matters, especially in real estate transactions. That's why we deliver your video and report within one business day.":
      'Sabemos que el tiempo importa, especialmente en transacciones de bienes raíces. Por eso entregamos su video e informe dentro de un día hábil.',
    'Decide with Confidence': 'Decida con Confianza',
    'Every inspection includes video evidence and a structured evaluation—real evidence and honest findings to help you make informed decisions.':
      'Cada inspección incluye evidencia en video y una evaluación estructurada: evidencia real y hallazgos honestos para ayudarle a tomar decisiones informadas.',
    // How It Works — steps
    'How It Works': 'Cómo Funciona',
    'Simple, Fast, Transparent': 'Simple, Rápido, Transparente',
    "From booking to report delivery, we've streamlined every step so you can focus on what matters.":
      'Desde la reserva hasta la entrega del informe, hemos simplificado cada paso para que pueda concentrarse en lo que importa.',
    "Pick your time, share your address, and you're done. No phone calls, no voicemail tag.":
      'Elija su horario, comparta su dirección y listo. Sin llamadas telefónicas, sin ir y venir de mensajes de voz.',
    'On Time Inspections': 'Inspecciones Puntuales',
    'Our inspector arrives on time with professional HD camera equipment.':
      'Nuestro inspector llega a tiempo con equipo profesional de cámara HD.',
    'See Your Video in One Business Day': 'Vea Su Video en Un Día Hábil',
    'Get a link to your HD video inspection plus a written report explaining everything.':
      'Reciba un enlace a su video de inspección en HD junto con un informe escrito que lo explica todo.',
    'Decide With Confidence': 'Decida con Confianza',
    'Armed with real evidence and honest findings, make informed decisions.':
      'Con evidencia real y hallazgos honestos en la mano, tome decisiones informadas.',
    // About — story, values, inspector, trust row
    'About Us': 'Acerca de Nosotros',
    'We Built This Company On One Simple Promise': 'Construimos Esta Empresa Sobre Una Promesa Simple',
    'Tell the truth, show the evidence, and let people make their own informed decisions.':
      'Decir la verdad, mostrar la evidencia y dejar que las personas tomen sus propias decisiones informadas.',
    'Our Story': 'Nuestra Historia',
    'Our Values': 'Nuestros Valores',
    "These aren't just words on a wall. They're the principles that guide every inspection we do.":
      'No son solo palabras en una pared. Son los principios que guían cada inspección que hacemos.',
    'Honesty Over Profit': 'Honestidad por Encima de las Ganancias',
    "We'd rather lose a sale than gain it through deception.": 'Preferimos perder una venta antes que ganarla con engaños.',
    'Evidence Over Opinion': 'Evidencia por Encima de la Opinión',
    "We show you what's there, not what we think you want to hear.":
      'Le mostramos lo que hay, no lo que creemos que usted quiere escuchar.',
    'Speed Without Sacrifice': 'Rapidez Sin Sacrificio',
    'Fast delivery, never at the expense of quality.': 'Entrega rápida, nunca a costa de la calidad.',
    'Education Over Fear': 'Educación por Encima del Miedo',
    "We explain what we find, we don't scare you into action.": 'Le explicamos lo que encontramos; no lo asustamos para que actúe.',
    'The Inspector': 'El Inspector',
    'Trust & Verification': 'Confianza y Verificación',
    "Inspections to InterNACHI's Published Sewer Scope Standards of Practice":
      'Inspecciones Conforme a las Normas de Práctica para Inspección de Alcantarillado con Cámara Publicadas por InterNACHI',
    'Ready to Work With Us?': '¿Listo para Trabajar con Nosotros?',
    'Experience the difference that honest, evidence-based inspections can make.':
      'Experimente la diferencia que pueden hacer las inspecciones honestas basadas en evidencia.',
    'Book Your Inspection': 'Reserve Su Inspección',
    // Pricing — tiers, access methods, fees, volume packages
    'Transparent Pricing': 'Precios Transparentes',
    'Clear, Upfront Pricing': 'Precios Claros y por Adelantado',
    "Premium reporting quality with transparent pricing. Know exactly what you'll pay before we arrive.":
      'Informes de calidad superior con precios transparentes. Sepa exactamente lo que pagará antes de que lleguemos.',
    'Free Expert Opinion': 'Opinión de Experto Gratuita',
    '/ review': '/ revisión',
    'Free Service': 'Servicio Gratuito',
    'No-Jargon Explanation of Findings': 'Explicación de Hallazgos sin Jerga',
    'Report Reviewed if Provided': 'Revisión del Informe si lo Proporciona',
    '24-Hour Response': 'Respuesta en 24 Horas',
    'Submit Video': 'Enviar Video',
    'Early Adopter': 'Cliente Pionero',
    'Limited Time Launch Pricing': 'Precio de Lanzamiento por Tiempo Limitado',
    'per inspection (cleanout access)': 'por inspección (acceso por punto de limpieza)',
    'Limited Time': 'Tiempo Limitado',
    'HD Video Recording': 'Grabación de Video en HD',
    'HD images and factual summary with no jargon': 'Imágenes en HD y resumen objetivo sin jerga',
    'One-Business-Day Delivery': 'Entrega en Un Día Hábil',
    'Standard Cleanout Access': 'Acceso Estándar por Punto de Limpieza',
    'Phone Consultation': 'Consulta Telefónica',
    'Book Now': 'Reserve Ahora',
    'Volume Packages': 'Paquetes por Volumen',
    'Brokerages & Investors': 'Inmobiliarias e Inversionistas',
    '10+ Scope Prepaid Bundles': 'Paquetes Prepago de 10+ Inspecciones',
    'Per-Scope Discounts': 'Descuentos por Inspección',
    'Priority Scheduling': 'Programación Prioritaria',
    'Dedicated Account Support': 'Soporte Dedicado para Su Cuenta',
    'Annual Package Options': 'Opciones de Paquetes Anuales',
    'Get Quote': 'Solicitar Cotización',
    'Access Method Pricing': 'Precios Según el Método de Acceso',
    'Price varies by access type. Please confirm access availability before your appointment to avoid delays or additional charges.':
      'El precio varía según el tipo de acceso. Confirme la disponibilidad del acceso antes de su cita para evitar retrasos o cargos adicionales.',
    'Outdoor or indoor cleanout — fastest access method': 'Punto de limpieza exterior o interior: el método de acceso más rápido',
    'Multiple Cleanouts': 'Múltiples Puntos de Limpieza',
    'Additional cleanout inspections performed on-site': 'Inspecciones adicionales de puntos de limpieza realizadas en el sitio',
    'Roof Vent Access': 'Acceso por el Tubo de Venteo del Techo',
    'Camera entry via plumbing vent on roof': 'Entrada de la cámara por el tubo de venteo de la plomería en el techo',
    'Toilet Pull & Reset': 'Retiro y Reinstalación del Inodoro',
    'Includes new wax ring and supply line — reusing supply lines is the #1 cause of post-inspection leaks':
      'Incluye anillo de cera y línea de suministro nuevos: reutilizar las líneas de suministro es la causa número 1 de fugas después de la inspección',
    'Clean-Out Cap Replacement': 'Reemplazo de la Tapa de Limpieza',
    'Cut out and replace damaged or inaccessible cleanout cap': 'Se corta y reemplaza la tapa de limpieza dañada o inaccesible',
    'Crawl Space Access': 'Acceso por Espacio de Arrastre',
    'Additional fee for crawl space entry': 'Cargo adicional por entrar al espacio de arrastre',
    'Trip Fee': 'Cargo por Visita',
    'Charged on a case-by-case basis when access to the sewer system is unavailable, incorrect information was provided, or no one is home at the scheduled time':
      'Se cobra caso por caso cuando no hay acceso al sistema de alcantarillado, se proporcionó información incorrecta o no hay nadie en casa a la hora programada',
    'Important Access Information': 'Información Importante sobre el Acceso',
    "Some older systems may have buried or hard-to-locate clean-outs that require additional effort. If access cannot be established after reasonable effort, alternative access methods or additional charges may apply. We'll always discuss options with you before proceeding.":
      'Algunos sistemas antiguos pueden tener puntos de limpieza enterrados o difíciles de localizar que requieren esfuerzo adicional. Si no se puede establecer el acceso después de un esfuerzo razonable, pueden aplicarse métodos de acceso alternativos o cargos adicionales. Siempre conversaremos las opciones con usted antes de proceder.',
    'Same-Day Delivery Option': 'Opción de Entrega el Mismo Día',
    'Multi-Family Properties': 'Propiedades Multifamiliares',
    'Discounted rates for duplexes, triplexes, and apartment buildings.':
      'Tarifas con descuento para dúplex, tríplex y edificios de apartamentos.',
    'First Unit': 'Primera Unidad',
    'Standard inspection rate': 'Tarifa estándar de inspección',
    'Each Additional Unit': 'Cada Unidad Adicional',
    'When using the same access point': 'Cuando se usa el mismo punto de acceso',
    'Call for Pricing': 'Llame para Precios',
    'Step 01': 'Paso 01',
    'Step 02': 'Paso 02',
    'Step 03': 'Paso 03',
    'Step 04': 'Paso 04',
    'Secondary Services': 'Servicios Secundarios',
    'Supporting work that makes your inspection better — offered alongside the scope, never instead of it.': 'Trabajo de apoyo que mejora su inspección — ofrecido junto con la inspección, nunca en lugar de ella.',
    'Hydro Jetting': 'Hidrojetado',
    'Clears the way for a proper scope': 'Despeja el Camino para una Inspección Completa',
    'Roots, grease, and scale can stop the camera before it reaches the real problem. When a line needs it, we jet it first — so your inspection covers the whole pipe, not just the first few feet.': 'Las raíces, la grasa y las incrustaciones pueden detener la cámara antes de llegar al problema real. Cuando una línea lo necesita, la limpiamos primero — para que su inspección cubra toda la tubería, no solo los primeros pies.',
    'Priced with your inspection': 'Cotizado Junto con su Inspección',
    'Private Utility Locating': 'Localización de Servicios Privados',
    'Electronic line tracing & depth measurement': 'Trazado Electrónico de Líneas y Medición de Profundidad',
    'Dog fence wires, irrigation lines, and other private utilities — located and marked before anyone digs.': 'Cables de cercas para perros, líneas de riego y otros servicios privados — localizados y marcados antes de que alguien excave.',
    'Learn more': 'Más Información',
    'Do you offer hydro jetting?': '¿Ofrecen hidrojetado?',
    'Yes — as preparation for a proper inspection. Roots, grease, and scale can stop the camera before it reaches the real problem, so when a line needs it, we jet it first. That way your scope covers the whole pipe, not just the first few feet. Jetting is priced with your inspection.': 'Sí — como preparación para una inspección adecuada. Las raíces, la grasa y las incrustaciones pueden detener la cámara antes de llegar al problema real, así que cuando una línea lo necesita, la limpiamos primero. Así su inspección cubre toda la tubería, no solo los primeros pies. El hidrojetado se cotiza junto con su inspección.',
    "We run three professional camera scope systems, matched to the job. Our high-end system carries an electronic locator and sonde transmitter — that lets us pinpoint the camera's exact underground location and depth from the surface. Every system records high-definition video for your report.": 'Utilizamos tres sistemas profesionales de inspección con cámara, según el trabajo. Nuestro sistema de alta gama cuenta con un localizador electrónico y un transmisor sonda — eso nos permite ubicar la posición y profundidad exactas de la cámara bajo tierra desde la superficie. Cada sistema graba video de alta definición para su informe.',
    'Prepaid Volume Packages': 'Paquetes Prepago por Volumen',
    'Brokerage and investor packages with cost savings and priority scheduling. Purchase upfront and save on every scope.':
      'Paquetes para inmobiliarias e inversionistas con ahorros y programación prioritaria. Compre por adelantado y ahorre en cada inspección.',
    '10-Scope Bundle': 'Paquete de 10 Inspecciones',
    'Prepaid package with discounted per-scope rate': 'Paquete prepago con tarifa de descuento por inspección',
    '~15% savings': '~15% de ahorro',
    'Priority scheduling': 'Programación prioritaria',
    'On time findings': 'Hallazgos a tiempo',
    '25-Scope Brokerage': 'Paquete Inmobiliario de 25 Inspecciones',
    'Ideal for active real estate teams': 'Ideal para equipos inmobiliarios activos',
    'Per-scope discounts': 'Descuentos por inspección',
    'Dedicated support': 'Soporte dedicado',
    Enterprise: 'Empresarial',
    'For high-volume investors (400-600+ scopes/year)': 'Para inversionistas de alto volumen (400-600+ inspecciones/año)',
    'Best per-scope rates': 'Las mejores tarifas por inspección',
    'Priority service': 'Servicio prioritario',
    'Account manager': 'Gerente de cuenta',
    'Purchase Volume Package': 'Comprar Paquete por Volumen',
    'Ready to Book?': '¿Listo para Reservar?',
    // Pricing preview (home)
    'Transparent Pricing, No Surprises': 'Precios Transparentes, Sin Sorpresas',
    'We believe in upfront, honest pricing. What you see is what you pay—no surprises.':
      'Creemos en precios honestos y por adelantado. Lo que ve es lo que paga: sin sorpresas.',
    'View Full Pricing Details': 'Ver Todos los Detalles de Precios',
    // Footer — badge row and links
    'Sewer Scope Inspection': 'Inspección de Alcantarillado con Cámara',
    'Commercial Inspections': 'Inspecciones Comerciales',
    'Real Estate Partners': 'Socios Inmobiliarios',
    Company: 'Empresa',
    'Resources & Blog': 'Recursos y Blog',
    'Support & Terms': 'Soporte y Términos',
    'Privacy Policy': 'Política de Privacidad',
    'Contact Us': 'Contáctenos',
    'Sewer Inspection Service Areas': 'Zonas de Servicio de Inspección de Alcantarillado',
    'View all areas': 'Ver todas las zonas',
    'All rights reserved.': 'Todos los derechos reservados.',
    'Serving all of Central Indiana with pride.': 'Sirviendo con orgullo a todo el centro de Indiana.',
    // Contact — booking headings and CTAs
    'Get Started': 'Comience Ahora',
    'Schedule your professional sewer inspection online or contact us for immediate assistance.':
      'Programe su inspección profesional de alcantarillado en línea o contáctenos para atención inmediata.',
    "Pick your date and time, confirm your details, and pay securely — you're scheduled instantly. No phone calls, no waiting on a callback.":
      'Elija su fecha y hora, confirme sus datos y pague de forma segura: queda programado al instante. Sin llamadas telefónicas, sin esperar a que le devuelvan la llamada.',
    'Contact Information': 'Información de Contacto',
    'Call Us': 'Llámenos',
    'Email Us': 'Escríbanos por Correo',
    'Service Area': 'Zona de Servicio',
    'Why Choose Us?': '¿Por Qué Elegirnos?',
    'HD Video & Written Report': 'Video en HD e Informe Escrito',
    'Available 7 Days a Week': 'Disponible los 7 Días de la Semana',
    // Toolbar
    Accessibility: 'Accesibilidad',
    'Accessibility & language options': 'Opciones de accesibilidad e idioma',
    Theme: 'Tema',
    Light: 'Claro',
    Dark: 'Oscuro',
    System: 'Sistema',
    Language: 'Idioma',
    English: 'Inglés',
    Spanish: 'Español',
    'Dyslexia-friendly text': 'Texto adaptado para dislexia',
    'Machine / agent mode': 'Modo máquina / agente',
    Close: 'Cerrar',
  },
}

export class LocaleEngine {
  private storageKey: string
  private locale: Locale
  private proxyEndpoint: string
  private dictionary: LocaleDictionary
  private cache: Record<string, string> = {} // key: `${locale}:${source}`
  private inFlight = new Map<string, Promise<string>>()
  private listeners = new Set<() => void>()

  constructor(
    config: {
      storageKey?: string
      proxyEndpoint?: string
      dictionary?: LocaleDictionary
    } = {}
  ) {
    this.storageKey = config.storageKey || LOCALE_STORAGE_KEY
    this.proxyEndpoint = config.proxyEndpoint || '/api/translate'
    this.dictionary = mergeDictionaries(DEFAULT_DICTIONARY, config.dictionary)
    // NOTE: default to 'en' here (not the stored value). The constructor runs
    // during React render on both server and client-first-render; reading
    // localStorage here would make the client render Spanish while the server
    // rendered English → hydration mismatch. The stored locale is adopted in
    // init(), which runs post-mount in an effect.
    this.locale = 'en'
  }

  getLocale(): Locale {
    return this.locale
  }

  /** Post-mount: adopt the persisted locale + cache and sync <html lang>. */
  init(): void {
    this.cache = this.readCache()
    this.locale = this.readStoredLocale()
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', this.locale)
    }
  }

  setLocale(locale: Locale): void {
    if (!SUPPORTED.includes(locale)) return
    this.locale = locale
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(this.storageKey, locale)
      } catch {
        // Storage blocked — best-effort persistence only; the locale still applies below.
      }
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', locale)
    }
    this.notify()

    emitDiversityEvent({
      event: 'locale_change',
      params: { locale_value: locale },
    })
  }

  /**
   * Synchronous lookup for the CURRENT locale. Returns the translated string
   * if known (seed dictionary or cache), else null. Never triggers I/O.
   */
  translateSync(source: string): string | null {
    if (this.locale === 'en') return source
    const fromDict = this.dictionary[this.locale]?.[source]
    if (fromDict) return fromDict
    const cached = this.cache[this.cacheKey(source)]
    return cached ?? null
  }

  /**
   * Resolve a translation, fetching from the proxy on a miss. Resolves to the
   * source text on any failure (graceful degradation). Populates the cache and
   * notifies listeners so React can re-render with the result.
   */
  async translateAsync(source: string): Promise<string> {
    if (this.locale === 'en' || !source.trim()) return source

    const sync = this.translateSync(source)
    if (sync !== null) return sync

    const key = this.cacheKey(source)
    const existing = this.inFlight.get(key)
    if (existing) return existing

    const promise = this.fetchTranslation(source, this.locale)
      .then((translated) => {
        const value = translated || source
        if (translated) {
          this.cache[key] = translated
          this.persistCache()
          this.notify()
        }
        return value
      })
      .catch(() => source)
      .finally(() => this.inFlight.delete(key))

    this.inFlight.set(key, promise)
    return promise
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  destroy(): void {
    this.listeners.clear()
    this.inFlight.clear()
  }

  // ---- internals ----

  private cacheKey(source: string): string {
    return `${this.locale}:${source}`
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn())
  }

  private async fetchTranslation(text: string, target: Locale): Promise<string | null> {
    try {
      const res = await fetch(this.proxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target, source: 'en' }),
      })
      if (!res.ok) return null
      const data = (await res.json()) as {
        translatedText?: string
        configured?: boolean
        degraded?: boolean
      }
      // A graceful-degradation fallback echoes the original English back with
      // HTTP 200 — never treat (or cache) it as a real translation.
      if (data.configured === false || data.degraded === true) return null
      // No trim: boundary whitespace is intentional — fragments like
      // "Call us at " sit next to links/spans and must keep their spaces.
      return data.translatedText || null
    } catch {
      return null
    }
  }

  private readStoredLocale(): Locale {
    if (typeof window === 'undefined') return 'en'
    try {
      const stored = window.localStorage.getItem(this.storageKey) as Locale | null
      return stored && SUPPORTED.includes(stored) ? stored : 'en'
    } catch {
      // Storage blocked (privacy mode / sandboxed iframe) — default to English.
      return 'en'
    }
  }

  private readCache(): Record<string, string> {
    if (typeof window === 'undefined') return {}
    try {
      const raw = window.localStorage.getItem(CACHE_STORAGE_KEY)
      return raw ? (JSON.parse(raw) as Record<string, string>) : {}
    } catch {
      return {}
    }
  }

  private persistCache(): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(this.cache))
    } catch {
      /* quota / private-mode — cache stays in memory only */
    }
  }
}

function mergeDictionaries(base: LocaleDictionary, extra?: LocaleDictionary): LocaleDictionary {
  if (!extra) return { ...base, es: { ...base.es } }
  const merged: LocaleDictionary = {}
  for (const locale of SUPPORTED) {
    merged[locale] = { ...(base[locale] || {}), ...(extra[locale] || {}) }
  }
  return merged
}
