import { prisma } from './db';
import {
  testDbConnection,
  isFallbackAllowed,
  sanitizeErrorMessage,
  getValidObjectId,
} from './profileStore';

export interface SuccessStoryData {
  id: string;
  coupleNames: string;
  location: string | null;
  story: string;
  imageUrl: string | null;
  marriageDate: Date | null;
  displayOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  isSample?: boolean; // Internal flag: true when served from the bundled showcase seed
}

/**
 * Bundled showcase stories. These are ONLY served as a read-only fallback when
 * the database is unreachable, or (in fallback-allowed environments) when no
 * story has been created yet — so the public page is never empty before the
 * admin adds real stories. They are clearly flagged `isSample: true` and are
 * never written to the database. Once real stories exist, this list is ignored.
 */
export const SAMPLE_SUCCESS_STORIES: SuccessStoryData[] = [
  {
    id: 'sample-story-1',
    coupleNames: 'Dr. Sarah & Tariq',
    location: 'Mumbai',
    story:
      'We connected on Asan Nikah in 2025. The manual screening call gave us assurance, and our families met within two weeks. We tied the knot in Bandra.',
    imageUrl: null,
    marriageDate: new Date('2025-05-12'),
    displayOrder: 0,
    isFeatured: true,
    isPublished: true,
    createdAt: new Date('2025-05-12'),
    updatedAt: new Date('2025-05-12'),
    isSample: true,
  },
  {
    id: 'sample-story-2',
    coupleNames: 'Aisha & Khalid',
    location: 'Delhi',
    story:
      'As a divorcee, finding a compatible match was hard. The Second-Marriage package counseling checked details and connected me with Khalid. We are blessed.',
    imageUrl: null,
    marriageDate: new Date('2026-04-04'),
    displayOrder: 1,
    isFeatured: false,
    isPublished: true,
    createdAt: new Date('2026-04-04'),
    updatedAt: new Date('2026-04-04'),
    isSample: true,
  },
  {
    id: 'sample-story-3',
    coupleNames: 'Adnan & Yasmin',
    location: 'Bangalore',
    story:
      'We purchased the standard monthly membership. The photo masking feature kept my privacy intact. I recommend this platform to serious candidates.',
    imageUrl: null,
    marriageDate: new Date('2024-12-15'),
    displayOrder: 2,
    isFeatured: false,
    isPublished: true,
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2024-12-15'),
    isSample: true,
  },
];

function sortStories<T extends { displayOrder: number; createdAt: Date }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Public: published stories only. Falls back to the bundled showcase seed when
 * the DB is empty (and fallback is allowed) or unreachable, so the page is never
 * blank. In production without ALLOW_DB_FALLBACK, an unreachable DB throws
 * (surfaced as a controlled empty state by the caller) rather than faking data.
 */
export async function getPublishedSuccessStories(): Promise<SuccessStoryData[]> {
  const isDb = await testDbConnection();
  if (isDb) {
    try {
      const rows = await prisma.successStory.findMany({
        where: { isPublished: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      });
      if (rows.length === 0 && isFallbackAllowed()) {
        return SAMPLE_SUCCESS_STORIES;
      }
      return rows as SuccessStoryData[];
    } catch (e) {
      const msg = sanitizeErrorMessage(e instanceof Error ? e.message : String(e));
      if (!isFallbackAllowed()) throw new Error(`Database query failed: ${msg}`);
      console.error('SuccessStory query failed, using showcase fallback', msg);
    }
  } else if (!isFallbackAllowed()) {
    throw new Error('Database is offline or not configured.');
  }
  return SAMPLE_SUCCESS_STORIES;
}

/** Admin: all stories (published + unpublished). Never mixes in the seed. */
export async function getAllSuccessStories(): Promise<SuccessStoryData[]> {
  const isDb = await testDbConnection();
  if (isDb) {
    try {
      const rows = await prisma.successStory.findMany({
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      });
      return rows as SuccessStoryData[];
    } catch (e) {
      const msg = sanitizeErrorMessage(e instanceof Error ? e.message : String(e));
      if (!isFallbackAllowed()) throw new Error(`Database query failed: ${msg}`);
      console.error('SuccessStory admin query failed, using showcase fallback', msg);
    }
  } else if (!isFallbackAllowed()) {
    throw new Error('Database is offline or not configured.');
  }
  return sortStories(SAMPLE_SUCCESS_STORIES);
}

export interface SuccessStoryInput {
  coupleNames: string;
  location?: string | null;
  story: string;
  imageUrl?: string | null;
  marriageDate?: string | Date | null;
  displayOrder?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  createdById?: string | null;
}

function normalizeInput(data: SuccessStoryInput) {
  return {
    coupleNames: data.coupleNames.trim(),
    location: data.location?.trim() || null,
    story: data.story.trim(),
    imageUrl: data.imageUrl?.trim() || null,
    marriageDate: data.marriageDate ? new Date(data.marriageDate) : null,
    displayOrder: Number.isFinite(data.displayOrder) ? Number(data.displayOrder) : 0,
    isFeatured: !!data.isFeatured,
    isPublished: data.isPublished === undefined ? true : !!data.isPublished,
  };
}

export async function createSuccessStory(data: SuccessStoryInput) {
  const payload = normalizeInput(data);
  return prisma.successStory.create({
    data: {
      ...payload,
      createdById: data.createdById ? getValidObjectId(data.createdById) : null,
    },
  });
}

export async function updateSuccessStory(id: string, data: SuccessStoryInput) {
  const payload = normalizeInput(data);
  return prisma.successStory.update({
    where: { id: getValidObjectId(id) },
    data: payload,
  });
}

export async function deleteSuccessStory(id: string) {
  await prisma.successStory.delete({ where: { id: getValidObjectId(id) } });
  return true;
}
