import {
    Archive,
    ArrowUpRight,
    BadgeCheck,
    Bold,
    BookOpen,
    Check,
    ChevronLeft,
    CircleHelp,
    Code as CodeIcon,
    FileText,
    Heading1,
    Heading2,
    Italic,
    Lightbulb,
    Link,
    Link2,
    List,
    ListChecks,
    LocateFixed,
    Minus,
    MousePointer2,
    Move,
    Network,
    Pencil,
    Pin,
    Plus,
    Quote,
    RefreshCw,
    Search,
    Trash2,
    LucideIcon,
} from 'lucide-react-native';
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import NotesHeader from '@/components/notes/NotesHeader';

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={styles.section}>
            <TextMalet style={styles.sectionTitle}>{title}</TextMalet>
            <View style={styles.card}>{children}</View>
        </View>
    );
}

function Item({
    icon: Icon,
    title,
    children,
}: {
    icon: LucideIcon;
    title: string;
    children: ReactNode;
}) {
    return (
        <View style={styles.item}>
            <View style={styles.iconWrap}>
                <Icon size={16} color="#37352f" />
            </View>
            <View style={styles.itemTexts}>
                <TextMalet style={styles.itemTitle}>{title}</TextMalet>
                <TextMalet style={styles.itemText}>{children}</TextMalet>
            </View>
        </View>
    );
}

function Code({ children }: { children: string }) {
    return <TextMalet style={styles.code}>{children}</TextMalet>;
}

/** Guía completa de Notas: qué es, cómo usarla y qué hace cada botón. */
export default function NotesHelpScreen() {
    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <NotesHeader
                    title="Ayuda de Notas"
                    subtitle="Guía rápida y significado de cada botón"
                />

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.hero}>
                        <View style={styles.heroIcon}>
                            <BookOpen size={22} color="#111" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <TextMalet style={styles.heroTitle}>
                                Tu cerebro de notas
                            </TextMalet>
                            <TextMalet style={styles.heroText}>
                                Notas es una libreta Markdown con estilo de
                                feed: escribe por bloques, conecta notas con
                                wiki-links y explora todo como un mapa de
                                conocimiento.
                            </TextMalet>
                        </View>
                    </View>

                    <Section title="Primeros pasos">
                        <Item icon={Plus} title="Crear una nota">
                            Toca el botón flotante <Code>+</Code> de la esquina
                            inferior derecha. También puedes tocar el botón{' '}
                            <Code>Tutorial</Code> para generar una nota de
                            ejemplo.
                        </Item>
                        <Item icon={Pencil} title="Escribir por bloques">
                            La línea actual se edita como texto plano. Al
                            pulsar <Code>Enter</Code> ese bloque se renderiza
                            con su estilo final. Toca un bloque ya renderizado
                            para volver a editarlo.
                        </Item>
                        <Item icon={Check} title="Guardar">
                            Las notas existentes se guardan solas (~1 s). El
                            check de la cabecera guarda al instante y vuelve a
                            la vista de lectura. En una nota nueva, el check la
                            crea.
                        </Item>
                        <Item icon={Search} title="Buscar">
                            El buscador filtra tus notas por título y contenido.
                            Mientras escribes, la lista se actualiza sola.
                        </Item>
                    </Section>

                    <Section title="Cabecera de Notas">
                        <Item icon={CircleHelp} title="Ayuda">
                            Abre esta guía desde la cabecera del listado de
                            Notas.
                        </Item>
                        <Item icon={Network} title="Mapa de notas">
                            Abre el mapa global con tus notas y enlaces.
                        </Item>
                        <Item icon={BookOpen} title="Tutorial">
                            Crea la nota de tutorial si no existe; si ya
                            existe, la abre directamente.
                        </Item>
                    </Section>

                    <Section title="Barra de formato (abajo)">
                        <Item icon={Heading1} title="Título 1">
                            Convierte el bloque actual en un título grande
                            (<Code># </Code>).
                        </Item>
                        <Item icon={Heading2} title="Título 2">
                            Convierte el bloque actual en un subtítulo
                            (<Code>## </Code>).
                        </Item>
                        <Item icon={Bold} title="Negrita">
                            Envuelve el texto seleccionado con{' '}
                            <Code>**texto**</Code>.
                        </Item>
                        <Item icon={Italic} title="Cursiva">
                            Envuelve el texto seleccionado con{' '}
                            <Code>_texto_</Code>.
                        </Item>
                        <Item icon={List} title="Lista">
                            Convierte el bloque en una lista con viñetas
                            (<Code>- </Code>).
                        </Item>
                        <Item icon={ListChecks} title="Checklist">
                            Convierte el bloque en una tarea (
                            <Code>- [ ] </Code>). Pulsa Enter y la lista
                            continúa sola.
                        </Item>
                        <Item icon={Quote} title="Cita">
                            Convierte el bloque en una cita (<Code>&gt; </Code>
                            ).
                        </Item>
                        <Item icon={CodeIcon} title="Código">
                            Envuelve el bloque en un bloque de código. En la
                            vista de lectura se muestra con resaltado de
                            sintaxis, números de línea y botón para copiar.
                        </Item>
                        <Item icon={Link} title="Enlace web">
                            Inserta un enlace Markdown normal:{' '}
                            <Code>[texto](https://...)</Code>.
                        </Item>
                        <Item icon={Link2} title="Enlazar nota">
                            Abre el buscador para insertar un wiki-link a otra
                            nota: <Code>[[Título]]</Code>.
                        </Item>
                        <Item icon={Minus} title="Divisor">
                            Inserta una línea separadora (<Code>---</Code>) y
                            deja un bloque nuevo debajo.
                        </Item>
                    </Section>

                    <Section title="Wiki-links: conecta tus notas">
                        <Item icon={Link2} title="Enlace a otra nota">
                            Escribe <Code>[[</Code> y elige una nota; también
                            puedes usar el botón de enlazar de la barra
                            inferior. El enlace se guarda como{' '}
                            <Code>[[Título]]</Code>.
                        </Item>
                        <Item icon={Link2} title="Texto visible distinto">
                            Usa <Code>[[Título|texto visible]]</Code> para que
                            el enlace muestre otro texto.
                        </Item>
                        <Item icon={Plus} title="Enlace pendiente">
                            Si la nota no existe, el enlace se ve gris. Tócalo
                            para crear la nota con ese título.
                        </Item>
                        <Item icon={Network} title="Backlinks y mapa local">
                            Al final de cada nota verás <Code>Enlaces</Code>,
                            <Code>Mencionada en</Code> y un{' '}
                            <Code>Mapa local</Code> con sus conexiones.
                        </Item>
                        <Item icon={Pencil} title="Renombrar">
                            Si cambias el título de una nota, los wiki-links de
                            otras notas se actualizan automáticamente.
                        </Item>
                        <Item icon={CodeIcon} title="Ojo con el código">
                            No uses <Code>[[...]]</Code> dentro de bloques de
                            código: ahí se trata como texto literal.
                        </Item>
                    </Section>

                    <Section title="Feed de notas (estilo tweet)">
                        <Item icon={BadgeCheck} title="Foto, nombre y verificado">
                            Cada post muestra tu foto de perfil, tu nombre,
                            usuario, la fecha y el badge de verificación si tu
                            cuenta lo tiene.
                        </Item>
                        <Item icon={Pin} title="Fijar">
                            Mantiene la nota arriba del feed. El icono se pone
                            ámbar cuando está fijada.
                        </Item>
                        <Item icon={FileText} title="Conteo de palabras">
                            El número junto al icono de documento indica
                            cuántas palabras tiene la nota.
                        </Item>
                        <Item icon={Archive} title="Archivar">
                            Oculta la nota del feed (no la borra). Aparece un
                            aviso con <Code>Deshacer</Code> por si te
                            equivocas.
                        </Item>
                        <Item icon={ArrowUpRight} title="Abrir">
                            Abre la nota en modo lectura. También puedes tocar
                            el cuerpo del post.
                        </Item>
                    </Section>

                    <Section title="Vista de una nota">
                        <Item icon={Pin} title="Fijar / desfijar">
                            Las notas fijadas aparecen primero en el feed.
                        </Item>
                        <Item icon={Pencil} title="Editar">
                            Entra al editor por bloques. Para volver a lectura,
                            usa el check.
                        </Item>
                        <Item icon={Trash2} title="Eliminar">
                            Borra la nota. Puedes deshacerlo desde el aviso.
                        </Item>
                        <Item icon={Check} title="Guardar y volver">
                            Fuerza el guardado y regresa a la vista de lectura.
                        </Item>
                        <Item icon={BookOpen} title="Cargar tutorial">
                            En una nota nueva y vacía aparece este icono de
                            libro: rellena el editor con la guía de ejemplo.
                        </Item>
                        <Item icon={ChevronLeft} title="Volver">
                            La flecha de la cabecera regresa a la pantalla
                            anterior; si no hay historial, va al inicio.
                        </Item>
                    </Section>

                    <Section title="Mapa de conocimiento">
                        <Item icon={Network} title="Abrir el mapa">
                            El icono de red en la cabecera de Notas abre el
                            mapa global de tus notas y enlaces.
                        </Item>
                        <Item icon={Move} title="Arrastrar y zoom">
                            Arrastra con un dedo para moverte. Pellizca con dos
                            dedos para acercar o alejar.
                        </Item>
                        <Item icon={Plus} title="Acercar">
                            El botón <Code>+</Code> del mapa aumenta el zoom.
                            Al acercarte se muestran solo los nodos visibles.
                        </Item>
                        <Item icon={Minus} title="Alejar">
                            El botón <Code>−</Code> reduce el zoom y vuelve a la
                            vista general.
                        </Item>
                        <Item icon={LocateFixed} title="Centrar">
                            Restablece el zoom y la posición inicial del mapa.
                        </Item>
                        <Item icon={MousePointer2} title="Seleccionar un nodo">
                            Toca un nodo para resaltar sus conexiones y ver sus
                            vecinos. Tócalo otra vez para abrir la nota.
                        </Item>
                        <Item icon={RefreshCw} title="Actualizar">
                            El icono de recarga vuelve a leer las notas y
                            enlaces por si cambiaste algo en otra pantalla.
                        </Item>
                    </Section>

                    <Section title="Buenas prácticas">
                        <Item icon={Lightbulb} title="Una idea por nota">
                            Notas cortas y bien enlazadas son más fáciles de
                            encontrar y de visualizar en el mapa.
                        </Item>
                        <Item icon={Pin} title="Fija lo importante">
                            Usa el pin para tus índices, proyectos activos o
                            notas de referencia.
                        </Item>
                        <Item icon={Link2} title="Enlaza en vez de duplicar">
                            Si dos notas hablan de lo mismo, enlázalas. El mapa
                            refleja esas relaciones y los backlinks te avisan.
                        </Item>
                        <Item icon={ListChecks} title="Usa checklists">
                            Para tareas y pasos pendientes. Se continúan solas
                            al pulsar Enter.
                        </Item>
                    </Section>

                    <TextMalet style={styles.footer}>
                        Los títulos son únicos por usuario: dos personas pueden
                        tener la misma nota, pero dentro de tu cuenta no se
                        repiten.
                    </TextMalet>
                </ScrollView>
            </View>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 48,
        gap: 18,
    },
    hero: {
        flexDirection: 'row',
        gap: 12,
        borderWidth: 1,
        borderColor: '#ececeb',
        borderRadius: 16,
        padding: 14,
        backgroundColor: '#fff',
    },
    heroIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#f7f6f3',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f1f1f',
        marginBottom: 3,
    },
    heroText: {
        fontSize: 12.5,
        lineHeight: 18,
        color: '#6b6b6b',
    },
    section: {
        gap: 8,
    },
    sectionTitle: {
        fontSize: 11.5,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        paddingHorizontal: 2,
    },
    card: {
        borderWidth: 1,
        borderColor: '#ececeb',
        borderRadius: 14,
        padding: 14,
        gap: 14,
        backgroundColor: '#fff',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#f7f6f3',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemTexts: {
        flex: 1,
        gap: 2,
    },
    itemTitle: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#1f1f1f',
    },
    itemText: {
        fontSize: 12.5,
        lineHeight: 18,
        color: '#6b6b6b',
    },
    code: {
        fontSize: 11.5,
        fontFamily: 'monospace',
        color: '#eb5757',
        backgroundColor: '#f1f1ef',
        borderRadius: 3,
        paddingHorizontal: 3,
    },
    footer: {
        fontSize: 11.5,
        color: '#9a9a9a',
        lineHeight: 16,
        paddingHorizontal: 4,
    },
});
