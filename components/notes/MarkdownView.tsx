import { memo, useCallback, useMemo } from 'react';
import { Linking, Text } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import CodeBlock from './CodeBlock';
import { markdownStyles } from './markdownStyles';

/** Parser estable: GFM (tablas, tachado), autolinks y comillas tipográficas. */
const markdownit = new MarkdownIt({
    typographer: true,
    linkify: true,
    breaks: false,
});

const NOTE_SCHEME = 'malet-note:';
const NEW_NOTE_SCHEME = 'malet-note-new:';

const WIKI_REGEX =
    /\[\[([^\[\]|#\n]+)(?:#([^\[\]|\n]+))?(?:\|([^\[\]\n]+))?\]\]/g;

/**
 * Aplica cambios solo fuera de bloques y spans de código, para no tocar
 * `[[...]]` ni `- [ ]` que sean ejemplos literales.
 */
const processOutsideCode = (
    content: string,
    change: (segment: string) => string,
): string => {
    let inFence = false;

    return content
        .split('\n')
        .map((line) => {
            if (/^\s*(```|~~~)/.test(line)) {
                inFence = !inFence;
                return line;
            }
            if (inFence) return line;

            return line
                .split(/(`[^`]*`)/g)
                .map((part, index) => (index % 2 === 1 ? part : change(part)))
                .join('');
        })
        .join('\n');
};

/**
 * Convierte `[[Título|alias]]` en links de Markdown con un esquema propio, y
 * los checklists en glifos legibles. El Markdown guardado no se modifica.
 */
const prepareContent = (
    content: string,
    linkMap: Record<string, string>,
): string =>
    processOutsideCode(content ?? '', (segment) => {
        const withLinks = segment.replace(
            WIKI_REGEX,
            (_match, title: string, section?: string, alias?: string) => {
                const cleanTitle = title.trim();
                if (!cleanTitle) return _match;

                const targetId = linkMap[cleanTitle.toLowerCase()];
                const label =
                    (alias?.trim() || cleanTitle) +
                    (section?.trim() ? ` › ${section.trim()}` : '');
                const href = targetId
                    ? `${NOTE_SCHEME}${encodeURIComponent(targetId)}`
                    : `${NEW_NOTE_SCHEME}${encodeURIComponent(cleanTitle)}`;

                return `[${label.replace(/[\[\]]/g, '')}](${href})`;
            },
        );

        return withLinks.replace(
            /^(\s*)[-*+]\s+\[([ xX])\]\s+/gm,
            (_match, indent: string, mark: string) =>
                `${indent}- ${mark.toLowerCase() === 'x' ? '☑' : '☐'} `,
        );
    });

interface MarkdownViewProps {
    content: string;
    /** Título en minúsculas → id de la nota destino. */
    linkMap?: Record<string, string>;
    onOpenNote?: (id: string) => void;
    onCreateNote?: (title: string) => void;
}

/** Render de Markdown con estilo Notion (memoizado por contenido). */
const MarkdownView = memo(function MarkdownView({
    content,
    linkMap,
    onOpenNote,
    onCreateNote,
}: MarkdownViewProps) {
    const prepared = useMemo(
        () => prepareContent(content, linkMap ?? {}),
        [content, linkMap],
    );

    const openLink = useCallback(
        (url: string): boolean => {
            if (url.startsWith(NOTE_SCHEME)) {
                const id = decodeURIComponent(url.slice(NOTE_SCHEME.length));
                onOpenNote?.(id);
                return false;
            }
            if (url.startsWith(NEW_NOTE_SCHEME)) {
                const title = decodeURIComponent(
                    url.slice(NEW_NOTE_SCHEME.length),
                );
                onCreateNote?.(title);
                return false;
            }
            if (/^(https?:|mailto:)/i.test(url)) {
                Linking.openURL(url).catch(() => undefined);
            }
            return false;
        },
        [onOpenNote, onCreateNote],
    );

    const rules = useMemo(
        () => ({
            fence: (node: any) => (
                <CodeBlock
                    key={node.key}
                    code={node.content ?? ''}
                    language={node.sourceInfo ?? node.info}
                />
            ),
            code_block: (node: any) => (
                <CodeBlock key={node.key} code={node.content ?? ''} />
            ),
            link: (node: any, children: any, parent: any, styles: any) => {
                const href = node.attributes?.href ?? '';
                const pending = href.startsWith(NEW_NOTE_SCHEME);
                return (
                    <Text
                        key={node.key}
                        style={[styles.link, pending && markdownStyles.pendingLink]}
                        onPress={() => openLink(href)}
                    >
                        {children}
                    </Text>
                );
            },
            blocklink: (node: any, children: any, parent: any, styles: any) => {
                const href = node.attributes?.href ?? '';
                const pending = href.startsWith(NEW_NOTE_SCHEME);
                return (
                    <Text
                        key={node.key}
                        style={[styles.link, pending && markdownStyles.pendingLink]}
                        onPress={() => openLink(href)}
                    >
                        {children}
                    </Text>
                );
            },
        }),
        [openLink],
    );

    return (
        <Markdown
            markdownit={markdownit}
            style={markdownStyles}
            rules={rules}
            onLinkPress={openLink}
        >
            {prepared}
        </Markdown>
    );
});

export default MarkdownView;
