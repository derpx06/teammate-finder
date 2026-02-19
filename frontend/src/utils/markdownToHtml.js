const escapeHtml = (value) =>
    String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const sanitizeUrl = (value) => {
    const raw = String(value || '').trim();
    try {
        const parsed = new URL(raw);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString();
        }
    } catch (_error) {
        return '';
    }
    return '';
};

const parseInlineMarkdown = (value) => {
    let text = escapeHtml(value);

    const codeTokens = [];
    text = text.replace(/`([^`]+)`/g, (_match, code) => {
        const token = `__INLINE_CODE_${codeTokens.length}__`;
        codeTokens.push(`<code>${code}</code>`);
        return token;
    });

    text = text.replace(/\[(.+?)\]\((.+?)\)/g, (_match, label, href) => {
        const safeUrl = sanitizeUrl(href);
        if (!safeUrl) return label;
        return `<a href="${safeUrl}" target="_blank" rel="noreferrer">${label}</a>`;
    });

    text = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        .replace(/~~(.+?)~~/g, '<del>$1</del>');

    codeTokens.forEach((snippet, index) => {
        text = text.replace(`__INLINE_CODE_${index}__`, snippet);
    });

    return text;
};

export const markdownToHtml = (markdown) => {
    const source = String(markdown || '').replace(/\r\n/g, '\n').trim();
    if (!source) return '';

    const lines = source.split('\n');
    const html = [];
    let paragraph = [];
    let listType = null;
    let inCodeBlock = false;
    let codeLines = [];

    const flushParagraph = () => {
        if (paragraph.length === 0) return;
        html.push(`<p>${parseInlineMarkdown(paragraph.join(' '))}</p>`);
        paragraph = [];
    };

    const closeList = () => {
        if (listType) {
            html.push(`</${listType}>`);
            listType = null;
        }
    };

    const flushCodeBlock = () => {
        const code = escapeHtml(codeLines.join('\n'));
        html.push(`<pre><code>${code}</code></pre>`);
        codeLines = [];
    };

    lines.forEach((line) => {
        const raw = String(line || '');
        const trimmed = raw.trim();

        if (trimmed.startsWith('```')) {
            flushParagraph();
            closeList();
            if (!inCodeBlock) {
                inCodeBlock = true;
            } else {
                flushCodeBlock();
                inCodeBlock = false;
            }
            return;
        }

        if (inCodeBlock) {
            codeLines.push(raw);
            return;
        }

        if (!trimmed) {
            flushParagraph();
            closeList();
            return;
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            flushParagraph();
            closeList();
            const level = headingMatch[1].length;
            html.push(`<h${level}>${parseInlineMarkdown(headingMatch[2])}</h${level}>`);
            return;
        }

        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            flushParagraph();
            closeList();
            html.push('<hr />');
            return;
        }

        const quoteMatch = trimmed.match(/^>\s?(.*)$/);
        if (quoteMatch) {
            flushParagraph();
            closeList();
            html.push(`<blockquote>${parseInlineMarkdown(quoteMatch[1])}</blockquote>`);
            return;
        }

        const unorderedMatch = trimmed.match(/^[-*+]\s+(.+)$/);
        if (unorderedMatch) {
            flushParagraph();
            if (listType !== 'ul') {
                closeList();
                listType = 'ul';
                html.push('<ul>');
            }
            html.push(`<li>${parseInlineMarkdown(unorderedMatch[1])}</li>`);
            return;
        }

        const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
        if (orderedMatch) {
            flushParagraph();
            if (listType !== 'ol') {
                closeList();
                listType = 'ol';
                html.push('<ol>');
            }
            html.push(`<li>${parseInlineMarkdown(orderedMatch[1])}</li>`);
            return;
        }

        paragraph.push(trimmed);
    });

    if (inCodeBlock) {
        flushCodeBlock();
    }
    flushParagraph();
    closeList();

    return html.join('\n');
};

