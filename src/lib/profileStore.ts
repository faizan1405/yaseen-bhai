import { prisma } from './db';
import { VerificationStatus, ProfileCompletionStatus } from '@prisma/client';

// In-Memory Fallback State (if database is offline/unconfigured)
const MOCK_PROFILES_DB: Array<{
  id: string;
  userId: string;
  fullName: string;
  gender: string;
  dateOfBirth: Date;
  maritalStatus: string;
  phoneNumber: string;
  city: string;
  areaOrLocality: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  education: string;
  occupation: string;
  annualIncomeRange: string;
  familyInfo: string;
  bio: string;
  themeColor: string;
  verificationStatus: VerificationStatus;
  profileCompletionStatus: ProfileCompletionStatus;
  adminApprovalStatus: string;
  hasPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}> = [
  {
    id: 'p1',
    userId: 'u1',
    fullName: 'Dr. Sarah Khan',
    gender: 'Female',
    dateOfBirth: new Date(1999, 4, 12),
    maritalStatus: 'Single',
    phoneNumber: '+91-98765-43210',
    city: 'Mumbai',
    areaOrLocality: 'Bandra',
    state: 'Maharashtra',
    country: 'India',
    latitude: 19.076,
    longitude: 72.877,
    education: 'MD, MBBS',
    occupation: 'Pediatrician',
    annualIncomeRange: '₹12 LPA - ₹15 LPA',
    familyInfo: 'Father is a retired professor. Mother is a homemaker. 1 younger brother.',
    bio: 'Looking for a compatible partner who values both Islamic principles and professional growth.',
    themeColor: 'hsl(345, 65%, 28%)', // Royal Crimson
    verificationStatus: 'APPROVED' as VerificationStatus,
    profileCompletionStatus: 'COMPLETE' as ProfileCompletionStatus,
    adminApprovalStatus: 'APPROVED',
    hasPaid: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'p2',
    userId: 'u2',
    fullName: 'Aisha Rahman',
    gender: 'Female',
    dateOfBirth: new Date(1995, 8, 20),
    maritalStatus: 'Divorced',
    phoneNumber: '+91-87654-32109',
    city: 'Bangalore',
    areaOrLocality: 'Indiranagar',
    state: 'Karnataka',
    country: 'India',
    latitude: 12.971,
    longitude: 77.594,
    education: 'M.Tech',
    occupation: 'Software Engineer',
    annualIncomeRange: '₹18 LPA - ₹22 LPA',
    familyInfo: 'Noble family. 2 sisters, both married.',
    bio: 'Simple and pious, focusing on daily prayers and family values.',
    themeColor: 'hsl(150, 45%, 18%)', // Deep Emerald
    verificationStatus: 'APPROVED' as VerificationStatus,
    profileCompletionStatus: 'COMPLETE' as ProfileCompletionStatus,
    adminApprovalStatus: 'APPROVED',
    hasPaid: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'p3',
    userId: 'u3',
    fullName: 'Adnan Siddiqui',
    gender: 'Male',
    dateOfBirth: new Date(1997, 2, 5),
    maritalStatus: 'Single',
    phoneNumber: '+91-76543-21098',
    city: 'Delhi',
    areaOrLocality: 'Karol Bagh',
    state: 'Delhi',
    country: 'India',
    latitude: 28.613,
    longitude: 77.209,
    education: 'MBA',
    occupation: 'Business Owner (Exports)',
    annualIncomeRange: '₹25 LPA - ₹30 LPA',
    familyInfo: 'Well established business family in Delhi.',
    bio: 'Ambitious, family-oriented, loves travelling and studying history.',
    themeColor: 'hsl(42, 58%, 53%)', // Gold Accent
    verificationStatus: 'APPROVED' as VerificationStatus,
    profileCompletionStatus: 'COMPLETE' as ProfileCompletionStatus,
    adminApprovalStatus: 'APPROVED',
    hasPaid: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];


const MOCK_AUDIT_LOGS: Array<{
  id: string;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: string;
  createdAt: Date;
}> = [];
const MOCK_VERIFICATION_REQUESTS: Array<{
  id: string;
  profileId: string;
  status: VerificationStatus;
  assignedAdminId: string | null;
  notes: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}> = [
  {
    id: 'vr1',
    profileId: 'p1',
    status: 'APPROVED' as VerificationStatus,
    assignedAdminId: 'admin1',
    notes: 'Called user. Verified documents and family background.',
    verifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

// Global objects for in-memory fallbacks to survive hot reloads
const globalStore = globalThis as unknown as {
  inMemoryProfiles: typeof MOCK_PROFILES_DB | undefined;
  inMemoryRequests: typeof MOCK_VERIFICATION_REQUESTS | undefined;
  inMemoryLogs: typeof MOCK_AUDIT_LOGS | undefined;
  isDbConnected: boolean | undefined;
};

if (!globalStore.inMemoryProfiles) globalStore.inMemoryProfiles = [...MOCK_PROFILES_DB];
if (!globalStore.inMemoryRequests) globalStore.inMemoryRequests = [...MOCK_VERIFICATION_REQUESTS];
if (!globalStore.inMemoryLogs) globalStore.inMemoryLogs = [...MOCK_AUDIT_LOGS];

// Check if Neon DB is reachable, caching result
async function testDbConnection() {
  if (globalStore.isDbConnected !== undefined) {
    return globalStore.isDbConnected;
  }
  try {
    // Attempt a quick, light query
    await prisma.$queryRaw`SELECT 1`;
    globalStore.isDbConnected = true;
    console.log('Neon DB connection active. Using PostgreSQL database.');
  } catch (error) {
    globalStore.isDbConnected = false;
    console.warn('Neon DB not reachable. Using secure in-memory store fallback.', error);
  }
  return globalStore.isDbConnected;
}

export async function getProfileByUserId(userId: string) {
  const isDb = await testDbConnection();
  if (isDb) {
    try {
      return await prisma.matrimonialProfile.findUnique({
        where: { userId },
      });
    } catch (e) {
      console.error('Database query failed, using fallback', e);
    }
  }
  return globalStore.inMemoryProfiles?.find((p) => p.userId === userId) || null;
}

export async function getAllProfiles() {
  const isDb = await testDbConnection();
  if (isDb) {
    try {
      return await prisma.matrimonialProfile.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.error('Database query failed, using fallback', e);
    }
  }
  return globalStore.inMemoryProfiles || [];
}

export async function upsertProfile(
  userId: string,
  data: {
    fullName: string;
    gender: string;
    dateOfBirth: string;
    maritalStatus: string;
    phoneNumber: string;
    city: string;
    areaOrLocality: string;
    state: string;
    country: string;
    education: string;
    occupation: string;
    annualIncomeRange: string;
    familyInfo: string;
    bio: string;
    themeColor?: string;
    latitude?: number;
    longitude?: number;
  }
) {
  const isDb = await testDbConnection();
  if (isDb) {
    try {
      return await prisma.matrimonialProfile.upsert({
        where: { userId },
        update: {
          ...data,
          profileCompletionStatus: 'COMPLETE' as ProfileCompletionStatus,
        },
        create: {
          ...data,
          userId,
          profileCompletionStatus: 'COMPLETE' as ProfileCompletionStatus,
          verificationStatus: 'PENDING' as VerificationStatus,
        },
      });
    } catch (e) {
      console.error('Database write failed, using fallback', e);
    }
  }

  // Fallback
  const existingIndex = globalStore.inMemoryProfiles?.findIndex((p) => p.userId === userId) ?? -1;
    const profileData = {
    id: `p-${Date.now()}`,
    userId,
    fullName: data.fullName,
    gender: data.gender,
    dateOfBirth: new Date(data.dateOfBirth),
    maritalStatus: data.maritalStatus,
    phoneNumber: data.phoneNumber,
    city: data.city,
    areaOrLocality: data.areaOrLocality,
    state: data.state,
    country: data.country,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    education: data.education,
    occupation: data.occupation,
    annualIncomeRange: data.annualIncomeRange,
    familyInfo: data.familyInfo,
    bio: data.bio,
    themeColor: data.themeColor || 'hsl(150, 45%, 18%)',
    verificationStatus: 'PENDING' as VerificationStatus,
    profileCompletionStatus: 'COMPLETE' as ProfileCompletionStatus,
    adminApprovalStatus: 'PENDING',
    hasPaid: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (existingIndex > -1 && globalStore.inMemoryProfiles) {
    globalStore.inMemoryProfiles[existingIndex] = {
      ...globalStore.inMemoryProfiles[existingIndex],
      ...profileData,
      id: globalStore.inMemoryProfiles[existingIndex].id,
      verificationStatus: globalStore.inMemoryProfiles[existingIndex].verificationStatus,
    };
    return globalStore.inMemoryProfiles[existingIndex];
  } else {
    globalStore.inMemoryProfiles?.unshift(profileData);
    // Create verification request
    globalStore.inMemoryRequests?.unshift({
      id: `vr-${Date.now()}`,
      profileId: profileData.id,
      status: 'PENDING' as VerificationStatus,
      assignedAdminId: null,
      notes: '',
      verifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return profileData;
  }
}

export async function markUserAsPaid(userId: string) {
  const isDb = await testDbConnection();
  if (isDb) {
    try {
      return await prisma.matrimonialProfile.update({
        where: { userId },
        data: { hasPaid: true },
      });
    } catch (e) {
      console.error('Database write failed, using fallback', e);
    }
  }

  // Fallback
  const profile = globalStore.inMemoryProfiles?.find((p) => p.userId === userId);
  if (profile) {
    profile.hasPaid = true;
  }
  return profile || null;
}

export async function getVerificationRequests() {
  const isDb = await testDbConnection();
  if (isDb) {
    try {
      return await prisma.verificationRequest.findMany({
        include: {
          profile: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.error('Database query failed, using fallback', e);
    }
  }

  // Fallback: Map request profiles
  return (globalStore.inMemoryRequests || []).map((req) => ({
    ...req,
    profile: globalStore.inMemoryProfiles?.find((p) => p.id === req.profileId) || null,
  }));
}

export async function updateVerificationStatus(
  profileId: string,
  status: VerificationStatus,
  notes: string,
  adminId: string
) {
  const isDb = await testDbConnection();
  if (isDb) {
    try {
      // Find or create verification request
      const existingReq = await prisma.verificationRequest.findFirst({
        where: { profileId },
      });

      if (existingReq) {
        await prisma.verificationRequest.update({
          where: { id: existingReq.id },
          data: {
            status,
            notes,
            assignedAdminId: adminId,
            verifiedAt: status === 'APPROVED' ? new Date() : null,
          },
        });
      } else {
        await prisma.verificationRequest.create({
          data: {
            profileId,
            status,
            notes,
            assignedAdminId: adminId,
            verifiedAt: status === 'APPROVED' ? new Date() : null,
          },
        });
      }

      // Update profile status
      await prisma.matrimonialProfile.update({
        where: { id: profileId },
        data: {
          verificationStatus: status,
          adminApprovalStatus: status,
        },
      });

      // Create Audit Log
      await prisma.auditLog.create({
        data: {
          actorUserId: adminId,
          action: `VERIFICATION_STATUS_CHANGE_${status}`,
          targetType: 'MatrimonialProfile',
          targetId: profileId,
          metadata: JSON.stringify({ notes }),
        },
      });

      return true;
    } catch (e) {
      console.error('Database write failed, using fallback', e);
    }
  }

  // Fallback logic
  if (globalStore.inMemoryProfiles) {
    const profile = globalStore.inMemoryProfiles.find((p) => p.id === profileId);
    if (profile) {
      profile.verificationStatus = status;
      profile.adminApprovalStatus = status;
    }
  }

  const reqIndex = globalStore.inMemoryRequests?.findIndex((r) => r.profileId === profileId) ?? -1;
  if (reqIndex > -1 && globalStore.inMemoryRequests) {
    globalStore.inMemoryRequests[reqIndex].status = status;
    globalStore.inMemoryRequests[reqIndex].notes = notes;
    globalStore.inMemoryRequests[reqIndex].assignedAdminId = adminId;
    globalStore.inMemoryRequests[reqIndex].verifiedAt = status === 'APPROVED' ? new Date() : null;
    globalStore.inMemoryRequests[reqIndex].updatedAt = new Date();
  } else {
    globalStore.inMemoryRequests?.unshift({
      id: `vr-${Date.now()}`,
      profileId,
      status,
      assignedAdminId: adminId,
      notes,
      verifiedAt: status === 'APPROVED' ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Write audit log
  globalStore.inMemoryLogs?.unshift({
    id: `log-${Date.now()}`,
    actorUserId: adminId,
    action: `VERIFICATION_STATUS_CHANGE_${status}`,
    targetType: 'MatrimonialProfile',
    targetId: profileId,
    metadata: JSON.stringify({ notes }),
    createdAt: new Date(),
  });

  return true;
}

export async function getAuditLogs() {
  const isDb = await testDbConnection();
  if (isDb) {
    try {
      return await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.error('Database query failed, using fallback', e);
    }
  }
  return globalStore.inMemoryLogs || [];
}
