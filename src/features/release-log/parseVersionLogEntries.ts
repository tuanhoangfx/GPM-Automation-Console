export type ParsedVersionLogEntry = {
  version: string;
  timestamp: string;
  title: string;
  items: string[];
};

export function parseVersionLogEntries(markdown: string, maxEntries = 20): ParsedVersionLogEntry[] {
  const sections = markdown.split(/\r?\n(?=## )/g);
  const parsed: ParsedVersionLogEntry[] = [];

  for (const section of sections) {
    const headerMatch = section.match(/^##\s+(\d{4}-\d{2}-\d{2})\s+-\s+(.+)$/m);
    if (!headerMatch) continue;

    const date = headerMatch[1];
    const title = headerMatch[2].trim();
    const versionMatch = section.match(/^- Version:\s*`?([0-9]+\.[0-9]+\.[0-9]+)`?\s*$/m);
    const timestampMatch = section.match(/^- Timestamp:\s*(.+)\s*$/m);
    const releaseMatch = section.match(/^- Release:\s+.*\/tag\/v([0-9]+\.[0-9]+\.[0-9]+)\s*$/m);
    const changesMatch = section.match(/### Changes\s*\r?\n([\s\S]*?)(?:\r?\n### |\s*$)/);
    if (!changesMatch) continue;

    const items = changesMatch[1]
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2).trim())
      .filter(Boolean)
      .slice(0, 5);
    if (!items.length) continue;

    parsed.push({
      version: versionMatch?.[1] || releaseMatch?.[1] || date,
      timestamp: timestampMatch?.[1]?.trim() || `${date} 00:00`,
      title,
      items
    });

    if (parsed.length >= maxEntries) break;
  }

  if (parsed.length) return parsed;

  return [
    {
      version: "n/a",
      timestamp: "n/a",
      title: "No release entries found",
      items: ["Add a release entry section with a '### Changes' block and bullet items to populate this dialog automatically."]
    }
  ];
}
