function decodeBasicEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value: string) {
  return decodeBasicEntities(value.replace(/<[^>]*>/g, ''));
}

export function sanitizePlainText(value: string): string {
  return stripTags(value).replace(/\s+/g, ' ').trim();
}

export function sanitizeMultiline(value: string): string {
  return stripTags(value.replace(/<\s*br\s*\/?\s*>/gi, '\n'))
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function sanitizeHtml(value: string): string {
  return sanitizeMultiline(value)
    .split('\n')
    .map((line) => line.trim())
    .join('<br>');
}
