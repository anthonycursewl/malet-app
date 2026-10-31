import { FlashList } from '@shopify/flash-list';
import {
    Archive,
    ArrowDown,
    ArrowUpRight,
    BadgeCheck,
    Bold,
    BookOpen,
    Check,
    ChevronLeft,
    CircleHelp,
    Code as CodeIcon,
    Copy,
    FileText,
    Globe,
    Heading1,
    Heading2,
    Italic,
    Lightbulb,
    Link,
    Link2,
    List,
    ListChecks,
    LocateFixed,
    Lock,
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
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import NotesHeader from '@/components/notes/NotesHeader';

type HelpRow =
    | { kind: 'hero'; key: string }
    | { kind: 'section'; key: string; title: string }
    | {
          kind: 'item';
          key: string;
          icon: LucideIcon;
          title: string;
          body: string;
      }
    | { kind: 'footer'; key: string; text: string };

/**
 * Filas planas para que FlashList monte solo lo visible. El contenido es texto
 * con tramos entre backticks: así la pantalla no crea todo el árbol de una vez.
 */
const HELP_ROWS: HelpRow[] = [
    { kind: 'hero', key: 'hero' },

    { kind: 'section', key: 'sec-start', title: 'Primeros pasos' },
    {
        kind: 'item',
        key: 'create',
        icon: Plus,
        title: 'Crear una nota',
        body: 'Toca el botón flotante `+` de la esquina inferior derecha. También puedes tocar el botón `Tutorial` para generar una nota de ejemplo.',
    },
    {
        kind: 'item',
        key: 'blocks',
        icon: Pencil,
        title: 'Escribir por bloques',
        body: 'La línea actual se edita como texto plano. Al pulsar `Enter` ese bloque se renderiza con su estilo final. Toca un bloque ya renderizado para volver a editarlo.',
    },
    {
        kind: 'item',
        key: 'save',
        icon: Check,
        title: 'Guardar',
        body: 'Las notas existentes se guardan solas (~1 s). El check de la cabecera guarda al instante y vuelve a la vista de lectura. En una nota nueva, el check la crea.',
    },
    {
        kind: 'item',
        key: 'search',
        icon: Search,
        title: 'Buscar',
        body: 'El buscador filtra tus notas por título y contenido. Mientras escribes, la lista se actualiza sola.',
    },

    { kind: 'section', key: 'sec-header', title: 'Cabecera de Notas' },
    {
        kind: 'item',
        key: 'help',
        icon: CircleHelp,
        title: 'Ayuda',
        body: 'Abre esta guía desde la cabecera del listado de Notas.',
    },
    {
        kind: 'item',
        key: 'map-entry',
        icon: Network,
        title: 'Mapa de notas',
        body: 'Abre el mapa global con tus notas y enlaces.',
    },
    {
        kind: 'item',
        key: 'tutorial',
        icon: BookOpen,
        title: 'Tutorial',
        body: 'Crea la nota de tutorial si no existe; si ya existe, la abre directamente.',
    },

    { kind: 'section', key: 'sec-format', title: 'Barra de formato (abajo)' },
    {
        kind: 'item',
        key: 'h1',
        icon: Heading1,
        title: 'Título 1',
        body: 'Convierte el bloque actual en un título grande (`# `).',
    },
    {
        kind: 'item',
        key: 'h2',
        icon: Heading2,
        title: 'Título 2',
        body: 'Convierte el bloque actual en un subtítulo (`## `).',
    },
    {
        kind: 'item',
        key: 'bold',
        icon: Bold,
        title: 'Negrita',
        body: 'Envuelve el texto seleccionado con `**texto**`.',
    },
    {
        kind: 'item',
        key: 'italic',
        icon: Italic,
        title: 'Cursiva',
        body: 'Envuelve el texto seleccionado con `_texto_`.',
    },
    {
        kind: 'item',
        key: 'list',
        icon: List,
        title: 'Lista',
        body: 'Convierte el bloque en una lista con viñetas (`- `).',
    },
    {
        kind: 'item',
        key: 'checklist',
        icon: ListChecks,
        title: 'Checklist',
        body: 'Convierte el bloque en una tarea (`- [ ] `). Pulsa `Enter` y la lista continúa sola.',
    },
    {
        kind: 'item',
        key: 'quote',
        icon: Quote,
        title: 'Cita',
        body: 'Convierte el bloque en una cita (`> `).',
    },
    {
        kind: 'item',
        key: 'code',
        icon: CodeIcon,
        title: 'Código',
        body: 'Envuelve el bloque en un bloque de código. En la vista de lectura se muestra con resaltado de sintaxis, números de línea y botón para copiar.',
    },
    {
        kind: 'item',
        key: 'link',
        icon: Link,
        title: 'Enlace web',
        body: 'Inserta un enlace Markdown normal: `[texto](https://...)`.',
    },
    {
        kind: 'item',
        key: 'link-note',
        icon: Link2,
        title: 'Enlazar nota',
        body: 'Abre el buscador para insertar un wiki-link a otra nota: `[[Título]]`.',
    },
    {
        kind: 'item',
        key: 'divider',
        icon: Minus,
        title: 'Divisor',
        body: 'Inserta una línea separadora (`---`) y deja un bloque nuevo debajo.',
    },

    { kind: 'section', key: 'sec-wiki', title: 'Wiki-links: conecta tus notas' },
    {
        kind: 'item',
        key: 'wiki-link',
        icon: Link2,
        title: 'Enlace a otra nota',
        body: 'Escribe `[[` y elige una nota; también puedes usar el botón de enlazar de la barra inferior. El enlace se guarda como `[[Título]]`.',
    },
    {
        kind: 'item',
        key: 'wiki-alias',
        icon: Link2,
        title: 'Texto visible distinto',
        body: 'Usa `[[Título|texto visible]]` para que el enlace muestre otro texto.',
    },
    {
        kind: 'item',
        key: 'wiki-pending',
        icon: Plus,
        title: 'Enlace pendiente',
        body: 'Si la nota no existe, el enlace se ve gris. Tócalo para crear la nota con ese título.',
    },
    {
        kind: 'item',
        key: 'wiki-backlinks',
        icon: Network,
        title: 'Backlinks y mapa local',
        body: 'Al final de cada nota verás `Enlaces`, `Mencionada en` y un `Mapa local` con sus conexiones.',
    },
    {
        kind: 'item',
        key: 'wiki-backlinks-more',
        icon: ArrowDown,
        title: 'Ver más menciones',
        body: 'Las notas que te mencionan se muestran de 10 en 10. Pulsa `Ver más` para cargar otras 10.',
    },
    {
        kind: 'item',
        key: 'wiki-rename',
        icon: Pencil,
        title: 'Renombrar',
        body: 'Si cambias el título de una nota, los wiki-links de otras notas se actualizan automáticamente.',
    },
    {
        kind: 'item',
        key: 'wiki-code',
        icon: CodeIcon,
        title: 'Ojo con el código',
        body: 'No uses `[[...]]` dentro de bloques de código: ahí se trata como texto literal.',
    },

    { kind: 'section', key: 'sec-feed', title: 'Feed de notas (estilo tweet)' },
    {
        kind: 'item',
        key: 'feed-author',
        icon: BadgeCheck,
        title: 'Foto, nombre y verificado',
        body: 'Cada post muestra tu foto de perfil, tu nombre, usuario, la fecha y el badge de verificación si tu cuenta lo tiene.',
    },
    {
        kind: 'item',
        key: 'feed-pin',
        icon: Pin,
        title: 'Fijar',
        body: 'Mantiene la nota arriba del feed. El icono se pone ámbar cuando está fijada.',
    },
    {
        kind: 'item',
        key: 'feed-words',
        icon: FileText,
        title: 'Conteo de palabras',
        body: 'El número junto al icono de documento indica cuántas palabras tiene la nota.',
    },
    {
        kind: 'item',
        key: 'feed-archive',
        icon: Archive,
        title: 'Archivar',
        body: 'Oculta la nota del feed (no la borra). Aparece un aviso con `Deshacer` por si te equivocas.',
    },
    {
        kind: 'item',
        key: 'feed-visibility',
        icon: Globe,
        title: 'Privada o pública',
        body: 'El candado indica que la nota es privada; el globo, que es pública. Cada post muestra su estado junto a la fecha.',
    },
    {
        kind: 'item',
        key: 'feed-open',
        icon: ArrowUpRight,
        title: 'Abrir',
        body: 'Abre la nota en modo lectura. También puedes tocar el cuerpo del post.',
    },
    {
        kind: 'item',
        key: 'feed-more',
        icon: ArrowDown,
        title: 'Cargar más notas',
        body: 'Al llegar al final del feed se cargan las siguientes notas automáticamente. Mientras llegan verás un skeleton con la forma de los posts.',
    },

    { kind: 'section', key: 'sec-note', title: 'Vista de una nota' },
    {
        kind: 'item',
        key: 'note-pin',
        icon: Pin,
        title: 'Fijar / desfijar',
        body: 'Las notas fijadas aparecen primero en el feed.',
    },
    {
        kind: 'item',
        key: 'note-edit',
        icon: Pencil,
        title: 'Editar',
        body: 'Entra al editor por bloques. Para volver a lectura, usa el check.',
    },
    {
        kind: 'item',
        key: 'note-delete',
        icon: Trash2,
        title: 'Eliminar',
        body: 'Borra la nota. Puedes deshacerlo desde el aviso.',
    },
    {
        kind: 'item',
        key: 'note-save',
        icon: Check,
        title: 'Guardar y volver',
        body: 'Fuerza el guardado y regresa a la vista de lectura.',
    },
    {
        kind: 'item',
        key: 'note-tutorial',
        icon: BookOpen,
        title: 'Cargar tutorial',
        body: 'En una nota nueva y vacía aparece este icono de libro: rellena el editor con la guía de ejemplo.',
    },
    {
        kind: 'item',
        key: 'note-private',
        icon: Lock,
        title: 'Privada',
        body: 'Solo tú puedes verla. Toca el candado de la cabecera para hacerla pública.',
    },
    {
        kind: 'item',
        key: 'note-public',
        icon: Globe,
        title: 'Pública',
        body: 'Cualquiera con el enlace puede verla en la web, sin iniciar sesión. Toca el globo para volver a privada.',
    },
    {
        kind: 'item',
        key: 'note-copy',
        icon: Copy,
        title: 'Copiar código',
        body: 'En la vista de lectura, los bloques de código tienen un botón para copiar su contenido.',
    },
    {
        kind: 'item',
        key: 'note-back',
        icon: ChevronLeft,
        title: 'Volver',
        body: 'La flecha de la cabecera regresa a la pantalla anterior; si no hay historial, va al inicio.',
    },

    { kind: 'section', key: 'sec-map', title: 'Mapa de conocimiento' },
    {
        kind: 'item',
        key: 'map-open',
        icon: Network,
        title: 'Abrir el mapa',
        body: 'El icono de red en la cabecera de Notas abre el mapa global de tus notas y enlaces.',
    },
    {
        kind: 'item',
        key: 'map-move',
        icon: Move,
        title: 'Arrastrar y zoom',
        body: 'Arrastra con un dedo para moverte. Pellizca con dos dedos para acercar o alejar.',
    },
    {
        kind: 'item',
        key: 'map-in',
        icon: Plus,
        title: 'Acercar',
        body: 'El botón `+` del mapa aumenta el zoom. Al acercarte se muestran solo los nodos visibles.',
    },
    {
        kind: 'item',
        key: 'map-out',
        icon: Minus,
        title: 'Alejar',
        body: 'El botón `−` reduce el zoom y vuelve a la vista general.',
    },
    {
        kind: 'item',
        key: 'map-center',
        icon: LocateFixed,
        title: 'Centrar',
        body: 'Restablece el zoom y la posición inicial del mapa.',
    },
    {
        kind: 'item',
        key: 'map-select',
        icon: MousePointer2,
        title: 'Seleccionar un nodo',
        body: 'Toca un nodo para resaltar sus conexiones y ver sus vecinos. Tócalo otra vez para abrir la nota.',
    },
    {
        kind: 'item',
        key: 'map-refresh',
        icon: RefreshCw,
        title: 'Actualizar',
        body: 'El icono de recarga vuelve a leer las notas y enlaces por si cambiaste algo en otra pantalla.',
    },

    { kind: 'section', key: 'sec-best', title: 'Buenas prácticas' },
    {
        kind: 'item',
        key: 'best-idea',
        icon: Lightbulb,
        title: 'Una idea por nota',
        body: 'Notas cortas y bien enlazadas son más fáciles de encontrar y de visualizar en el mapa.',
    },
    {
        kind: 'item',
        key: 'best-pin',
        icon: Pin,
        title: 'Fija lo importante',
        body: 'Usa el pin para tus índices, proyectos activos o notas de referencia.',
    },
    {
        kind: 'item',
        key: 'best-link',
        icon: Link2,
        title: 'Enlaza en vez de duplicar',
        body: 'Si dos notas hablan de lo mismo, enlázalas. El mapa refleja esas relaciones y los backlinks te avisan.',
    },
    {
        kind: 'item',
        key: 'best-checklist',
        icon: ListChecks,
        title: 'Usa checklists',
        body: 'Para tareas y pasos pendientes. Se continúan solas al pulsar `Enter`.',
    },

    {
        kind: 'footer',
        key: 'footer',
        text: 'Los títulos son únicos por usuario: dos personas pueden tener la misma nota, pero dentro de tu cuenta no se repiten.',
    },
];

/** Texto con tramos `así` convertidos en código en línea. */
function RichText({ text }: { text: string }) {
    const parts = text.split('`');

    return (
        <TextMalet style={styles.itemText}>
            {parts.map((part, index) =>
                index % 2 === 1 ? (
                    <TextMalet key={index} style={styles.code}>
                        {part}
                    </TextMalet>
                ) : (
                    part
                )
            )}
        </TextMalet>
    );
}

function Hero() {
    return (
        <View style={styles.hero}>
            <BookOpen size={24} color="#111" />
            <View style={styles.heroTexts}>
                <TextMalet style={styles.heroTitle}>
                    Tu cerebro de notas
                </TextMalet>
                <TextMalet style={styles.heroText}>
                    Notas es una libreta Markdown con estilo de feed: escribe
                    por bloques, conecta notas con wiki-links y explora todo
                    como un mapa de conocimiento.
                </TextMalet>
            </View>
        </View>
    );
}

function HelpItem({
    icon: Icon,
    title,
    body,
}: {
    icon: LucideIcon;
    title: string;
    body: string;
}) {
    return (
        <View style={styles.item}>
            <View style={styles.itemIcon}>
                <Icon size={18} color="#4a4a4a" />
            </View>
            <View style={styles.itemTexts}>
                <TextMalet style={styles.itemTitle}>{title}</TextMalet>
                <RichText text={body} />
            </View>
        </View>
    );
}

/** Guía de Notas: virtualizada para abrir al instante. */
export default function NotesHelpScreen() {
    const renderItem = useCallback(
        ({ item }: { item: HelpRow }) => {
            if (item.kind === 'hero') return <Hero />;
            if (item.kind === 'section') {
                return (
                    <TextMalet style={styles.sectionTitle}>
                        {item.title}
                    </TextMalet>
                );
            }
            if (item.kind === 'item') {
                return (
                    <HelpItem
                        icon={item.icon}
                        title={item.title}
                        body={item.body}
                    />
                );
            }
            return <TextMalet style={styles.footer}>{item.text}</TextMalet>;
        },
        []
    );

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <NotesHeader
                    title="Ayuda de Notas"
                    subtitle="Guía rápida y significado de cada botón"
                />

                <FlashList
                    style={styles.list}
                    data={HELP_ROWS}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.key}
                    getItemType={(item) => item.kind}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    drawDistance={320}
                    maxItemsInRecyclePool={18}
                    overrideProps={{ initialDrawBatchSize: 8 }}
                />
            </View>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    list: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 56,
    },
    hero: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingTop: 4,
        paddingBottom: 8,
    },
    heroTexts: {
        flex: 1,
        gap: 3,
    },
    heroTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f1f1f',
    },
    heroText: {
        fontSize: 13,
        lineHeight: 19,
        color: '#666',
    },
    sectionTitle: {
        marginTop: 20,
        marginBottom: 4,
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 7,
    },
    itemIcon: {
        width: 20,
        alignItems: 'center',
        paddingTop: 1,
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
        fontSize: 13,
        lineHeight: 19,
        color: '#5f5f5f',
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
        marginTop: 24,
        fontSize: 11.5,
        color: '#9a9a9a',
        lineHeight: 16,
    },
});
