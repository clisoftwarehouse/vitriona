import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';

import { Navbar } from '@/app/_components/navbar';
import { Footer } from '@/app/_components/footer';

export const metadata: Metadata = {
  title: 'Marco legal integral',
  description:
    'Términos y condiciones, política de privacidad, política antifraude, acuerdo de nivel de servicio y cláusula de arbitraje de Vitriona.app.',
};

const sections = [
  { id: 'titular', label: '1. Identificación del titular' },
  { id: 'definiciones', label: '2. Definiciones' },
  { id: 'terminos', label: '3. Términos y condiciones' },
  { id: 'privacidad', label: '4. Política de privacidad' },
  { id: 'antifraude', label: '5. Política antifraude' },
  { id: 'sla', label: '6. Acuerdo de nivel de servicio' },
  { id: 'arbitraje', label: '7. Ley aplicable y arbitraje' },
  { id: 'aceptacion', label: '8. Aceptación digital' },
  { id: 'contacto', label: '9. Contacto legal' },
];

export default function LegalPage() {
  return (
    <div className='bg-background min-h-screen'>
      <Navbar />

      <main className='mx-auto max-w-7xl px-6 pt-28 pb-16 sm:px-0'>
        {/* Hero card */}
        <section className='border-border/60 bg-card/40 mb-10 rounded-3xl border p-8 shadow-sm backdrop-blur-sm md:p-10'>
          <div className='border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase'>
            <ShieldCheck className='size-3.5' />
            Marco legal integral · Vitriona.app
          </div>
          <h1 className='mt-5 text-3xl leading-tight font-semibold tracking-tight md:text-5xl'>
            Términos de uso y políticas de Vitriona.app
          </h1>

          <dl className='mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {[
              { k: 'Titular de la plataforma', v: 'CLI SOFTWARE HOUSE, C.A.' },
              { k: 'RIF', v: 'J-50812478-2' },
              { k: 'Registro mercantil', v: 'Tomo 37-A · Nro. 7 · Año 2026' },
              { k: 'Contacto', v: 'info@clisoftwarehouse.com' },
            ].map((item) => (
              <div key={item.k} className='border-border/60 bg-background/40 rounded-xl border p-4'>
                <dt className='text-muted-foreground text-[11px] font-medium tracking-wider uppercase'>{item.k}</dt>
                <dd className='mt-1 text-sm font-semibold'>{item.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Layout with sidebar */}
        <div className='grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]'>
          <aside className='lg:sticky lg:top-24 lg:self-start'>
            <div className='border-border/60 bg-card/40 rounded-2xl border p-5 shadow-sm'>
              <h2 className='text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase'>Contenido</h2>
              <nav className='flex flex-col gap-1'>
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className='text-foreground/80 hover:bg-accent hover:text-foreground rounded-lg px-3 py-2 text-sm transition-colors'
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className='flex min-w-0 flex-col gap-6'>
            {/* 1. Titular */}
            <Section id='titular' title='1. Identificación del titular de la plataforma'>
              <p>
                <strong>Vitriona.app</strong> es una plataforma tecnológica propiedad, titularidad, administración y
                operación de <strong>CLI SOFTWARE HOUSE, C.A.</strong>, sociedad mercantil debidamente constituida
                conforme a las leyes de la República Bolivariana de Venezuela e inscrita ante el{' '}
                <strong>Registro Mercantil Tercero del Estado Zulia</strong>, bajo el{' '}
                <strong>Nro. 7, Tomo 37-A, correspondiente al año 2026</strong>, expediente{' '}
                <strong>Nro. 485-68274</strong>.
              </p>
              <div className='mt-5 grid gap-4 md:grid-cols-2'>
                <InfoBox title='Datos corporativos'>
                  <p>
                    <strong>RIF:</strong> J-50812478-2
                  </p>
                  <p>
                    <strong>Domicilio fiscal:</strong> Calle 81, Quinta Nro. 71A-23, Urbanización Las Lomas, Maracaibo,
                    Estado Zulia, Zona Postal 4002, República Bolivariana de Venezuela.
                  </p>
                </InfoBox>
                <InfoBox title='Canales oficiales'>
                  <p>
                    <strong>Correo:</strong>{' '}
                    <a className='text-primary hover:underline' href='mailto:info@clisoftwarehouse.com'>
                      info@clisoftwarehouse.com
                    </a>
                  </p>
                  <p>
                    <strong>Teléfono:</strong> +58 412-1985228
                  </p>
                </InfoBox>
              </div>
              <p className='mt-4'>
                A los efectos de este documento, toda referencia a <strong>“Vitriona.app”</strong>,{' '}
                <strong>“la Plataforma”</strong>, <strong>“CLI SOFTWARE HOUSE”</strong>, <strong>“nosotros”</strong>,{' '}
                <strong>“nuestro”</strong> o expresiones equivalentes deberá entenderse hecha a{' '}
                <strong>CLI SOFTWARE HOUSE, C.A.</strong>, salvo disposición expresa en contrario.
              </p>
            </Section>

            {/* 2. Definiciones */}
            <Section id='definiciones' title='2. Definiciones'>
              <div className='grid gap-4 md:grid-cols-2'>
                <InfoBox title='Plataforma'>
                  <p>
                    El ecosistema tecnológico Vitriona.app, incluyendo sitio web, paneles, módulos, integraciones,
                    automatizaciones, catálogos, comunicaciones, analítica y funcionalidades conexas.
                  </p>
                </InfoBox>
                <InfoBox title='Usuario'>
                  <p>
                    Toda persona natural o jurídica que acceda, navegue, se registre, configure, administre o utilice la
                    Plataforma.
                  </p>
                </InfoBox>
                <InfoBox title='Cuenta'>
                  <p>El perfil o registro habilitado para el uso de determinadas funcionalidades de la Plataforma.</p>
                </InfoBox>
                <InfoBox title='Datos'>
                  <p>
                    Toda información personal, fiscal, técnica, comercial, operativa, transaccional, analítica o
                    derivada relacionada con el Usuario o con el uso de la Plataforma.
                  </p>
                </InfoBox>
                <InfoBox title='Servicios'>
                  <p>
                    Las funcionalidades, herramientas, integraciones y prestaciones digitales ofrecidas por
                    Vitriona.app.
                  </p>
                </InfoBox>
                <InfoBox title='Autoridad competente'>
                  <p>
                    Cualquier órgano judicial, policial, administrativo, fiscal, regulatorio o arbitral con competencia
                    legal para requerir, supervisar, investigar o decidir sobre materias relacionadas con el uso de la
                    Plataforma.
                  </p>
                </InfoBox>
              </div>
            </Section>

            {/* 3. Términos */}
            <Section id='terminos' title='3. Términos y condiciones de uso'>
              <SubH>3.1 Objeto</SubH>
              <p>
                El presente instrumento regula el acceso, uso, navegación, registro, permanencia y utilización de
                Vitriona.app por parte de cualquier Usuario, así como los derechos, obligaciones, limitaciones,
                condiciones operativas y reglas de conducta aplicables a la relación jurídica entre el Usuario y CLI
                SOFTWARE HOUSE, C.A.
              </p>

              <SubH>3.2 Naturaleza del servicio</SubH>
              <p>
                Vitriona.app constituye una infraestructura tecnológica orientada a facilitar presencia digital,
                automatización operativa, vitrinas comerciales, gestión de catálogos, interacción con clientes, pedidos,
                integraciones, comunicación y herramientas de soporte al proceso comercial.
              </p>
              <p>
                Salvo pacto expreso en contrario, la Plataforma{' '}
                <strong>
                  no actúa como vendedor directo, intermediario financiero, entidad de custodia, asegurador,
                  certificador universal de legalidad, garante absoluto de transacciones ni auditor previo de toda
                  actividad desarrollada por los Usuarios
                </strong>
                .
              </p>

              <SubH>3.3 Capacidad y legitimación</SubH>
              <p>
                El Usuario declara que posee plena capacidad legal para obligarse y utilizar la Plataforma, o que actúa
                válidamente en representación de una persona natural o jurídica con facultades suficientes.
              </p>

              <SubH>3.4 Registro y veracidad de la información</SubH>
              <p>
                El Usuario se obliga a suministrar información veraz, completa, exacta, vigente y verificable durante su
                registro y en cualquier momento posterior en que sea requerida por la Plataforma.
              </p>

              <SubH>3.5 Identificación personal y fiscal obligatoria</SubH>
              <p>
                Como condición esencial para el acceso, continuidad, validación o uso de determinadas funcionalidades,
                Vitriona.app podrá exigir:
              </p>
              <ol className='text-foreground/90 mt-2 list-decimal space-y-2 pl-6 text-sm'>
                <li>nombre completo o denominación social;</li>
                <li>
                  documento oficial de identificación personal vigente, emitido por autoridad competente de la
                  jurisdicción del Usuario;
                </li>
                <li>
                  número de identificación fiscal, tributaria o equivalente, incluyendo cualquier identificador análogo
                  aplicable en la jurisdicción correspondiente;
                </li>
                <li>datos de contacto, dirección fiscal o comercial;</li>
                <li>documentos corporativos, mercantiles, bancarios o de representación, cuando proceda.</li>
              </ol>
              <p className='mt-4'>
                La negativa a suministrar esta información, su falsedad, inconsistencia, caducidad, alteración o falta
                de verificabilidad facultará a la Plataforma para suspender, bloquear, restringir o cancelar la Cuenta.
              </p>

              <SubH>3.6 Uso autorizado</SubH>
              <p>
                El Usuario se compromete a usar la Plataforma únicamente para fines lícitos, legítimos, compatibles con
                la buena fe, el comercio honesto, la protección de terceros y la normativa aplicable.
              </p>

              <SubH>3.7 Prohibiciones</SubH>
              <BulletList>
                <li>usar la Plataforma para fraude, estafa, engaño, suplantación o captación indebida;</li>
                <li>publicar ofertas falsas o aparentar vender bienes o servicios inexistentes;</li>
                <li>
                  manipular comprobantes, pedidos, mensajes, conversaciones, catálogos, precios, inventarios o
                  evidencias digitales;
                </li>
                <li>acceder sin autorización a sistemas, cuentas, integraciones o datos;</li>
                <li>
                  usar la Plataforma para vulnerar derechos de terceros, propiedad intelectual, privacidad, normas de
                  consumo, competencia o regulación aplicable;
                </li>
                <li>
                  cargar malware, código malicioso o elementos capaces de comprometer la seguridad o continuidad del
                  servicio;
                </li>
                <li>usar identidades falsas, alteradas, incompletas o ajenas.</li>
              </BulletList>

              <SubH>3.8 Responsabilidad del Usuario</SubH>
              <p>
                El Usuario será el <strong>único y exclusivo responsable</strong> por los contenidos que publique o
                administre, las operaciones que ejecute, las interacciones que mantenga con terceros, la legitimidad de
                los productos o servicios que ofrezca, el cumplimiento de las normas aplicables a su actividad y las
                consecuencias jurídicas, económicas, técnicas o reputacionales derivadas de su uso de la Plataforma.
              </p>

              <SubH>3.9 Facultades de control de la Plataforma</SubH>
              <p>
                Vitriona.app podrá, en cualquier momento y sin necesidad de aviso previo, cuando resulte razonable,
                requerir validaciones adicionales, suspender funcionalidades, limitar accesos, bloquear Cuentas, retener
                configuraciones, preservar evidencias, impedir la continuidad operativa o cancelar relaciones de uso.
              </p>

              <SubH>3.10 Limitación de responsabilidad</SubH>
              <p>
                En la máxima medida permitida por la ley aplicable, Vitriona.app no será responsable por actos ilícitos,
                fraudulentos o engañosos cometidos por Usuarios, decisiones comerciales adoptadas por el Usuario o por
                terceros, daños derivados de redes, integraciones, plataformas, pasarelas o servicios de terceros, ni
                por lucro cesante, pérdida de oportunidad, daño indirecto, daño emergente remoto, pérdida reputacional o
                pérdida de datos no atribuible directamente a dolo o culpa grave de la Plataforma.
              </p>

              <SubH>3.11 Propiedad intelectual</SubH>
              <p>
                Todos los derechos sobre el software, arquitectura, diseño, interfaces, documentación, flujos,
                funcionalidades, marcas, signos distintivos, desarrollos, bases lógicas, mejoras, contenidos propios y
                elementos tecnológicos de la Plataforma pertenecen a CLI SOFTWARE HOUSE, C.A. o a sus licenciantes,
                según corresponda.
              </p>
            </Section>

            {/* 4. Privacidad */}
            <Section id='privacidad' title='4. Política de privacidad y tratamiento de datos'>
              <SubH>4.1 Objeto</SubH>
              <p>
                La presente Política regula la recolección, uso, tratamiento, almacenamiento, organización, análisis,
                compartición, transferencia, monetización legítima y demás operaciones realizadas sobre los Datos
                asociados al Usuario y al uso de Vitriona.app.
              </p>

              <SubH>4.2 Alcance internacional</SubH>
              <p>
                La Plataforma tiene vocación internacional. En consecuencia, el tratamiento de Datos podrá involucrar
                usuarios, proveedores, integraciones, entornos tecnológicos y operaciones situadas en diferentes
                jurisdicciones.
              </p>

              <SubH>4.3 Datos que podrán recabarse</SubH>
              <BulletList>
                <li>datos de identificación personal;</li>
                <li>datos de identificación fiscal o tributaria;</li>
                <li>datos de contacto;</li>
                <li>datos mercantiles, societarios o de representación;</li>
                <li>datos de autenticación, sesión, dispositivo y seguridad;</li>
                <li>datos operativos y transaccionales;</li>
                <li>datos de soporte, incidencias y verificaciones;</li>
                <li>datos de comportamiento funcional y uso del servicio;</li>
                <li>información derivada, inferida, agregada, analítica, estadística, anonimizada o pseudonimizada.</li>
              </BulletList>

              <SubH>4.4 Finalidades del tratamiento</SubH>
              <BulletList>
                <li>registrar y autenticar Usuarios;</li>
                <li>validar identidad, actividad, representación y trazabilidad;</li>
                <li>prestar, mantener y optimizar los Servicios;</li>
                <li>habilitar integraciones, automatizaciones y configuraciones;</li>
                <li>prevenir fraude, abuso, accesos indebidos y conductas ilícitas;</li>
                <li>monitorear seguridad, continuidad y calidad del servicio;</li>
                <li>atender soporte, reclamos, incidentes y requerimientos;</li>
                <li>desarrollar analítica, segmentación, inteligencia comercial y mejora de producto;</li>
                <li>ejecutar acciones de marketing, prospección y personalización;</li>
                <li>cumplir exigencias legales, regulatorias, contractuales o de autoridad competente.</li>
              </BulletList>

              <SubH>4.5 Uso comercial de la información</SubH>
              <p>
                El Usuario reconoce y acepta que la Plataforma podrá tratar Datos e información derivada con fines de
                inteligencia de negocio, analítica avanzada, marketing, prospección, segmentación, personalización,
                mejora de conversión, desarrollo de nuevas soluciones y monetización de información derivada permitida
                por la ley.
              </p>
              <p>
                Asimismo, Vitriona.app podrá utilizar, estructurar, licenciar, compartir, explotar económicamente o
                comercializar información{' '}
                <strong>
                  derivada, agregada, anonimizada, pseudonimizada, estadística o estratégicamente procesada
                </strong>
                , directamente o a través de aliados tecnológicos o comerciales, siempre dentro del marco legal
                aplicable.
              </p>

              <SubH>4.6 Compartición con terceros</SubH>
              <p>
                Los Datos podrán ser compartidos con proveedores de hosting, infraestructura, soporte, autenticación,
                mensajería, automatización, analítica o seguridad; aliados comerciales o tecnológicos; asesores,
                auditores o profesionales vinculados a la operación; potenciales adquirentes, sucesores o cesionarios en
                procesos corporativos; y autoridades competentes, cuando exista base jurídica suficiente.
              </p>

              <SubH>4.7 Transferencias internacionales</SubH>
              <p>
                El Usuario acepta que sus Datos puedan ser alojados, procesados, respaldados o gestionados en
                jurisdicciones distintas a su lugar de residencia, cuando ello sea necesario para la prestación del
                servicio, la infraestructura, la seguridad, la analítica, el soporte o el cumplimiento.
              </p>

              <SubH>4.8 Conservación y seguridad</SubH>
              <p>
                Los Datos serán conservados durante el tiempo razonablemente necesario para prestar el servicio,
                mantener continuidad operativa, prevenir y detectar fraude, atender disputas o investigaciones, sostener
                obligaciones legales o contractuales y ejecutar analítica e inteligencia comercial conforme al marco
                legal aplicable.
              </p>
              <p>
                La Plataforma implementará medidas técnicas, administrativas, organizativas y lógicas razonables para
                proteger los Datos frente a acceso no autorizado, pérdida, alteración, uso indebido o destrucción.
              </p>

              <SubH>4.9 Derechos del Usuario</SubH>
              <p>
                En la medida en que la ley aplicable lo reconozca, el Usuario podrá solicitar acceso a sus Datos,
                rectificación o actualización, limitación de ciertos tratamientos, supresión cuando legalmente proceda,
                oposición o revisión de determinadas preferencias e información sobre finalidades y uso de Datos.
              </p>
            </Section>

            {/* 5. Antifraude */}
            <Section id='antifraude' title='5. Política de uso aceptable y antifraude'>
              <SubH>5.1 Principio general</SubH>
              <p>
                Todo Usuario se obliga a utilizar la Plataforma de forma ética, verificable, trazable, transparente y
                conforme a la ley aplicable.
              </p>

              <SubH>5.2 Actividades prohibidas</SubH>
              <BulletList>
                <li>usar identidades falsas o ajenas;</li>
                <li>ocultar o tergiversar información material relevante;</li>
                <li>captar fondos mediante engaño;</li>
                <li>usar catálogos o descripciones engañosas;</li>
                <li>fingir reputación, validaciones o autorizaciones inexistentes;</li>
                <li>manipular pagos, órdenes, conversaciones o comprobantes;</li>
                <li>ejecutar accesos indebidos o explotación técnica no autorizada;</li>
                <li>usar la Plataforma para lavado reputacional, fraude reiterado o abuso de confianza.</li>
              </BulletList>

              <SubH>5.3 Monitoreo y trazabilidad</SubH>
              <p>
                La Plataforma podrá monitorear actividad, sesiones, logs, eventos, direcciones IP, patrones de uso,
                configuraciones, cambios funcionales y demás trazas digitales necesarias para fines de seguridad,
                auditoría, investigación y prevención de fraude.
              </p>

              <SubH>5.4 Preservación de evidencias</SubH>
              <p>
                Cuando existan indicios de actividad irregular o ilícita, la Plataforma podrá preservar y resguardar
                evidencia técnica, documental y operativa para fines internos, legales, arbitrales, regulatorios o
                judiciales.
              </p>

              <SubH>5.5 Cooperación con autoridades</SubH>
              <p>
                Cuando existan requerimientos válidos, investigaciones, denuncias fundadas o indicios razonables de
                hechos potencialmente ilícitos, la Plataforma podrá colaborar con autoridades competentes y suministrar
                la información pertinente en la medida permitida por la ley.
              </p>

              <SubH>5.6 Medidas correctivas</SubH>
              <p>
                La Plataforma podrá aplicar alerta interna, verificación reforzada, limitación operativa, suspensión
                temporal, bloqueo preventivo, cancelación definitiva, reclamación de daños y notificación a terceros
                potencialmente afectados, cuando proceda legalmente.
              </p>
            </Section>

            {/* 6. SLA */}
            <Section id='sla' title='6. Acuerdo de nivel de servicio (SLA)'>
              <SubH>6.1 Objeto</SubH>
              <p>
                El presente SLA establece los niveles de disponibilidad, soporte, tiempos de respuesta, exclusiones,
                mantenimiento y eventuales créditos de servicio aplicables a Vitriona.app.
              </p>

              <SubH>6.2 Definiciones</SubH>
              <BulletList>
                <li>
                  <strong>Servicio cubierto:</strong> funcionalidades productivas incluidas en el plan contratado.
                </li>
                <li>
                  <strong>Tiempo de inactividad:</strong> período en el que el servicio cubierto no se encuentra
                  disponible por causas atribuibles directamente a la Plataforma, excluyendo las excepciones de este
                  SLA.
                </li>
                <li>
                  <strong>Disponibilidad mensual:</strong> porcentaje de disponibilidad calculado sobre el total de
                  minutos del mes calendario.
                </li>
                <li>
                  <strong>Crédito de servicio:</strong> compensación aplicable al Cliente conforme a este SLA.
                </li>
              </BulletList>

              <SubH>6.3 Disponibilidad comprometida</SubH>
              <p>
                La Plataforma realizará esfuerzos comercialmente razonables para mantener una disponibilidad mensual del{' '}
                <strong>99.9%</strong> del servicio cubierto.
              </p>

              <SubH>6.4 Fórmula de cálculo</SubH>
              <p className='border-border/60 bg-muted/40 my-3 overflow-x-auto rounded-lg border p-3 font-mono text-xs'>
                Disponibilidad mensual = [(Minutos totales del mes - Minutos de inactividad cubiertos) / Minutos totales
                del mes] x 100
              </p>

              <SubH>6.5 Mantenimiento y exclusiones</SubH>
              <p>
                Las ventanas de mantenimiento programado, emergencia técnica, actualizaciones de seguridad, migraciones,
                mejoras de infraestructura o acciones preventivas no computarán como tiempo de inactividad cubierto.
              </p>
              <p>
                No constituirá incumplimiento del SLA la indisponibilidad causada por fuerza mayor, fallas de internet o
                terceros, errores de configuración del Cliente, mal uso del servicio, ataques maliciosos, integraciones
                de terceros, suspensión justificada por fraude, riesgo o incumplimiento, ni entornos beta, pruebas o
                sandboxes.
              </p>

              <SubH>6.6 Soporte e incidentes</SubH>
              <div className='mt-3 grid gap-4 md:grid-cols-2'>
                <InfoBox title='Severidad 1 — Crítica'>
                  <p>Caída total o inutilización general de funciones esenciales.</p>
                  <p>
                    <strong>Respuesta inicial:</strong> hasta 1 hora.
                  </p>
                </InfoBox>
                <InfoBox title='Severidad 2 — Alta'>
                  <p>Impacto severo, con degradación material del servicio.</p>
                  <p>
                    <strong>Respuesta inicial:</strong> hasta 4 horas.
                  </p>
                </InfoBox>
                <InfoBox title='Severidad 3 — Media'>
                  <p>Afectación parcial o intermitente con solución alternativa razonable.</p>
                  <p>
                    <strong>Respuesta inicial:</strong> hasta 1 día hábil.
                  </p>
                </InfoBox>
                <InfoBox title='Severidad 4 — Baja'>
                  <p>Consultas, configuraciones o fallas menores.</p>
                  <p>
                    <strong>Respuesta inicial:</strong> hasta 2 días hábiles.
                  </p>
                </InfoBox>
              </div>

              <SubH>6.7 Créditos de servicio</SubH>
              <BulletList>
                <li>
                  <strong>Menor a 99.9% y mayor o igual a 99.0%:</strong> crédito del 10% del cargo mensual del servicio
                  afectado.
                </li>
                <li>
                  <strong>Menor a 99.0% y mayor o igual a 95.0%:</strong> crédito del 25% del cargo mensual del servicio
                  afectado.
                </li>
                <li>
                  <strong>Menor a 95.0%:</strong> crédito del 100% del cargo mensual del servicio afectado.
                </li>
              </BulletList>

              <SubH>6.8 Procedimiento de reclamación</SubH>
              <p>
                El Cliente deberá presentar su solicitud dentro de los 15 días hábiles siguientes al mes afectado,
                acompañando evidencia razonable del incidente.
              </p>

              <SubH>6.9 Remedio exclusivo</SubH>
              <p>
                Salvo disposición legal imperativa en contrario, los créditos de servicio constituyen el remedio
                económico principal y exclusivo frente a incumplimientos de disponibilidad bajo este SLA.
              </p>
            </Section>

            {/* 7. Arbitraje */}
            <Section id='arbitraje' title='7. Ley aplicable y resolución de controversias'>
              <SubH>7.1 Negociación previa</SubH>
              <p>
                Toda controversia, reclamación, diferencia o disputa derivada de o relacionada con la Plataforma, sus
                servicios, el tratamiento de Datos, la disponibilidad del servicio, la relación contractual o el uso por
                parte del Usuario procurará resolverse inicialmente mediante negociación directa de buena fe entre las
                partes.
              </p>

              <SubH>7.2 Resolución amistosa previa</SubH>
              <p>
                La parte reclamante deberá notificar por escrito a la otra parte, exponiendo los hechos, fundamentos y
                pretensión. Las partes dispondrán de un plazo de <strong>treinta (30) días continuos</strong> contados a
                partir de la recepción de dicha notificación para intentar una solución amistosa.
              </p>

              <SubH>7.3 Arbitraje</SubH>
              <p>
                Toda controversia que no pueda resolverse amistosamente será decidida mediante{' '}
                <strong>arbitraje de derecho</strong>, confidencial, vinculante y definitivo.
              </p>
              <p>
                El arbitraje será administrado por el{' '}
                <strong>Centro de Arbitraje de la Cámara de Comercio de Maracaibo</strong>, o por el centro arbitral que
                lo sustituya o resulte competente por acuerdo de las partes, de conformidad con su reglamento vigente
                para la fecha de presentación de la demanda arbitral.
              </p>

              <SubH>7.4 Sede, idioma y número de árbitros</SubH>
              <p>
                La sede del arbitraje será <strong>Maracaibo, Estado Zulia, República Bolivariana de Venezuela</strong>.
                El idioma del arbitraje será el <strong>español</strong>. El arbitraje será decidido por{' '}
                <strong>un (1) árbitro</strong> cuando la cuantía o complejidad no amerite tribunal colegiado, o por{' '}
                <strong>tres (3) árbitros</strong> cuando así lo disponga el reglamento aplicable o la naturaleza de la
                controversia lo justifique.
              </p>

              <SubH>7.5 Ley aplicable</SubH>
              <p>
                El presente documento se regirá e interpretará conforme a los principios del comercio electrónico, la
                contratación digital y la normativa aplicable determinada por la sede arbitral, sin perjuicio de la
                aplicación obligatoria de normas imperativas de protección de datos, consumidores, servicios digitales o
                comercio electrónico que resulten aplicables por razón del domicilio del Usuario, del mercado objetivo o
                de la naturaleza transfronteriza de la operación.
              </p>

              <SubH>7.6 Medidas urgentes</SubH>
              <p>
                Nada impedirá a la Plataforma solicitar medidas cautelares, preventivas, de aseguramiento, preservación
                de evidencia, protección de datos, cese de uso indebido o tutela urgente ante autoridades competentes
                cuando ello sea necesario para evitar daños inminentes o preservar derechos.
              </p>
            </Section>

            {/* 8. Aceptación */}
            <Section id='aceptacion' title='8. Aceptación digital'>
              <div className='flex flex-col gap-3'>
                <AcceptItem
                  title='Aceptación general.'
                  body='Declaro que he leído y acepto los Términos y Condiciones de Uso, la Política de Privacidad, la Política de Uso Aceptable y Antifraude, y el Acuerdo de Nivel de Servicio (SLA) de Vitriona.app.'
                />
                <AcceptItem
                  title='Tratamiento de datos.'
                  body='Autorizo el tratamiento de mis datos para fines de autenticación, prevención de fraude, soporte, analítica, inteligencia comercial, marketing, segmentación, personalización y uso de información derivada, agregada, anonimizada, pseudonimizada o estratégicamente procesada, conforme a la Política de Privacidad de Vitriona.app y a la normativa aplicable.'
                />
                <AcceptItem
                  title='Identidad y cooperación legal.'
                  body='Declaro que la información de identificación personal y fiscal suministrada es veraz, vigente y verificable, y acepto que Vitriona.app podrá requerir validaciones adicionales, suspender mi cuenta ante inconsistencias y cooperar con autoridades competentes cuando existan indicios razonables de actividad ilícita o requerimientos legalmente válidos.'
                />
              </div>
            </Section>

            {/* 9. Contacto */}
            <Section id='contacto' title='9. Contacto legal y corporativo'>
              <p className='text-muted-foreground mb-5 text-sm'>
                Para reclamos, privacidad, cumplimiento o cualquier asunto formal que no deba perderse en un buzón
                olvidado.
              </p>
              <div className='grid gap-4 md:grid-cols-2'>
                <InfoBox title='CLI SOFTWARE HOUSE, C.A.'>
                  <p>
                    <strong>Correo:</strong>{' '}
                    <a className='text-primary hover:underline' href='mailto:info@clisoftwarehouse.com'>
                      info@clisoftwarehouse.com
                    </a>
                  </p>
                  <p>
                    <strong>Teléfono:</strong> +58 412-1985228
                  </p>
                </InfoBox>
                <InfoBox title='Domicilio fiscal'>
                  <p>
                    Calle 81, Quinta Nro. 71A-23, Urbanización Las Lomas, Maracaibo, Estado Zulia, Zona Postal 4002,
                    República Bolivariana de Venezuela.
                  </p>
                </InfoBox>
              </div>
              <p className='text-muted-foreground mt-5 text-xs'>
                Si alguna disposición de este documento fuese declarada inválida, inaplicable o ineficaz, ello no
                afectará la validez de las demás disposiciones, las cuales continuarán plenamente vigentes.
              </p>
              <p className='text-muted-foreground mt-4 text-xs'>
                ¿Necesitas volver a la{' '}
                <Link href='/' className='text-primary hover:underline'>
                  página principal
                </Link>
                ?
              </p>
            </Section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className='border-border/60 bg-card/40 scroll-mt-28 rounded-2xl border p-6 shadow-sm md:p-8'>
      <h2 className='mb-2 text-xl font-semibold tracking-tight md:text-2xl'>{title}</h2>
      <div className='text-foreground/90 space-y-3 text-sm leading-relaxed md:text-[15px]'>{children}</div>
    </section>
  );
}

function SubH({ children }: { children: React.ReactNode }) {
  return <h3 className='text-foreground mt-6 mb-2 text-base font-semibold md:text-lg'>{children}</h3>;
}

function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='border-border/60 bg-background/40 rounded-xl border p-4'>
      <p className='mb-2 text-sm font-semibold'>{title}</p>
      <div className='text-foreground/80 space-y-2 text-sm'>{children}</div>
    </div>
  );
}

function BulletList({ children }: { children: React.ReactNode }) {
  return <ul className='text-foreground/90 mt-2 list-disc space-y-2 pl-6 text-sm'>{children}</ul>;
}

function AcceptItem({ title, body }: { title: string; body: string }) {
  return (
    <div className='border-border/60 bg-background/40 flex items-start gap-3 rounded-xl border p-4'>
      <div className='bg-primary/10 text-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold'>
        ✓
      </div>
      <p className='text-foreground/90 text-sm leading-relaxed'>
        <strong>{title}</strong> {body}
      </p>
    </div>
  );
}
