'use client';

import React, { useState, useEffect } from 'react';

// Color themes mapped for custom profile borders
const THEME_COLORS = [
  { name: 'Emerald Green', value: 'hsl(150, 45%, 18%)' },
  { name: 'Royal Crimson', value: 'hsl(345, 65%, 28%)' },
  { name: 'Gold Accent', value: 'hsl(42, 58%, 53%)' },
  { name: 'Ocean Blue', value: 'hsl(200, 50%, 30%)' }
];

interface Profile {
  id: string;
  userId: string;
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
  themeColor: string;
  verificationStatus: string;
  profileCompletionStatus: string;
  createdAt: string;
}

interface VerificationRequest {
  id: string;
  profileId: string;
  status: string;
  assignedAdminId: string | null;
  notes: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile: Profile | null;
}

interface AuditLog {
  id: string;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: string;
  createdAt: string;
}

export default function Home() {
  // --- Simulator & Session States ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPaid300, setHasPaid300] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [referralRate, setReferralRate] = useState(21);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // --- Profile List / Search Filters ---
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedDistance, setSelectedDistance] = useState('All');
  const [selectedCaste, setSelectedCaste] = useState('All');
  const [verificationFilter, setVerificationFilter] = useState('All');

  // --- Current User Profile Form & Registration State ---
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [registrationError, setRegistrationError] = useState('');

  // --- Admin Dashboard States ---
  const [adminRequests, setAdminRequests] = useState<VerificationRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminActiveTab, setAdminActiveTab] = useState<'verification' | 'logs'>('verification');
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<VerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // --- Registration Form Fields ---
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Female',
    dateOfBirth: '',
    maritalStatus: 'Single',
    phoneNumber: '',
    city: '',
    areaOrLocality: '',
    state: '',
    country: 'India',
    education: '',
    occupation: '',
    annualIncomeRange: '₹3 LPA - ₹5 LPA',
    familyInfo: '',
    bio: '',
    partnerPref: '',
    themeColor: 'hsl(150, 45%, 18%)',
    consent: false,
    terms: false,
  });

  // Simulator helper headers
  const getSimulatorHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'x-simulator-user-id': 'simulated-user-123',
      'x-simulator-logged-in': isLoggedIn ? 'true' : 'false',
      'x-simulator-paid': hasPaid300 ? 'true' : 'false',
      'x-simulator-admin': 'true', // Allow admin actions in simulator mode
      'x-simulator-admin-id': 'simulated-admin-999',
    };
  };

  // --- Fetch Data on State Changes ---
  useEffect(() => {
    async function loadAllData() {
      try {
        const simulatorHeaders = {
          'Content-Type': 'application/json',
          'x-simulator-user-id': 'simulated-user-123',
          'x-simulator-logged-in': isLoggedIn ? 'true' : 'false',
          'x-simulator-paid': hasPaid300 ? 'true' : 'false',
          'x-simulator-admin': 'true',
          'x-simulator-admin-id': 'simulated-admin-999',
        };

        // 1. Fetch current user profile
        if (isLoggedIn) {
          const res = await fetch('/api/profile', { headers: simulatorHeaders });
          const data = await res.json();
          if (data.profile) {
            setUserProfile(data.profile);
            if (data.profile.hasPaid) {
              setHasPaid300(true);
            }
            setFormData({
              fullName: data.profile.fullName || '',
              gender: data.profile.gender || 'Female',
              dateOfBirth: data.profile.dateOfBirth ? new Date(data.profile.dateOfBirth).toISOString().substring(0, 10) : '',
              maritalStatus: data.profile.maritalStatus || 'Single',
              phoneNumber: data.profile.phoneNumber || '',
              city: data.profile.city || '',
              areaOrLocality: data.profile.areaOrLocality || '',
              state: data.profile.state || '',
              country: data.profile.country || 'India',
              education: data.profile.education || '',
              occupation: data.profile.occupation || '',
              annualIncomeRange: data.profile.annualIncomeRange || '₹3 LPA - ₹5 LPA',
              familyInfo: data.profile.familyInfo || '',
              bio: data.profile.bio || '',
              partnerPref: data.profile.partnerPref || '',
              themeColor: data.profile.themeColor || 'hsl(150, 45%, 18%)',
              consent: true,
              terms: true,
            });
            setIsRegistering(false);
          } else {
            setUserProfile(null);
            // Auto redirect to register form if profile is incomplete
            setIsRegistering(true);
            setRegStep(1);
          }
        } else {
          setUserProfile(null);
          setIsRegistering(false);
        }

        // 2. Fetch admin verification requests & logs
        const resReq = await fetch('/api/admin/verification', { headers: simulatorHeaders });
        const dataReq = await resReq.json();
        if (dataReq.requests) {
          setAdminRequests(dataReq.requests);
          // Extract profiles for general display
          const mappedProfiles = dataReq.requests.map((r: VerificationRequest) => r.profile).filter(Boolean) as Profile[];
          setProfiles(mappedProfiles);
        }

        const resLogs = await fetch('/api/admin/verification?mode=audit', { headers: simulatorHeaders });
        const dataLogs = await resLogs.json();
        if (dataLogs.logs) {
          setAuditLogs(dataLogs.logs);
        }
      } catch (err) {
        console.error('Failed fetching DB state', err);
      }
    }

    loadAllData();
  }, [isLoggedIn, hasPaid300, reloadTrigger]);

  // --- Google Login Simulation ---
  const handleGoogleLogin = () => {
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  // --- Registration / Profile Submission ---
  const handleNextStep = () => {
    // Basic validation per step
    if (regStep === 1) {
      if (!formData.fullName || !formData.dateOfBirth || !formData.phoneNumber || !formData.bio) {
        setRegistrationError('Please fill in all personal details.');
        return;
      }
      // Check Age Limit (>= 18)
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      if (age < 18) {
        setRegistrationError('Registration is restricted to eligible adults (18 years and older).');
        return;
      }
    } else if (regStep === 2) {
      if (!formData.city || !formData.areaOrLocality || !formData.state) {
        setRegistrationError('Please fill in your complete location.');
        return;
      }
    } else if (regStep === 3) {
      if (!formData.education || !formData.occupation) {
        setRegistrationError('Please provide your education and occupation info.');
        return;
      }
    } else if (regStep === 4) {
      if (!formData.familyInfo) {
        setRegistrationError('Please enter family background details.');
        return;
      }
    }
    setRegistrationError('');
    setRegStep(regStep + 1);
  };

  const handlePrevStep = () => {
    setRegistrationError('');
    setRegStep(regStep - 1);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent || !formData.terms) {
      setRegistrationError('You must accept the terms and provide consent.');
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: getSimulatorHeaders(),
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('Matrimonial profile saved successfully! Entering manual verification queue.');
        setReloadTrigger((prev) => prev + 1);
        setIsRegistering(false);
      } else {
        const data = await res.json();
        setRegistrationError(data.error || 'Failed to save profile.');
      }
    } catch {
      setRegistrationError('Network error saving profile.');
    }
  };

  // --- Razorpay Payment Checkout ---
  const handleRazorpayCheckout = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    try {
      // 1. Create order on the server
      const res = await fetch('/api/payment/order', {
        method: 'POST',
        headers: getSimulatorHeaders(),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to create payment order.');
        return;
      }

      const { orderId, amount, currency, keyId, isSimulated } = data;

      // Define checkout options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'MOM Matrimonial',
        description: 'Standard Monthly Subscription (₹300 + 18% GST)',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100',
        order_id: orderId,
        handler: async function (response: { razorpay_payment_id?: string; razorpay_signature?: string }) {
          // Verify payment signature
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: getSimulatorHeaders(),
              body: JSON.stringify({
                orderId: orderId,
                paymentId: response.razorpay_payment_id || 'mock_pay_id',
                signature: response.razorpay_signature || 'mock_sig',
                isSimulated: isSimulated,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setHasPaid300(true);
              alert('Alhamdulillah! Payment verified and your Standard Monthly Membership is now active.');
              setReloadTrigger((prev) => prev + 1);
            } else {
              alert(verifyData.error || 'Payment verification failed.');
            }
          } catch {
            alert('Network error verifying payment.');
          }
        },
        prefill: {
          name: formData.fullName || 'User Name',
          contact: formData.phoneNumber || '+919999999999',
        },
        theme: {
          color: formData.themeColor || 'hsl(150, 45%, 18%)',
        },
      };

      if (isSimulated) {
        // In simulation mode, mock the success callback after user clicks OK
        if (confirm(`[SIMULATOR] Razorpay checkout popup triggered.\n\nOrder ID: ${orderId}\nAmount: ₹${amount/100}\n\nClick OK to simulate successful transaction approval.`)) {
          options.handler({
            razorpay_payment_id: 'pay_mock_' + Date.now(),
            razorpay_signature: 'sig_mock_' + Date.now(),
          });
        }
      } else {
        // Load Razorpay dynamically if not already loaded
        const loadScript = () => {
          return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });
        };

        const loaded = await loadScript();
        if (!loaded) {
          alert('Failed to load Razorpay payment widget. Check network connection.');
          return;
        }

        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed starting payment flow.');
    }
  };

  // --- Admin Actions ---
  const handleReviewSubmit = async (status: 'APPROVED' | 'REJECTED' | 'NEEDS_FOLLOW_UP') => {
    if (!selectedRequestForReview || !selectedRequestForReview.profile) return;
    try {
      const res = await fetch('/api/admin/verification', {
        method: 'POST',
        headers: getSimulatorHeaders(),
        body: JSON.stringify({
          profileId: selectedRequestForReview.profile.id,
          status,
          notes: reviewNotes,
        }),
      });

      if (res.ok) {
        alert(`Status updated to ${status}! Audit log entry created.`);
        setSelectedRequestForReview(null);
        setReviewNotes('');
        setReloadTrigger((prev) => prev + 1);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update verification status.');
      }
    } catch {
      alert('Error updating status.');
    }
  };

  // Filter local profile display
  const filteredProfiles = profiles.filter((p) => {
    if (selectedDistance !== 'All') {
      if (selectedDistance === '50' && p.city !== 'Mumbai') return false;
      if (selectedDistance === '100' && p.city === 'Delhi') return false;
    }
    if (selectedCaste !== 'All') {
      const community = p.bio.toLowerCase() + p.familyInfo.toLowerCase();
      if (!community.includes(selectedCaste.toLowerCase())) return false;
    }
    if (verificationFilter === 'Verified' && p.verificationStatus !== 'APPROVED') return false;
    if (verificationFilter === 'Unverified' && p.verificationStatus === 'APPROVED') return false;
    return true;
  });

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="container nav-container">
          <a href="#" className="logo" id="header-logo-link">
            MOM<span>.</span>
          </a>
          <nav>
            <ul className="nav-menu">
              <li>
                <a
                  href="#"
                  className="nav-link"
                  onClick={() => {
                    setIsAdminMode(false);
                    setIsRegistering(false);
                  }}
                  id="nav-link-home"
                >
                  Home
                </a>
              </li>
              <li>
                <a href="#browse-profiles" className="nav-link" id="nav-link-browse" onClick={() => setIsAdminMode(false)}>
                  Browse Profiles
                </a>
              </li>
              <li>
                <a href="#premium-pricing" className="nav-link" id="nav-link-pricing" onClick={() => setIsAdminMode(false)}>
                  Pricing & Packages
                </a>
              </li>
              <li>
                {isLoggedIn && (
                  <button
                    onClick={() => {
                      setIsAdminMode(false);
                      setIsRegistering(true);
                      setRegStep(1);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    Edit Profile
                  </button>
                )}
              </li>
              <li>
                <button
                  onClick={() => setIsAdminMode(!isAdminMode)}
                  className="btn btn-secondary"
                  id="btn-toggle-admin"
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  {isAdminMode ? 'View Website' : 'Admin Panel'}
                </button>
              </li>
              <li>
                {isLoggedIn ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>As-salamu alaykum!</span>
                    <button
                      onClick={() => {
                        setIsLoggedIn(false);
                        setHasPaid300(false);
                      }}
                      className="btn btn-primary"
                      id="btn-logout"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="btn btn-primary"
                    id="btn-login-trigger"
                    style={{ padding: '8px 20px', fontSize: '14px' }}
                  >
                    Login
                  </button>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Simulator Quick Bar */}
      <div
        style={{
          backgroundColor: 'var(--primary-crimson)',
          color: 'var(--white)',
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          alignItems: 'center',
          borderBottom: '2px solid var(--gold-accent)',
        }}
      >
        <span>🔄 NEON DB & GOOGLE AUTH SIMULATOR:</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isLoggedIn}
            onChange={(e) => setIsLoggedIn(e.target.checked)}
            id="sim-logged-in-checkbox"
          />
          Google Logged In
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={hasPaid300}
            onChange={(e) => setHasPaid300(e.target.checked)}
            id="sim-paid-300-checkbox"
          />
          Paid Membership (₹300)
        </label>
      </div>

      {!isAdminMode ? (
        <main>
          {isRegistering ? (
            /* Multi-step onboarding form */
            <section style={{ padding: '60px 0' }}>
              <div className="container" style={{ maxWidth: '650px' }}>
                <div className="card-theme-wrapper">
                  <div className="ornament ornament-tl"></div>
                  <div className="ornament ornament-tr"></div>
                  <div className="ornament ornament-bl"></div>
                  <div className="ornament ornament-br"></div>

                  <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-emerald)', marginBottom: '10px', textAlign: 'center' }}>
                    {userProfile ? 'Update Matrimonial Profile' : 'Register Matrimonial Profile'}
                  </h2>
                  <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '30px' }}>
                    Step {regStep} of 5 — {regStep === 1 && 'Personal Information'}
                    {regStep === 2 && 'Location Details'}
                    {regStep === 3 && 'Professional Details'}
                    {regStep === 4 && 'Family Background'}
                    {regStep === 5 && 'Consent & Theme'}
                  </p>

                  {/* Progress Bar */}
                  <div style={{ background: '#eee', height: '6px', borderRadius: '3px', marginBottom: '30px', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--gold-accent)', height: '100%', width: `${(regStep / 5) * 100}%`, transition: 'width 0.3s' }}></div>
                  </div>

                  {registrationError && (
                    <div style={{ backgroundColor: 'rgba(230, 92, 92, 0.1)', color: 'var(--primary-crimson)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
                      ⚠️ {registrationError}
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit}>
                    {regStep === 1 && (
                      <div>
                        <div className="form-group">
                          <label className="form-label">Full Name *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Enter legal full name"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Gender *</label>
                          <select
                            className="form-control"
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          >
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Date of Birth (Eligible adults &gt;= 18) *</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Marital Status *</label>
                          <select
                            className="form-control"
                            value={formData.maritalStatus}
                            onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                          >
                            <option value="Single">Single</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Phone Number (Call Verification Required) *</label>
                          <input
                            type="tel"
                            className="form-control"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            placeholder="e.g. +91 9876543210"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">About Me (Bio) *</label>
                          <textarea
                            className="form-control"
                            rows={3}
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Describe your values, hobbies, and outlook on marriage..."
                          />
                        </div>
                      </div>
                    )}

                    {regStep === 2 && (
                      <div>
                        <div className="form-group">
                          <label className="form-label">City *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="e.g. Mumbai"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Area or Locality *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.areaOrLocality}
                            onChange={(e) => setFormData({ ...formData, areaOrLocality: e.target.value })}
                            placeholder="e.g. Bandra West"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">State *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder="e.g. Maharashtra"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Country *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            placeholder="e.g. India"
                          />
                        </div>
                      </div>
                    )}

                    {regStep === 3 && (
                      <div>
                        <div className="form-group">
                          <label className="form-label">Education *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.education}
                            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                            placeholder="e.g. MBBS, M.Tech, B.Com"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Occupation *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.occupation}
                            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                            placeholder="e.g. Pediatrician, Software Engineer"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Annual Income Range *</label>
                          <select
                            className="form-control"
                            value={formData.annualIncomeRange}
                            onChange={(e) => setFormData({ ...formData, annualIncomeRange: e.target.value })}
                          >
                            <option value="Under ₹3 LPA">Under ₹3 LPA</option>
                            <option value="₹3 LPA - ₹5 LPA">₹3 LPA - ₹5 LPA</option>
                            <option value="₹5 LPA - ₹10 LPA">₹5 LPA - ₹10 LPA</option>
                            <option value="₹10 LPA - ₹15 LPA">₹10 LPA - ₹15 LPA</option>
                            <option value="₹15 LPA - ₹25 LPA">₹15 LPA - ₹25 LPA</option>
                            <option value="Above ₹25 LPA">Above ₹25 LPA</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {regStep === 4 && (
                      <div>
                        <div className="form-group">
                          <label className="form-label">Family Details (Parents, Siblings background) *</label>
                          <textarea
                            className="form-control"
                            rows={4}
                            value={formData.familyInfo}
                            onChange={(e) => setFormData({ ...formData, familyInfo: e.target.value })}
                            placeholder="Provide family background, parents occupation, number of siblings etc..."
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Partner Preferences Summary</label>
                          <textarea
                            className="form-control"
                            rows={3}
                            value={formData.partnerPref}
                            onChange={(e) => setFormData({ ...formData, partnerPref: e.target.value })}
                            placeholder="Preferred age, education, and religiosity..."
                          />
                        </div>
                      </div>
                    )}

                    {regStep === 5 && (
                      <div>
                        <div className="form-group">
                          <label className="form-label">Assigned Profile Theme *</label>
                          <select
                            className="form-control"
                            value={formData.themeColor}
                            onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                          >
                            {THEME_COLORS.map((tc) => (
                              <option key={tc.value} value={tc.value}>
                                {tc.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', margin: '20px 0' }}>
                          <input
                            type="checkbox"
                            style={{ marginTop: '4px' }}
                            checked={formData.consent}
                            onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                          />
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            I consent to manual phone verification call from MOM Admin team to confirm these profile details.
                          </span>
                        </div>

                        <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', margin: '20px 0' }}>
                          <input
                            type="checkbox"
                            style={{ marginTop: '4px' }}
                            checked={formData.terms}
                            onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                          />
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            I accept the MOM Matrimonial Terms of Service and Shariah-compliant match guidelines.
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                      {regStep > 1 && (
                        <button type="button" onClick={handlePrevStep} className="btn btn-secondary">
                          Back
                        </button>
                      )}
                      {regStep < 5 ? (
                        <button type="button" onClick={handleNextStep} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                          Next Step
                        </button>
                      ) : (
                        <button type="submit" className="btn btn-gold" style={{ marginLeft: 'auto' }}>
                          Save Profile
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </section>
          ) : (
            /* Main Landing Page */
            <>
              {/* Hero Section */}
              <section className="hero">
                <div className="container">
                  <p className="hero-subtitle">Halal & Pure Muslim Matrimony</p>
                  <h1 className="hero-title">Find Your Perfect Partner in Faith</h1>
                  <p className="hero-description">
                    Welcome to MOM — the premium Muslim matrimonial platform designed with absolute privacy, manual verification, and tailored matches.
                  </p>
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <a href="#browse-profiles" className="btn btn-gold" id="hero-browse-btn">
                      Browse Matches
                    </a>
                    <button
                      onClick={() => {
                        if (!isLoggedIn) {
                          setShowLoginModal(true);
                        } else {
                          setIsRegistering(true);
                          setRegStep(1);
                        }
                      }}
                      className="btn btn-primary"
                      id="hero-register-btn"
                    >
                      {userProfile ? 'Edit Profile' : 'Register Now'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Profiles Section */}
              <section id="browse-profiles" style={{ padding: '80px 0', backgroundColor: 'var(--white)' }}>
                <div className="container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', color: 'var(--primary-emerald)' }}>
                        Browse Verified Matrimonial Profiles
                      </h2>
                      <p style={{ color: 'var(--text-muted)' }}>Find compatible Muslim matches near you</p>
                    </div>

                    {/* Search Filters */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Distance</label>
                        <select
                          value={selectedDistance}
                          onChange={(e) => setSelectedDistance(e.target.value)}
                          className="form-control"
                          style={{ padding: '8px 12px', minWidth: '130px' }}
                          id="filter-distance"
                        >
                          <option value="All">All Distances</option>
                          <option value="50">Within 50 km</option>
                          <option value="100">Within 100 km</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Caste/Community</label>
                        <select
                          value={selectedCaste}
                          onChange={(e) => setSelectedCaste(e.target.value)}
                          className="form-control"
                          style={{ padding: '8px 12px', minWidth: '130px' }}
                          id="filter-caste"
                        >
                          <option value="All">All Communities</option>
                          <option value="Sunni">Sunni</option>
                          <option value="Syed">Syed</option>
                          <option value="Hanafi">Hanafi</option>
                          <option value="Sheikh">Sheikh</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Verification Status</label>
                        <select
                          value={verificationFilter}
                          onChange={(e) => setVerificationFilter(e.target.value)}
                          className="form-control"
                          style={{ padding: '8px 12px', minWidth: '130px' }}
                          id="filter-verification"
                        >
                          <option value="All">All Profiles</option>
                          <option value="Verified">Call Verified Only</option>
                          <option value="Unverified">Pending Call Only</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Profiles Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
                    {filteredProfiles.map((profile) => {
                      const shouldBlur = !isLoggedIn || !hasPaid300;

                      return (
                        <article
                          key={profile.id}
                          className="profile-card"
                          style={{ '--profile-theme-color': profile.themeColor } as React.CSSProperties}
                        >
                          <div className="profile-header"></div>
                          <div className="profile-image-container">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300&h=300"
                              alt={profile.fullName}
                              className={shouldBlur ? 'blurred' : ''}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />

                            {shouldBlur && (
                              <div className="blur-overlay">
                                <div className="blur-overlay-title">🔒 Details Protected</div>
                                <p style={{ fontSize: '13px', marginBottom: '12px' }}>
                                  {!isLoggedIn ? 'Log in to view photos' : 'Pay ₹300 standard fee to view phone and photos'}
                                </p>
                                {!isLoggedIn ? (
                                  <button
                                    onClick={() => setShowLoginModal(true)}
                                    className="btn btn-gold"
                                    style={{ padding: '8px 16px', fontSize: '12px' }}
                                  >
                                    Log In
                                  </button>
                                ) : (
                                  <a
                                    href="#premium-pricing"
                                    className="btn btn-gold"
                                    style={{ padding: '8px 16px', fontSize: '12px' }}
                                  >
                                    Unlock Now (₹300)
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="profile-details">
                            <span className="profile-badge">Matrimonial Candidate</span>
                            <h3 className="profile-name">
                              {shouldBlur ? 'Profile Locked' : profile.fullName}{' '}
                              {profile.verificationStatus === 'APPROVED' && (
                                <span style={{ color: 'var(--gold-accent)', fontSize: '14px' }}>✔ Call Verified</span>
                              )}
                            </h3>

                            <div className="profile-meta-grid">
                              <div className="meta-item">
                                <strong>Marital Status</strong>
                                {profile.maritalStatus}
                              </div>
                              <div className="meta-item">
                                <strong>Location</strong>
                                {profile.city}, {profile.state}
                              </div>
                              <div className="meta-item">
                                <strong>Profession</strong>
                                {shouldBlur ? 'Hidden' : profile.occupation}
                              </div>
                              <div className="meta-item">
                                <strong>Education</strong>
                                {shouldBlur ? 'Hidden' : profile.education}
                              </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                📞 Phone: {shouldBlur ? '+91-XXXXX-XXXXX' : profile.phoneNumber}
                              </span>
                              {!shouldBlur && (
                                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                  Contact
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Pricing & Premium Packages */}
              <section id="premium-pricing" style={{ padding: '80px 0', backgroundColor: 'var(--cream-bg)' }}>
                <div className="container">
                  <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', color: 'var(--primary-emerald)' }}>
                      Pricing & Dynamic Membership Plans
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>All plans are subject to 18% GST calculation dynamically.</p>
                  </div>

                  {/* Standard Paywall Setup */}
                  <div className="card-theme-wrapper" style={{ maxWidth: '800px', margin: '0 auto 50px auto' }}>
                    <div className="ornament ornament-tl"></div>
                    <div className="ornament ornament-tr"></div>
                    <div className="ornament ornament-bl"></div>
                    <div className="ornament ornament-br"></div>

                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--primary-emerald)', marginBottom: '10px' }}>
                        Standard Monthly Access
                      </h3>
                      <div style={{ fontSize: '32px', fontWeight: 700, margin: '20px 0', color: 'var(--primary-crimson)' }}>
                        ₹300 <span style={{ fontSize: '16px', fontWeight: 'normal' }}>+ 18% GST (₹54) = </span> ₹354 / month
                      </div>
                      <p style={{ maxWidth: '600px', margin: '0 auto 30px auto', color: 'var(--text-muted)' }}>
                        Unlock standard profiles, unblur matrimonial matches, view verified phone numbers, and apply custom search filters.
                      </p>
                      <button
                        onClick={handleRazorpayCheckout}
                        className="btn btn-gold"
                        id="btn-subscribe-standard"
                      >
                        {hasPaid300 ? 'Active Subscription' : 'Activate Membership'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Footer */}
          <footer className="footer">
            <div className="container">
              <div className="footer-bottom">
                &copy; 2026 MOM Matrimonial Site. All Rights Reserved. Manual phone verification checks are active.
              </div>
            </div>
          </footer>
        </main>
      ) : (
        /* ADMIN PANEL */
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-accent)' }}>MOM Admin</h2>
            <ul className="admin-nav">
              <li
                className={`admin-nav-item ${adminActiveTab === 'verification' ? 'active' : ''}`}
                onClick={() => setAdminActiveTab('verification')}
              >
                👤 Verification Queue
              </li>
              <li
                className={`admin-nav-item ${adminActiveTab === 'logs' ? 'active' : ''}`}
                onClick={() => setAdminActiveTab('logs')}
              >
                📜 Audit Logs
              </li>
            </ul>

            <div style={{ marginTop: '50px', borderTop: '1px solid rgba(212,163,89,0.3)', paddingTop: '20px' }}>
              <h4>Referral Commission</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <input
                  type="range"
                  min="20"
                  max="23"
                  value={referralRate}
                  onChange={(e) => setReferralRate(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <span style={{ fontWeight: 'bold' }}>{referralRate}%</span>
              </div>
              <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>Adjustable range: 20% to 23%</p>
            </div>
          </aside>

          <main className="admin-content">
            {adminActiveTab === 'verification' ? (
              <div>
                <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-emerald)', marginBottom: '30px' }}>
                  Verification Call Queue
                </h1>

                {selectedRequestForReview ? (
                  <div className="card-theme-wrapper" style={{ marginBottom: '30px' }}>
                    <h3>Review Application: {selectedRequestForReview.profile?.fullName}</h3>
                    <div style={{ margin: '15px 0', fontSize: '14px', border: '1px solid var(--border-color)', padding: '15px', borderRadius: '8px', backgroundColor: '#fff' }}>
                      <p><strong>Phone:</strong> {selectedRequestForReview.profile?.phoneNumber}</p>
                      <p><strong>Location:</strong> {selectedRequestForReview.profile?.city}, {selectedRequestForReview.profile?.state}</p>
                      <p><strong>Bio:</strong> {selectedRequestForReview.profile?.bio}</p>
                      <p><strong>Family details:</strong> {selectedRequestForReview.profile?.familyInfo}</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Internal Phone-Call verification notes</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Write details from phone call verification here..."
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <button onClick={() => handleReviewSubmit('APPROVED')} className="btn btn-gold">
                        Approve Candidate
                      </button>
                      <button onClick={() => handleReviewSubmit('REJECTED')} className="btn btn-primary">
                        Reject Profile
                      </button>
                      <button onClick={() => handleReviewSubmit('NEEDS_FOLLOW_UP')} className="btn btn-secondary">
                        Needs Follow Up
                      </button>
                      <button onClick={() => setSelectedRequestForReview(null)} className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', height: '40px' }}>
                        <th>Candidate</th>
                        <th>Phone</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminRequests.map((req) => (
                        <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)', height: '60px' }}>
                          <td>
                            <strong>{req.profile?.fullName || 'Incomplete Profile'}</strong>
                          </td>
                          <td>{req.profile?.phoneNumber || 'N/A'}</td>
                          <td>{req.profile?.city || 'N/A'}</td>
                          <td>
                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                backgroundColor:
                                  req.status === 'APPROVED'
                                    ? 'rgba(18, 46, 34, 0.1)'
                                    : req.status === 'REJECTED'
                                    ? 'rgba(230, 92, 92, 0.1)'
                                    : 'rgba(240, 190, 50, 0.1)',
                                color:
                                  req.status === 'APPROVED'
                                    ? 'var(--primary-emerald)'
                                    : req.status === 'REJECTED'
                                    ? 'var(--primary-crimson)'
                                    : 'var(--gold-dark)',
                              }}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td>
                            {req.profile && (
                              <button
                                onClick={() => {
                                  setSelectedRequestForReview(req);
                                  setReviewNotes(req.notes || '');
                                }}
                                className="btn btn-gold"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                Review / Call
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-emerald)', marginBottom: '30px' }}>
                  Admin Verification Audit Logs
                </h1>

                <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', height: '40px' }}>
                        <th>Timestamp</th>
                        <th>Action By</th>
                        <th>Action</th>
                        <th>Target profile id</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', height: '50px', fontSize: '14px' }}>
                          <td>{new Date(log.createdAt).toLocaleString()}</td>
                          <td>{log.actorUserId}</td>
                          <td>{log.action}</td>
                          <td>{log.targetId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Google Login Simulator Modal */}
      {showLoginModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div className="card-theme-wrapper" style={{ maxWidth: '400px', width: '90%', margin: '20px' }}>
            <div className="ornament ornament-tl"></div>
            <div className="ornament ornament-tr"></div>
            <div className="ornament ornament-bl"></div>
            <div className="ornament ornament-br"></div>

            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--primary-emerald)', marginBottom: '16px' }}>
                Join MOM Matrimonial
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '30px' }}>
                Create a profile or log in securely using your Google account to get verified.
              </p>

              <button
                onClick={handleGoogleLogin}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  backgroundColor: '#ffffff',
                  color: '#444',
                  border: '1px solid #ddd',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                  alt="Google logo"
                  style={{ width: '20px', height: '20px' }}
                />
                Continue with Google
              </button>

              <button
                onClick={() => setShowLoginModal(false)}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '12px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
