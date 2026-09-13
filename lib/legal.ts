import { publicEnv } from "@/lib/public-env";
import { formatPhoneForDisplay } from "@/lib/phone";

/**
 * Contenido de los documentos legales de la landing.
 *
 * Vive en `lib/` (no en `constants/`) siguiendo el mismo criterio que
 * `lib/json-ld.ts`: el texto se construye a partir de las variables de
 * entorno de la empresa (nombre, correo, WhatsApp, ciudad), de modo que
 * un cambio de dato de contacto no obliga a editar tres documentos a mano.
 *
 * El texto base proviene de `DOCUMENTO_BASE_LEGAL_INTEGRASOCIAL.docx`
 * (fuente de verdad entregada por el cliente). Las secciones sobre
 * cookies, analítica y datos técnicos se ajustaron a lo que la aplicación
 * hace realmente hoy —verificado en el código, no asumido— para no
 * declarar tecnologías que no están activas.
 *
 * El dominio definitivo aún no está definido: los documentos se refieren
 * al sitio como "esta Landing Page" a propósito, para no fijar una URL
 * que todavía no existe.
 */

export const LEGAL_VERSION = "1.0";
export const LEGAL_EFFECTIVE_DATE = "28 de agosto de 2026";

/**
 * Horario de atención: fuente única, consumida por los documentos legales
 * y por el Footer. Termina en "m." — no añadir un punto al interpolarlo.
 */
export const BUSINESS_HOURS = "Lunes a viernes, 8:00 a. m. a 6:00 p. m.";

/**
 * Ubicación física de la base de datos donde se almacenan las solicitudes
 * (Supabase, región sa-east-1). Es un hecho verificable, no una hipótesis:
 * la Política de Privacidad debe declararlo como transmisión internacional.
 */
export const DATABASE_LOCATION = "São Paulo (Brasil)";

export interface LegalDocumentMeta {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
}

export const LEGAL_DOCUMENTS: LegalDocumentMeta[] = [
  {
    slug: "/politica-de-privacidad",
    title: "Política de Privacidad y Tratamiento de Datos Personales",
    shortTitle: "Política de Privacidad",
    description:
      "Cómo recolectamos, usamos, almacenamos y protegemos tus datos personales, conforme a la Ley 1581 de 2012.",
  },
  {
    slug: "/terminos-y-condiciones",
    title: "Términos y Condiciones de Uso",
    shortTitle: "Términos y Condiciones",
    description:
      "Condiciones que regulan el acceso y uso de esta Landing Page y del cotizador.",
  },
  {
    slug: "/politica-de-cookies",
    title: "Política de Cookies",
    shortTitle: "Política de Cookies",
    description:
      "Qué cookies y tecnologías similares utiliza este sitio y cómo puedes administrarlas.",
  },
];

/** Bloques de contenido que sabe renderizar `LegalDocument`. */
export type LegalBlock =
  | { type: "text"; content: string }
  | { type: "subheading"; content: string }
  | { type: "list"; items: string[] }
  | { type: "note"; content: string };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

const company = publicEnv.NEXT_PUBLIC_COMPANY_NAME;
const email = publicEnv.NEXT_PUBLIC_EMAIL;
const whatsapp = publicEnv.NEXT_PUBLIC_PHONE
  ? formatPhoneForDisplay(publicEnv.NEXT_PUBLIC_PHONE)
  : undefined;
const city = publicEnv.NEXT_PUBLIC_ADDRESS_CITY ?? "Pereira";

/**
 * Datos de contacto del responsable. Se arma condicionalmente: si una
 * variable de entorno no está configurada, la línea simplemente no
 * aparece, en vez de imprimir un dato vacío o inventado.
 */
function contactLines(): string[] {
  return [
    `Nombre comercial: ${company}.`,
    // Solo ciudad + país: el departamento no está en ninguna variable de
    // entorno y hardcodearlo rompería si la ciudad cambia.
    `Ciudad: ${city}, Colombia.`,
    ...(email ? [`Correo electrónico: ${email}.`] : []),
    ...(whatsapp ? [`WhatsApp: ${whatsapp}.`] : []),
    `Horario de atención: ${BUSINESS_HOURS}`,
  ];
}

export function buildPrivacyPolicy(): LegalSection[] {
  return [
    {
      heading: "1. Introducción",
      blocks: [
        {
          type: "text",
          content: `En ${company} respetamos la privacidad y la protección de los datos personales de nuestros usuarios, clientes y visitantes.`,
        },
        {
          type: "text",
          content:
            "Esta Política de Privacidad establece la forma en que recolectamos, utilizamos, almacenamos, protegemos y tratamos los datos personales suministrados a través de esta Landing Page y demás canales de comunicación, de conformidad con la Ley Estatutaria 1581 de 2012, el Decreto 1377 de 2013 y las demás normas colombianas aplicables sobre protección de datos personales y Habeas Data.",
        },
        {
          type: "text",
          content:
            "Al diligenciar nuestro formulario de contacto, el usuario declara haber leído y aceptado las condiciones aquí descritas.",
        },
      ],
    },
    {
      heading: "2. Responsable del Tratamiento",
      blocks: [
        { type: "list", items: contactLines() },
        {
          type: "text",
          content: `${company} es responsable del tratamiento de los datos personales suministrados por los usuarios a través de esta plataforma.`,
        },
      ],
    },
    {
      heading: "3. Alcance de esta Política",
      blocks: [
        { type: "text", content: "Esta política aplica a:" },
        {
          type: "list",
          items: [
            "Visitantes de esta Landing Page.",
            "Personas que utilizan el cotizador en línea.",
            "Personas que diligencian el formulario de solicitud de asesoría.",
            "Personas interesadas en servicios de Salud (EPS), Pensión, ARL y Seguridad Social Integral.",
            `Usuarios que contactan a ${company} mediante WhatsApp desde este sitio.`,
            "Personas cuyos datos se almacenan para fines comerciales y de asesoría.",
          ],
        },
      ],
    },
    {
      heading: "4. Datos Personales que Recolectamos",
      blocks: [
        {
          type: "note",
          content:
            "El cotizador no solicita datos personales. Para calcular un valor aproximado únicamente se selecciona el servicio, el plan y la ciudad. Tus datos personales se recolectan solo si decides continuar y diligenciar el formulario de solicitud de asesoría.",
        },
        {
          type: "text",
          content:
            "Cuando diligencias el formulario de solicitud de asesoría podemos recolectar la siguiente información:",
        },
        { type: "subheading", content: "Datos de identificación" },
        {
          type: "list",
          items: [
            "Nombre completo.",
            "Número de documento, únicamente si decides suministrarlo (es un campo opcional).",
            "Ciudad de residencia.",
          ],
        },
        { type: "subheading", content: "Datos de contacto" },
        {
          type: "list",
          items: [
            "Número de teléfono, que se utiliza también como número de WhatsApp.",
            "Correo electrónico.",
          ],
        },
        { type: "subheading", content: "Datos relacionados con la solicitud" },
        {
          type: "list",
          items: [
            "Servicio de interés y tipo de afiliación.",
            "Plan seleccionado.",
            "Valor estimado de la cotización.",
            "Observaciones que suministres voluntariamente.",
          ],
        },
        { type: "subheading", content: "Datos técnicos y de auditoría" },
        {
          type: "text",
          content:
            "Al momento de enviar el formulario, nuestro servidor registra automáticamente:",
        },
        {
          type: "list",
          items: [
            "La dirección IP desde la que se envía la solicitud.",
            "El identificador del navegador (user agent), que indica el tipo de navegador, dispositivo y sistema operativo.",
            "La fecha y hora del envío.",
            "La fecha y hora en que otorgaste tu autorización para el tratamiento de datos.",
          ],
        },
        {
          type: "text",
          content:
            "Estos datos técnicos se conservan con fines de seguridad, prevención de envíos automatizados o fraudulentos y como evidencia de la autorización otorgada. No se utilizan para elaborar perfiles publicitarios ni se muestran públicamente.",
        },
        {
          type: "note",
          content: `No solicitamos información financiera, contraseñas ni datos bancarios a través de esta Landing Page. ${company} nunca te pedirá esa información por este medio.`,
        },
      ],
    },
    {
      heading: "5. Finalidad del Tratamiento",
      blocks: [
        {
          type: "text",
          content: "Los datos personales serán utilizados para:",
        },
        {
          type: "list",
          items: [
            "Brindar asesoría personalizada sobre afiliación a Salud, Pensión, ARL y Seguridad Social.",
            "Generar cotizaciones aproximadas.",
            "Contactar al usuario vía WhatsApp, llamada telefónica o correo electrónico.",
            "Gestionar y dar seguimiento comercial a las solicitudes recibidas.",
            "Verificar solicitudes duplicadas para evitar contactar dos veces por la misma petición.",
            "Elaborar estadísticas internas y métricas comerciales de carácter agregado sobre las solicitudes recibidas.",
            "Cumplir obligaciones legales cuando así se requiera.",
          ],
        },
        {
          type: "text",
          content: `${company} no utilizará los datos personales para finalidades distintas a las aquí descritas sin obtener previamente una nueva autorización del titular.`,
        },
      ],
    },
    {
      heading: "6. Base Legal y Autorización",
      blocks: [
        {
          type: "text",
          content:
            "El tratamiento de los datos personales se realiza con fundamento en la autorización previa, expresa e informada del titular, conforme a la Ley 1581 de 2012 y sus normas reglamentarias.",
        },
        {
          type: "text",
          content:
            "Dicha autorización se recoge mediante una casilla de aceptación explícita en el formulario de solicitud de asesoría. La casilla no viene marcada por defecto y el formulario no puede enviarse sin marcarla. Registramos la fecha y hora de la aceptación como evidencia.",
        },
        {
          type: "text",
          content:
            "El usuario podrá retirar su autorización en cualquier momento, salvo cuando exista un deber legal o contractual que impida su eliminación inmediata.",
        },
      ],
    },
    {
      heading: "7. Derechos del Titular",
      blocks: [
        {
          type: "text",
          content:
            "Como titular de los datos personales, usted tiene derecho a:",
        },
        {
          type: "list",
          items: [
            "Conocer qué información tenemos sobre usted.",
            "Actualizar sus datos.",
            "Rectificar la información incorrecta o incompleta.",
            "Solicitar la supresión de sus datos cuando sea procedente.",
            "Revocar la autorización otorgada.",
            "Solicitar prueba de la autorización otorgada.",
            "Presentar consultas o reclamos sobre el tratamiento de sus datos.",
            "Acudir ante la Superintendencia de Industria y Comercio cuando considere vulnerados sus derechos, una vez agotado el trámite de consulta o reclamo ante el responsable.",
          ],
        },
      ],
    },
    {
      heading: "8. Procedimiento para Consultas y Reclamos",
      blocks: [
        ...(email
          ? ([
              {
                type: "text",
                content: `Las solicitudes podrán enviarse al correo electrónico ${email}.`,
              },
            ] as LegalBlock[])
          : ([
              {
                type: "text",
                content:
                  "Las solicitudes podrán enviarse a los canales de contacto publicados en esta Landing Page.",
              },
            ] as LegalBlock[])),
        {
          type: "text",
          content: "Para facilitar la atención, incluya en su mensaje:",
        },
        {
          type: "list",
          items: [
            "Nombre completo.",
            "Documento de identidad.",
            "Medio de contacto para la respuesta.",
            "Descripción clara de la solicitud.",
          ],
        },
        {
          type: "text",
          content: `${company} responderá dentro de los plazos establecidos por la legislación colombiana: diez (10) días hábiles para consultas y quince (15) días hábiles para reclamos, prorrogables en los términos previstos por la Ley 1581 de 2012.`,
        },
      ],
    },
    {
      heading: "9. Conservación de la Información",
      blocks: [
        {
          type: "text",
          content:
            "Los datos serán conservados únicamente durante el tiempo necesario para cumplir las finalidades descritas o mientras exista una relación comercial o legal con el titular.",
        },
        {
          type: "text",
          content:
            "Cumplido ese término, los datos podrán ser eliminados o anonimizados de forma segura, salvo que deban conservarse para atender una obligación legal.",
        },
      ],
    },
    {
      heading: "10. Seguridad de la Información",
      blocks: [
        {
          type: "text",
          content: `${company} implementa medidas administrativas y técnicas razonables para proteger la información contra acceso no autorizado, alteración, divulgación, pérdida o destrucción. Entre ellas:`,
        },
        {
          type: "list",
          items: [
            "Bases de datos alojadas en infraestructura profesional con acceso restringido por credenciales.",
            "Transmisión cifrada de la información mediante HTTPS.",
            "Acceso al panel de gestión de solicitudes limitado a personal autorizado y protegido por contraseña.",
            "Validación y saneamiento de la información recibida en los formularios.",
            "Cabeceras de seguridad y políticas de contenido en el sitio web.",
          ],
        },
        {
          type: "text",
          content:
            "Ninguna medida de seguridad es infalible; no obstante, trabajamos para mantener y actualizar estos controles de forma continua.",
        },
      ],
    },
    {
      heading: "11. Compartición de Datos y Encargados del Tratamiento",
      blocks: [
        {
          type: "text",
          content: `${company} no vende ni comercializa datos personales.`,
        },
        {
          type: "text",
          content:
            "Podremos compartir información únicamente cuando sea necesario para prestar el servicio solicitado, cumplir obligaciones legales o apoyarnos en proveedores tecnológicos que actúan como encargados del tratamiento, es decir, que tratan los datos siguiendo nuestras instrucciones y no para finalidades propias.",
        },
        { type: "subheading", content: "Dónde se almacenan tus datos hoy" },
        {
          type: "text",
          content: `La base de datos en la que se almacenan las solicitudes enviadas desde el formulario está alojada en servidores ubicados en ${DATABASE_LOCATION}. Esto constituye una transmisión internacional de datos personales a un encargado del tratamiento, en los términos de la Ley 1581 de 2012 y del Decreto 1377 de 2013.`,
        },
        {
          type: "text",
          content:
            "El sitio web se sirve, además, a través de un proveedor de alojamiento web.",
        },
        { type: "subheading", content: "Otros destinatarios" },
        {
          type: "text",
          content:
            "Cuando decides continuar la conversación por WhatsApp, la información que compartas en ese canal queda sujeta también a las políticas de WhatsApp/Meta (ver el punto 12).",
        },
        {
          type: "text",
          content:
            "El mapa de la sección Ubicación lo entrega Google como contenido incrustado. Google no actúa como encargado del tratamiento de nuestras solicitudes: presta ese servicio bajo sus propias condiciones y políticas (ver el punto 13).",
        },
        {
          type: "text",
          content: `Si en el futuro ${company} incorpora proveedores adicionales que traten datos personales, esta política se actualizará para identificarlos.`,
        },
      ],
    },
    {
      heading: "12. Uso de WhatsApp",
      blocks: [
        {
          type: "text",
          content:
            "Esta Landing Page ofrece varios puntos de contacto por WhatsApp: botones distribuidos en distintas secciones, el menú de navegación, un botón flotante visible en todo el sitio y la redirección que se produce al enviar el formulario de solicitud de asesoría.",
        },
        {
          type: "text",
          content:
            "Al utilizar cualquiera de ellos, el usuario será redirigido a WhatsApp con un mensaje previamente redactado, que en el caso del formulario incluye los datos de su solicitud.",
        },
        {
          type: "text",
          content:
            "A partir de ese momento la conversación se desarrolla dentro de WhatsApp y queda sujeta también a las políticas de privacidad y condiciones de uso de WhatsApp/Meta, sobre las cuales no tenemos control.",
        },
        {
          type: "text",
          content:
            "El usuario decide libremente qué información adicional comparte durante esa conversación.",
        },
      ],
    },
    {
      heading: "13. Cookies y Tecnologías Similares",
      blocks: [
        {
          type: "text",
          content:
            "Esta Landing Page no instala cookies de analítica ni de publicidad en el navegador de sus visitantes.",
        },
        {
          type: "text",
          content:
            "La sección Ubicación incluye un mapa de Google Maps, un servicio de terceros que utilizamos para mostrar la dirección de nuestra oficina. El elemento está marcado con carga diferida (lazy loading), si bien el momento exacto en que se solicita lo determina el navegador y puede producirse durante la carga inicial de la página, antes de que el usuario se desplace hasta esa sección.",
        },
        {
          type: "text",
          content:
            "Cuando esa petición se produce, el navegador del usuario establece comunicación con Google, que puede almacenar cookies o identificadores propios conforme a sus propias políticas.",
        },
        {
          type: "text",
          content:
            "El detalle de las cookies técnicas y de los contenidos de terceros que sí se cargan está descrito en nuestra Política de Cookies.",
        },
      ],
    },
    {
      heading: "14. Analítica y Publicidad",
      blocks: [
        {
          type: "text",
          content:
            "A la fecha de vigencia de esta política, este sitio no tiene activas herramientas de analítica ni de publicidad como Google Analytics, Google Ads o Meta Pixel.",
        },
        {
          type: "text",
          content: `Si en el futuro ${company} decide implementarlas, actualizará previamente esta política y la Política de Cookies, e implementará un mecanismo para solicitar el consentimiento del usuario antes de activar cookies no esenciales.`,
        },
      ],
    },
    {
      heading: "15. Datos de Menores de Edad",
      blocks: [
        {
          type: "text",
          content: `${company} no recopila intencionalmente datos personales de menores de edad a través de esta Landing Page. Nuestros servicios están dirigidos a personas mayores de edad con capacidad legal para contratar.`,
        },
        {
          type: "text",
          content:
            "Si un menor suministra información sin autorización de sus representantes legales, estos podrán solicitar la eliminación inmediata de dichos datos por los canales indicados en esta política.",
        },
      ],
    },
    {
      heading: "16. Modificaciones de la Política",
      blocks: [
        {
          type: "text",
          content: `${company} podrá actualizar esta política cuando existan cambios legales, tecnológicos o comerciales que lo justifiquen.`,
        },
        {
          type: "text",
          content:
            "La versión vigente estará siempre disponible en esta Landing Page, identificada con su número de versión y fecha de entrada en vigencia.",
        },
      ],
    },
    {
      heading: "17. Contacto",
      blocks: [
        {
          type: "text",
          content:
            "Para cualquier consulta relacionada con la protección de datos personales puedes comunicarte con nosotros a través de:",
        },
        { type: "list", items: contactLines() },
      ],
    },
  ];
}

export function buildTermsOfUse(): LegalSection[] {
  return [
    {
      heading: "1. Objeto",
      blocks: [
        {
          type: "text",
          content: `Estos Términos regulan el acceso y uso de la Landing Page de ${company}, destinada a brindar información, cotizaciones aproximadas y asesoría sobre servicios relacionados con Salud (EPS), Pensión, ARL y Seguridad Social en Colombia.`,
        },
        {
          type: "text",
          content:
            "Al acceder y utilizar este sitio web, el usuario declara conocer y aceptar estos términos.",
        },
      ],
    },
    {
      heading: "2. Servicios Ofrecidos",
      blocks: [
        {
          type: "text",
          content:
            "Esta Landing Page ofrece información y asesoría relacionada con:",
        },
        {
          type: "list",
          items: [
            "Afiliación a Salud (EPS).",
            "Afiliación a Pensión.",
            "Afiliación a ARL.",
            "Seguridad Social Integral para trabajadores independientes, familias y empresas.",
          ],
        },
        {
          type: "text",
          content: `La información publicada tiene carácter informativo y comercial. ${company} es una plataforma de asesoría y acompañamiento en procesos relacionados con Salud, Pensión y ARL en Colombia.`,
        },
      ],
    },
    {
      heading: "3. Cotizador",
      blocks: [
        {
          type: "text",
          content:
            "El cotizador disponible en el sitio tiene como finalidad ofrecer un valor aproximado y orientativo, calculado a partir del servicio, el plan y la ciudad que selecciona el usuario.",
        },
        {
          type: "note",
          content:
            "La cotización presentada no constituye una oferta contractual, puede variar según la información suministrada por el usuario y está sujeta a validación por parte de un asesor. Los aportes a seguridad social en Colombia están regulados por ley y sus valores pueden cambiar por decisión normativa.",
        },
        {
          type: "text",
          content:
            "El usuario entiende y acepta expresamente esta condición al utilizar el cotizador.",
        },
      ],
    },
    {
      heading: "4. Solicitud de Asesoría",
      blocks: [
        {
          type: "text",
          content:
            'Cuando el usuario diligencia el formulario y selecciona "Solicitar asesoría por WhatsApp", autoriza a que se le contacte mediante WhatsApp, llamada telefónica o correo electrónico, únicamente para atender la solicitud realizada.',
        },
        {
          type: "text",
          content:
            "El envío del formulario no genera obligación de contratación alguna para el usuario ni garantiza por sí solo la afiliación al servicio consultado, la cual dependerá del cumplimiento de los requisitos aplicables.",
        },
      ],
    },
    {
      heading: "5. Obligaciones del Usuario",
      blocks: [
        { type: "text", content: "El usuario se compromete a:" },
        {
          type: "list",
          items: [
            "Suministrar información veraz, completa y actualizada.",
            "No utilizar información falsa ni datos de terceros sin su autorización.",
            "No utilizar esta Landing Page para actividades ilícitas o contrarias a la buena fe.",
            "No intentar vulnerar la seguridad, la disponibilidad o la integridad del sitio.",
            "No emplear mecanismos automatizados para el envío masivo de solicitudes.",
          ],
        },
      ],
    },
    {
      heading: "6. Propiedad Intelectual",
      blocks: [
        {
          type: "text",
          content: `Todo el contenido de este sitio pertenece a ${company} o cuenta con autorización para su uso. Incluye, entre otros:`,
        },
        {
          type: "list",
          items: [
            "Logotipo y elementos de marca.",
            "Diseño e interfaz del sitio.",
            "Iconografía e ilustraciones.",
            "Textos y contenidos editoriales.",
            "Mascota corporativa Foxy.",
            "Fotografías.",
            "Código fuente.",
          ],
        },
        {
          type: "text",
          content:
            "Queda prohibida su reproducción, distribución o modificación total o parcial sin autorización escrita previa.",
        },
      ],
    },
    {
      heading: "7. Disponibilidad del Servicio",
      blocks: [
        {
          type: "text",
          content: `${company} realiza esfuerzos razonables para mantener la disponibilidad y el correcto funcionamiento del sitio.`,
        },
        {
          type: "text",
          content:
            "No obstante, no garantiza una disponibilidad ininterrumpida, ya que pueden presentarse tareas de mantenimiento, fallas técnicas o eventos fuera de su control.",
        },
      ],
    },
    {
      heading: "8. Limitación de Responsabilidad",
      blocks: [
        {
          type: "text",
          content: `Dentro de los límites permitidos por la ley colombiana, ${company} no será responsable por:`,
        },
        {
          type: "list",
          items: [
            "Errores derivados de información incorrecta o incompleta suministrada por el usuario.",
            "Interrupciones temporales del servicio o del sitio web.",
            "Fallas atribuibles a proveedores externos, incluidos servicios de mensajería, hosting o conectividad.",
            "Cambios normativos que afecten los valores de cotización o las condiciones de afiliación.",
            "Decisiones que el usuario adopte basándose exclusivamente en los valores orientativos del cotizador, sin la validación previa de un asesor.",
          ],
        },
        {
          type: "text",
          content:
            "Nada en estos términos excluye la responsabilidad que no pueda limitarse conforme a la legislación colombiana, en especial en materia de protección al consumidor.",
        },
      ],
    },
    {
      heading: "9. Enlaces y Contenidos de Terceros",
      blocks: [
        {
          type: "text",
          content:
            "El sitio puede redirigir al usuario hacia plataformas externas, como WhatsApp, o incorporar contenidos de terceros, como el mapa de ubicación de nuestra oficina.",
        },
        {
          type: "text",
          content: `${company} no controla ni se hace responsable de las políticas de privacidad, los términos de uso ni la disponibilidad de dichos servicios externos.`,
        },
      ],
    },
    {
      heading: "10. Protección de Datos Personales",
      blocks: [
        {
          type: "text",
          content:
            "El tratamiento de los datos personales recolectados a través de este sitio se rige por nuestra Política de Privacidad y Tratamiento de Datos Personales, que forma parte integral de estos Términos.",
        },
      ],
    },
    {
      heading: "11. Modificaciones",
      blocks: [
        {
          type: "text",
          content: `${company} podrá actualizar estos Términos en cualquier momento. Los cambios entrarán en vigencia desde su publicación en el sitio web, identificados con su versión y fecha.`,
        },
      ],
    },
    {
      heading: "12. Legislación Aplicable y Jurisdicción",
      blocks: [
        {
          type: "text",
          content:
            "Estos términos se rigen por las leyes de la República de Colombia.",
        },
        {
          type: "text",
          content:
            "Cualquier controversia derivada de su interpretación o aplicación será resuelta ante los jueces y tribunales competentes de Colombia.",
        },
      ],
    },
  ];
}

export function buildCookiePolicy(): LegalSection[] {
  return [
    {
      heading: "1. ¿Qué son las cookies?",
      blocks: [
        {
          type: "text",
          content:
            "Las cookies son pequeños archivos que un sitio web almacena en el dispositivo del usuario. Permiten, entre otras cosas, recordar preferencias, mantener una sesión iniciada u obtener información estadística sobre el uso del sitio.",
        },
      ],
    },
    {
      heading: "2. Cookies que utiliza este sitio",
      blocks: [
        {
          type: "note",
          content:
            "Esta Landing Page no instala cookies de analítica, de publicidad ni de seguimiento en el navegador de sus visitantes.",
        },
        { type: "subheading", content: "Cookies estrictamente necesarias" },
        {
          type: "text",
          content:
            "Utilizamos una única cookie propia, destinada a mantener la sesión iniciada en el panel interno de gestión de solicitudes.",
        },
        {
          type: "list",
          items: [
            "Solo se crea cuando un miembro autorizado del equipo inicia sesión en el panel administrativo.",
            "Nunca se crea para los visitantes de la página pública.",
            "Es de tipo httpOnly: no puede ser leída por scripts del navegador.",
            "Caduca automáticamente a las ocho (8) horas.",
          ],
        },
        {
          type: "text",
          content:
            "Por tratarse de una cookie estrictamente necesaria para la autenticación, no requiere consentimiento previo del usuario.",
        },
      ],
    },
    {
      heading: "3. Contenido de terceros incrustado",
      blocks: [
        {
          type: "text",
          content:
            'La sección "Ubicación" de esta Landing Page incluye un mapa de Google Maps incrustado, un servicio de terceros que utilizamos para mostrar la dirección de nuestra oficina.',
        },
        {
          type: "text",
          content:
            'El elemento está marcado con carga diferida (atributo loading="lazy"), si bien el momento exacto en que el recurso se solicita lo determina el navegador: puede producirse durante la carga inicial de la página, antes de que el usuario se desplace hasta esa sección.',
        },
        {
          type: "text",
          content:
            "Cuando esa petición se produce, el navegador del usuario establece comunicación con Google, que puede almacenar cookies o identificadores propios asociados a ese contenido, sobre los cuales no tenemos control ni acceso.",
        },
        {
          type: "text",
          content:
            "Google no actúa como encargado del tratamiento de nuestras solicitudes: presta ese servicio bajo sus propias condiciones y políticas de privacidad.",
        },
        {
          type: "text",
          content:
            "Si prefieres evitar esa comunicación, puedes bloquear el contenido de terceros desde la configuración de tu navegador.",
        },
      ],
    },
    {
      heading: "4. Lo que este sitio no utiliza",
      blocks: [
        {
          type: "text",
          content:
            "A la fecha de vigencia de esta política, y de forma verificable en el sitio, esta Landing Page no utiliza:",
        },
        {
          type: "list",
          items: [
            "Google Analytics u otras herramientas de analítica web.",
            "Google Ads, Meta Pixel u otros píxeles de conversión o publicidad.",
            "Cookies de redes sociales.",
            "Almacenamiento local del navegador para seguimiento de usuarios.",
            "Fuentes tipográficas cargadas desde servidores externos: las fuentes se sirven desde nuestro propio sitio.",
          ],
        },
      ],
    },
    {
      heading: "5. Cómo administrar las cookies",
      blocks: [
        {
          type: "text",
          content:
            "El usuario puede configurar su navegador para aceptar, rechazar o eliminar las cookies almacenadas en su dispositivo. Los navegadores más comunes permiten hacerlo desde su sección de privacidad o configuración de sitios.",
        },
        {
          type: "text",
          content:
            "Dado que este sitio no instala cookies no esenciales para los visitantes, bloquear cookies de terceros no afecta el funcionamiento del cotizador ni del formulario de solicitud de asesoría.",
        },
      ],
    },
    {
      heading: "6. Cambios futuros",
      blocks: [
        {
          type: "text",
          content: `Si en el futuro ${company} incorpora herramientas de analítica, publicidad o medición de campañas, esta política se actualizará antes de su activación y se habilitará un mecanismo que permita al usuario aceptar, rechazar o configurar las cookies no esenciales de forma previa.`,
        },
        {
          type: "text",
          content:
            "La versión vigente estará siempre disponible en esta Landing Page, identificada con su número de versión y fecha de entrada en vigencia.",
        },
      ],
    },
    {
      heading: "7. Contacto",
      blocks: [
        {
          type: "text",
          content:
            "Para cualquier consulta sobre esta Política de Cookies puedes comunicarte con nosotros a través de:",
        },
        { type: "list", items: contactLines() },
      ],
    },
  ];
}
