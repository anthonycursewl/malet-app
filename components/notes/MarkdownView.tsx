import { memo, useMemo } from 'react';
import { Linking } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import CodeBlock from './CodeBlock';
import { markdownStyles } from './markdownStyles';

/** Parser estable: GFM (tablas, tachado), autolinks y comillas tipográficas. */
const markdownit = new MarkdownIt({
    typographer: true,
    linkify: true,
    breaks: false,
});

/**
 * Convierte `- [ ]` / `- [x]` en un bullet con checkbox legible. El Markdown
 * sigue guardándose crudo; esto solo afecta al render.
 */
const preprocessTaskLists = (content: string): string =>
    content.replace(
        /^(\s*)[-*+]\s+\[([ xX])\]\s+/gm,
        (_match, indent: string, mark: string) =>
            `${indent}- ${mark.toLowerCase() === 'x' ? '☑' : '☐'} `
    );

/** Render de Markdown con estilo Notion (memoizado por contenido). */
const MarkdownView = memo(function MarkdownView({ content }: { content: string }) {
    const prepared = useMemo(() => preprocessTaskLists(content ?? ''), [content]);

    return (
        <Markdown
            markdownit={markdownit}
            style={markdownStyles}
            rules={{
                fence: (node: any) => (
                    <CodeBlock
                        key={node.key}
                        code={node.content ?? ''}
                        language={node.info}
                    />
                ),
                code_block: (node: any) => (
                    <CodeBlock key={node.key} code={node.content ?? ''} />
                ),
            }}
            onLinkPress={(url) => {
                if (/^(https?:|mailto:)/i.test(url)) {
                    Linking.openURL(url).catch(() => undefined);
                }
                return false;
            }}
        >
            {prepared}
        </Markdown>
    );
});

export default MarkdownView;
