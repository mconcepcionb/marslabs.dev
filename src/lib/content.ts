import type { CollectionEntry } from 'astro:content';

export const STATUS_LABEL: Record<CollectionEntry<'projects'>['data']['status'], string> = {
  'en-curso': 'En curso',
  entregado: 'Entregado',
  personal: 'Personal',
  archivado: 'Archivado',
};

export const STATUS_CLASS: Record<CollectionEntry<'projects'>['data']['status'], string> = {
  'en-curso': 'chip--accent',
  entregado: 'chip--primary',
  personal: '',
  archivado: '',
};

export const projectMeta = (p: CollectionEntry<'projects'>) =>
  [...p.data.tags, String(p.data.year)].join(' · ');
