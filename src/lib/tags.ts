import type { CollectionEntry } from 'astro:content';

export const slugifyTag = (tag: string) =>
  tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

export interface TagSummary {
  slug: string;
  name: string;
  count: number;
}

export const buildTagSummaries = (posts: CollectionEntry<'blog'>[]): TagSummary[] => {
  const counts = new Map<string, { name: string; count: number }>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      const slug = slugifyTag(tag);
      if (!slug) continue;
      const entry = counts.get(slug);
      if (entry) {
        entry.count += 1;
      } else {
        counts.set(slug, { name: tag, count: 1 });
      }
    }
  }

  return [...counts.entries()]
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};
