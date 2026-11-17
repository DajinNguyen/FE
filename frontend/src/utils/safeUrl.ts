/** http·https 주소만 링크로 열어요. (다른 형식은 링크로 만들지 않아요) */
export function safeSourceUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}
