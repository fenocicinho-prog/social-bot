import type { OgCard, OgIcon, OgSegment, OgTheme } from "@/lib/og";

export const MAX_NEWS_IMAGES = 10;
const MAX_CHARS_PER_PAGE = 360;
const MAX_SEGMENTS_PER_PAGE = 8;

type NewsCardPage = OgCard & { page: number; totalPages: number; plainText: string };
type NewsCardInput = {
  tag: string;
  title: string;
  summary?: string;
  source?: string;
  icon: OgIcon;
  theme: OgTheme;
};

function splitSentences(text: string): string[] {
  return (text.trim().match(/[^.!?]+(?:[.!?]+[”’"')\]]*|$)/gu) ?? [])
    .map((part) => part.trim())
    .filter(Boolean);
}

function segmentsFor(summary: string): OgSegment[] {
  const result: OgSegment[] = [];
  let current = "";
  for (const sentence of splitSentences(summary)) {
    const length = [...sentence].length;
    if (current && [...current].length + length + 1 > MAX_CHARS_PER_PAGE) {
      result.push({ type: "paragraph", text: current });
      current = "";
    }
    // Toute longue phrase reste intacte ; le renderer la fait revenir à la ligne.
    current = current ? `${current} ${sentence}` : sentence;
  }
  if (current) result.push({ type: "paragraph", text: current });
  return result;
}

function shortTitle(title: string): string {
  const firstSentence = splitSentences(title)[0]?.trim();
  if (firstSentence && [...firstSentence].length <= 64) return firstSentence;
  let result = "";
  for (const word of title.split(/\s+/u)) {
    const next = result ? `${result} ${word}` : word;
    if ([...next].length > 64) break;
    result = next;
  }
  return result || title;
}

export function buildNewsPages(input: NewsCardInput): NewsCardPage[] {
  const segments = segmentsFor(input.summary?.trim() ?? "");
  const groups: OgSegment[][] = [];
  let group: OgSegment[] = [];
  let chars = 0;
  for (const segment of segments) {
    const size = [...segment.text].length;
    if (group.length && (chars + size > MAX_CHARS_PER_PAGE || group.length >= MAX_SEGMENTS_PER_PAGE)) {
      groups.push(group);
      group = [];
      chars = 0;
    }
    group.push(segment);
    chars += size;
  }
  if (group.length) groups.push(group);
  if (!groups.length) groups.push([]);
  if (groups.length > MAX_NEWS_IMAGES) {
    throw new Error(`Le résumé de l'actualité « ${input.title} » nécessite plus de ${MAX_NEWS_IMAGES} images. Aucune phrase ne sera tronquée.`);
  }

  return groups.map((pageSegments, index) => {
    const page = index + 1;
    const plainText = pageSegments.map((segment) => segment.text).join("\n\n");
    return {
      tag: page === 1 ? input.tag : `Suite ${page}/${groups.length}`,
      title: page === 1 ? input.title : shortTitle(input.title),
      body: "",
      points: [],
      segments: pageSegments,
      icon: input.icon,
      theme: input.theme,
      src: input.source?.trim() ? `Source : ${input.source.trim()}` : "",
      page,
      totalPages: groups.length,
      plainText,
    };
  });
}
