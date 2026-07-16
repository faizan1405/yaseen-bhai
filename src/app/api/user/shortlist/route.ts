import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProfileById } from '@/lib/profileStore';
import { parsePagination } from '@/lib/dashboard/pagination';
import {
  addShortlist,
  removeShortlistByTarget,
  removeShortlistById,
  listShortlistedProfiles,
  ShortlistError,
} from '@/lib/dashboard/shortlistService';
import { shortlistAddSchema, shortlistRemoveSchema } from '@/lib/dashboard/validation';

export async function GET(req: NextRequest) {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams.get('page'), searchParams.get('pageSize'));

  try {
    const result = await listShortlistedProfiles(ownerId, pagination);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = shortlistAddSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const targetProfile = await getProfileById(parsed.data.profileId);
    if (!targetProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const row = await addShortlist(ownerId, targetProfile.userId);
    return NextResponse.json({ success: true, shortlistId: row?.id });
  } catch (error) {
    if (error instanceof ShortlistError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = shortlistRemoveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    let removed = false;
    if (parsed.data.shortlistId) {
      removed = await removeShortlistById(ownerId, parsed.data.shortlistId);
    } else if (parsed.data.profileId) {
      const targetProfile = await getProfileById(parsed.data.profileId);
      if (targetProfile) {
        removed = await removeShortlistByTarget(ownerId, targetProfile.userId);
      }
    }
    if (!removed) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
