import DOMPurify from 'isomorphic-dompurify';

export function sanitizePlainText(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

export function sanitizeMultiline(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: ['br'], ALLOWED_ATTR: [] })
    .replace(/<br\s*\/?>/gi, '\n')
    .trim();
}

export function sanitizeHtml(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}
