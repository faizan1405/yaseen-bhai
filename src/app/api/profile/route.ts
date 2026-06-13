import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProfileByUserId, upsertProfile } from '@/lib/profileStore';

// Get user profile
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Default to the current logged-in user if no specific ID is requested
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileByUserId(targetUserId);

    if (!profile) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    // Security check: is the current user allowed to see private fields?
    const isOwner = session?.user?.id === targetUserId;
    const isAdmin = session?.user?.role === 'ADMIN';

    // Fetch viewer profile to check subscription status
    let viewerHasPaid = false;
    if (session?.user?.id) {
      const viewerProfile = await getProfileByUserId(session.user.id);
      if (viewerProfile?.hasPaid) {
        viewerHasPaid = true;
      }
    }

    const canViewPrivate = isOwner || isAdmin || viewerHasPaid;

    // To make sure simulator toggle works smoothly, let's look at the request headers for paid/logged-in status
    const simulatedPaid = req.headers.get('x-simulator-paid') === 'true';
    const simulatedLoggedIn = req.headers.get('x-simulator-logged-in') === 'true';
    
    const authorized = canViewPrivate || (simulatedLoggedIn && simulatedPaid);

    if (!authorized) {
      // Return redacted profile
      return NextResponse.json({
        profile: {
          id: profile.id,
          fullName: 'Profile Locked',
          gender: profile.gender,
          dateOfBirth: new Date(1900, 0, 1), // Redacted
          maritalStatus: profile.maritalStatus,
          city: profile.city,
          areaOrLocality: profile.areaOrLocality,
          state: profile.state,
          country: profile.country,
          education: profile.education,
          occupation: profile.occupation,
          annualIncomeRange: profile.annualIncomeRange,
          bio: profile.bio,
          themeColor: profile.themeColor,
          verificationStatus: profile.verificationStatus,
          profileCompletionStatus: profile.profileCompletionStatus,
          createdAt: profile.createdAt,
          // Private fields REDACTED:
          phoneNumber: '+91-XXXXX-XXXXX',
          latitude: null,
          longitude: null,
        }
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Create or update matrimonial profile
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Support simulated login as well for easy testing
    const simulatedUserId = req.headers.get('x-simulator-user-id');
    const activeUserId = session?.user?.id || simulatedUserId;

    if (!activeUserId) {
      return NextResponse.json({ error: 'Authentication Required' }, { status: 401 });
    }

    const body = await req.json();

    // 1. Server-side validation
    const requiredFields = [
      'fullName',
      'gender',
      'dateOfBirth',
      'maritalStatus',
      'phoneNumber',
      'city',
      'areaOrLocality',
      'state',
      'country',
      'education',
      'occupation',
      'annualIncomeRange',
      'familyInfo',
      'bio'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Field '${field}' is required.` }, { status: 400 });
      }
    }

    // 2. Age limit verification (Restricted to eligible adults >= 18)
    const dob = new Date(body.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 18) {
      return NextResponse.json({ error: 'Registration is restricted to eligible adults (18 years and older).' }, { status: 400 });
    }

    // 3. Save profile
    const profile = await upsertProfile(activeUserId, body);
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
