'use client';

import React, { useState } from 'react';
import { useSimulator } from '../../../context/SimulatorContext';
import Navbar from '../../../components/Navbar';
import ProfileGrid from '../../../components/ProfileGrid';
import { SectionHeading, PremiumFooter } from '../../../components/NikahComponents';

export default function HighProfilePage() {
  const { profiles, isLoggedIn, simulatedPackages, handleRazorpayCheckout } = useSimulator();
  const [searchQuery, setSearchQuery] = useState('');

  // High Profile filtering
  const highProfiles = profiles.filter((p) => {
    const isHighProfile =
      (p as any).category === 'high_profile' ||
      p.occupation.toLowerCase().includes('doctor') ||
      p.occupation.toLowerCase().includes('engineer') ||
      p.occupation.toLowerCase().includes('business') ||
      p.occupation.toLowerCase().includes('professional') ||
      p.annualIncomeRange.includes('₹10 LPA') ||
      p.annualIncomeRange.includes('₹15 LPA') ||
      p.annualIncomeRange.includes('Above');
      
    if (!isHighProfile) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.occupation.toLowerCase().includes(q) ||
        p.education.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <div className="container font-sans" style={{ padding: '40px 0 80px 0' }}>
          <SectionHeading
            title="High Profile Matches"
            subtitle="Browse premium candidates earning ₹10 Lakh+ annually (Doctors, Engineers, Business Owners & Premium Families)."
            scriptText="Exclusive Premium Directory"
          />

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 350px',
            gap: '30px',
            marginTop: '30px',
            alignItems: 'start'
          }} className="high-profile-container">
            <div>
              <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Search High Profiles (e.g. city, occupation...)"
                  className="form-control"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flexGrow: 1 }}
                />
              </div>

              <ProfileGrid filteredProfiles={highProfiles} />
            </div>

            <div className="card-theme-wrapper" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--deep-maroon)', fontSize: '20px', marginBottom: '16px' }}>
                High Profile Package
              </h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--deep-maroon)', marginBottom: '8px' }}>
                ₹21,000 <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>+ 18% GST</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Unlock access to our exclusive verified tier of ultra-affluent and highly-educated matches.
              </p>
              
              <ul style={{ paddingLeft: '20px', marginBottom: '24px', fontSize: '13.5px', color: 'var(--text-dark)' }}>
                <li style={{ marginBottom: '8px' }}>For candidates earning ₹10 LPA+</li>
                <li style={{ marginBottom: '8px' }}>Leads provided until marriage</li>
                <li style={{ marginBottom: '8px' }}>₹25,000 payable after marriage confirmation</li>
              </ul>

              <button
                className="btn btn-gold"
                style={{ width: '100%', padding: '12px', fontSize: '15px' }}
                onClick={() => handleRazorpayCheckout('high_profile_package', 21000, 'High Profile Package')}
                disabled={simulatedPackages.includes('high_profile_package')}
              >
                {simulatedPackages.includes('high_profile_package') ? 'Package Active ✅' : 'Buy High Profile Package'}
              </button>
            </div>
          </div>
        </div>
      </main>
      <PremiumFooter onNavigate={(view) => window.location.href = `/${view === 'home' ? '' : view}`} />
    </>
  );
}
