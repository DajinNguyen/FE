const CHOSEONG = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

/** "영업이익" → "ㅇㅇㅇㅇ" (한글 음절이 아닌 글자는 그대로) */
export function toChoseong(text: string) {
  return [...text]
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code < HANGUL_START || code > HANGUL_END) return char;
      return CHOSEONG[Math.floor((code - HANGUL_START) / 588)];
    })
    .join('');
}
