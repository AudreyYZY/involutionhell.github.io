export type DirNode = {
  name: string;
  path: string;
  children?: DirNode[];
};

export const FILENAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]+$/;

export function ensureMarkdownExtension(filename: string) {
  const trimmed = filename.trim();
  if (!trimmed) return "";
  return trimmed.toLowerCase().endsWith(".md")
    ? trimmed.toLowerCase()
    : `${trimmed.toLowerCase()}.md`;
}

export function stripMarkdownExtension(filename: string) {
  return filename.toLowerCase().replace(/\.md$/i, "");
}
