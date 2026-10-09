import { CONTACT, SERVICE_URL } from "@/lib/business";
import type { OgCard, OgSegment } from "@/lib/og";
import type { StaticAnnouncement } from "@/content/announcements";

export const MAX_ANNOUNCEMENT_IMAGES = 10;
const MAX_SEGMENT_CHARS = 280;
const MAX_PAGE_CHARS = 700;
const MAX_PAGE_SEGMENTS = 12;

type AnnouncementPage = OgCard & { page: number; totalPages: number; plainText: string };

function sentenceParts(text: string): string[] {
  const clean = text.trim();
  if (!clean) return [];
  const parts = clean.match(/[^.!?]+(?:[.!?]+[”’"')\]]*|$)/gu) ?? [clean];
  return parts.map((part) => part.trim()).filter(Boolean);
}

function splitSegments(announcement: StaticAnnouncement): OgSegment[] {
  const result: OgSegment[] = [];
  const add = (type: OgSegment["type"], text: string) => {
    const clean = text.trim();
    if (!clean) return;
    if ([...clean].length <= MAX_SEGMENT_CHARS) {
      result.push({ type, text: clean });
      return;
    }
    const sentences = sentenceParts(clean);
    let current = "";
    for (const sentence of sentences) {
      if ([...sentence].length > MAX_SEGMENT_CHARS) {
        if (current) result.push({ type, text: current });
        result.push({ type, text: sentence });
        current = "";
        continue;
      }
      if (current && [...current].length + [...sentence].length + 1 > MAX_SEGMENT_CHARS) {
        result.push({ type, text: current });
        current = sentence;
      } else {
        current = current ? `${current} ${sentence}` : sentence;
      }
    }
    if (current) result.push({ type, text: current });
  };

  const lines = captionFor(announcement).split(/\n+/u).map((line) => line.trim()).filter(Boolean);
  const contentLines = lines[0] === announcement.title ? lines.slice(1) : lines;
  for (const line of contentLines) {
    const bullet = line.match(/^•\s+(.*)$/u);
    add(bullet ? "bullet" : "paragraph", bullet ? bullet[1] : line);
  }
  return result;
}

function summaryTitle(title: string): string {
  const prefix = title.split(/[:;—–.!?]/u)[0]?.trim();
  if (prefix && [...prefix].length <= 54) return prefix;
  const words = title.trim().split(/\s+/u);
  let result = "";
  for (const word of words) {
    const candidate = result ? `${result} ${word}` : word;
    if ([...candidate].length > 54) break;
    result = candidate;
  }
  return result || title;
}

function captionFor(announcement: StaticAnnouncement): string {
  const content = announcement.caption?.trim() || [
    announcement.title,
    ...announcement.paragraphs,
    ...announcement.points.map((point) => `• ${point}`),
  ].join("\n\n");
  const internalReasoning = /here(?:'|’)s a thinking process|analyze user input|identify core message|chain[- ]of[- ]thought|let me think|step\s+\d+\s*[:.]/iu;
  if (internalReasoning.test(content)) {
    throw new Error("L’annonce contient du raisonnement interne et ne peut pas être publiée.");
  }
  return `${content}\n\n${CONTACT}\n${SERVICE_URL}`;
}

export function buildAnnouncementPages(
  announcement: StaticAnnouncement,
): { pages: AnnouncementPage[]; caption: string; text: string } {
  const segments = splitSegments(announcement);
  const packed: OgSegment[][] = [];
  let current: OgSegment[] = [];
  let currentChars = 0;
  for (const segment of segments) {
    const size = [...segment.text].length;
    const wouldOverflow = current.length > 0 &&
      (currentChars + size > MAX_PAGE_CHARS || current.length >= MAX_PAGE_SEGMENTS);
    if (wouldOverflow) {
      packed.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(segment);
    currentChars += size;
  }
  if (current.length) packed.push(current);
  if (!packed.length) packed.push([]);
  if (packed.length > MAX_ANNOUNCEMENT_IMAGES) {
    throw new Error(
      `L'annonce « ${announcement.title} » nécessite ${packed.length} images ; limite : ${MAX_ANNOUNCEMENT_IMAGES}. Réviser les phrases longues sans retirer de contenu.`,
    );
  }

  const pages: AnnouncementPage[] = packed.map((pageSegments, index) => {
    const page = index + 1;
    const totalPages = packed.length;
    const title = page === 1 ? announcement.title : summaryTitle(announcement.title);
    const tag = page === 1 ? announcement.tag : `Suite ${page}/${totalPages}`;
    const plainText = pageSegments
      .map((segment) => (segment.type === "bullet" ? `• ${segment.text}` : segment.text))
      .join("\n\n");
    return {
      tag,
      title,
      body: "",
      points: [],
      segments: pageSegments,
      showFooter: false,
      icon: announcement.icon,
      theme: "ad",
      page,
      totalPages,
      plainText,
    };
  });

  const caption = captionFor(announcement);
  const text = caption;
  return { pages, caption, text };
}

export function formatAlbumCaption(announcement: StaticAnnouncement, _totalPages: number): string {
  return captionFor(announcement);
}
