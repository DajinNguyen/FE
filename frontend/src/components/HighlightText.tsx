import styles from './HighlightText.module.css';

/** text 안에서 keyword 와 같은 부분(대소문자·공백 무시)을 강조해요. */
export function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  const range = findMatch(text, keyword);
  if (!range) return <>{text}</>;
  const [start, end] = range;
  return (
    <>
      {text.slice(0, start)}
      <mark className={styles.mark}>{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

/** 공백을 빼고 비교한 뒤, 원래 문자열의 위치로 되돌려요. */
function findMatch(text: string, keyword: string): [number, number] | null {
  const needle = keyword.toLowerCase().replace(/\s+/g, '');
  if (!needle) return null;
  const positions: number[] = [];
  let compact = '';
  [...text].forEach((ch, i) => {
    if (/\s/.test(ch)) return;
    compact += ch.toLowerCase();
    positions.push(i);
  });
  const at = compact.indexOf(needle);
  if (at === -1) return null;
  return [positions[at], positions[at + needle.length - 1] + 1];
}
