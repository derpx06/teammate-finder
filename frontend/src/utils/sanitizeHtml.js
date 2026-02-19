const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

const isSafeUrl = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return false;
    if (raw.startsWith('#') || raw.startsWith('/')) return true;

    try {
        const baseOrigin = typeof window !== 'undefined' && window.location
            ? window.location.origin
            : 'http://localhost';
        const parsed = new URL(raw, baseOrigin);
        return SAFE_PROTOCOLS.has(parsed.protocol);
    } catch (_error) {
        return false;
    }
};

const stripDangerousAttributes = (element) => {
    [...element.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value;

        if (name.startsWith('on')) {
            element.removeAttribute(attr.name);
            return;
        }

        if (name === 'style') {
            element.removeAttribute(attr.name);
            return;
        }

        if ((name === 'href' || name === 'src') && !isSafeUrl(value)) {
            element.removeAttribute(attr.name);
        }
    });
};

const stripDangerousNodes = (root) => {
    root.querySelectorAll('script, style, iframe, object, embed, link, meta, base, form, input, button, textarea, select').forEach((node) => {
        node.remove();
    });
};

export const sanitizeHtml = (html) => {
    const source = String(html || '').trim();
    if (!source) return '';

    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
        return source
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(source, 'text/html');

        stripDangerousNodes(doc.body);
        doc.body.querySelectorAll('*').forEach((element) => {
            stripDangerousAttributes(element);
        });

        return doc.body.innerHTML;
    } catch (_error) {
        return source
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
    }
};
