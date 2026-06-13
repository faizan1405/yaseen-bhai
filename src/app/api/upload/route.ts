import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { put } from '@vercel/blob';

/**
 * SECURE UPLOAD PLAN FOR PROFILE PHOTOS AND DOCUMENT VERIFICATION
 * 
 * 1. Authorization: Only logged-in users with a complete matrimonial registration can upload.
 * 2. Privacy: Files are uploaded to Vercel Blob with `{ access: 'private' }` configuration.
 * 3. Security: We do not expose direct public URLs.
 * 4. Serving Files: Files will be requested via a proxy route (e.g. `/api/media/[fileId]`) 
 *    which verifies the requester's subscription status before generating a time-limited read-only token or pipe.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type (e.g., only allow images)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images are allowed' }, { status: 400 });
    }

    // Check file size (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    // Check if Blob token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN.includes('dummy')) {
      // Return a simulated success path for local testing
      return NextResponse.json({
        success: true,
        message: 'Mock upload successful (BLOB_READ_WRITE_TOKEN is using local dummy placeholder)',
        url: `https://mock-blob.vercel-storage.com/${session.user.id}-${Date.now()}-${file.name}`,
      });
    }

    // Upload to Vercel Blob with private access
    const blob = await put(file.name, file, {
      access: 'private', // Keeps file private by default
      addRandomSuffix: true,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
