import { NextResponse } from 'next/server';
import { getPublishedSuccessStories } from '@/lib/successStories';

export const dynamic = 'force-dynamic';

// Public: published success stories only. Never 500s to the visitor — on a
// controlled DB outage in production it returns an empty list so the page can
// render its own empty state rather than exposing an error.
export async function GET() {
  try {
    const stories = await getPublishedSuccessStories();
    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Public success-stories GET failed:', error);
    return NextResponse.json({ stories: [] });
  }
}
