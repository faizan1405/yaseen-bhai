'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSimulator } from '../../context/SimulatorContext';
import Navbar from '../../components/Navbar';
import { SectionHeading, PremiumPlanCard, PremiumFooter } from '../../components/NikahComponents';

export default function PremiumPage() {
  const router = useRouter();
  const {
    hasPaid300,
    simulatedPackages,
    handleRazorpayCheckout
  } = useSimulator();

  const handleNavigate = (view: string) => {
    router.push('/' + (view === 'home' ? '' : view));
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <div className="container font-sans" style={{ padding: '40px 0 80px 0' }}>
          <SectionHeading
            title="Premium Matrimonial Packages"
            subtitle="Choose a package that fits your matchmaking needs. Keep your monthly membership active to access our search directory."
            scriptText="Premium Services"
          />

          <div className="grid-4" style={{ marginBottom: '60px' }}>
            <PremiumPlanCard
              title="Monthly Membership"
              price={300}
              gstRate={0.18}
              billingText="per month"
              features={['View unblurred normal profiles', 'Reveal call-verified phone numbers', 'Advanced directory search filters', 'Save matching biodatas']}
              isActive={hasPaid300 || simulatedPackages.includes('monthly_membership')}
              ctaText="Activate Membership"
              onActivate={() => handleRazorpayCheckout('monthly_membership', 300, 'Monthly Membership')}
              isPopular
            />
            <PremiumPlanCard
              title="Good Profile Package"
              price={5500}
              gstRate={0.18}
              billingText="one-time base"
              features={['For handsome & beautiful profile matches', 'Leads provided until marriage', '₹21,000 payable after marriage confirmation', 'Requires active ₹300 Monthly Membership']}
              isActive={simulatedPackages.includes('good_profile_package')}
              ctaText="Buy Good Profile Package"
              onActivate={() => handleRazorpayCheckout('good_profile_package', 5500, 'Good Profile Package')}
            />
            <PremiumPlanCard
              title="Second Marriage Package"
              price={11000}
              gstRate={0.18}
              billingText="one-time fee"
              features={['For second marriage matches', 'Private segregated directory listing', 'Leads provided until marriage', 'No extra after-marriage fee']}
              isActive={simulatedPackages.includes('second_marriage_package')}
              ctaText="Buy Second Marriage Package"
              onActivate={() => handleRazorpayCheckout('second_marriage_package', 11000, 'Second Marriage Package')}
            />
            <PremiumPlanCard
              title="High Profile Package"
              price={21000}
              gstRate={0.18}
              billingText="one-time base"
              features={['For candidates earning ₹10 lakh+ annually', 'Doctors, engineers, professionals & premium families', 'Leads provided until marriage', '₹25,000 payable after marriage confirmation']}
              isActive={simulatedPackages.includes('high_profile_package')}
              ctaText="Buy High Profile Package"
              onActivate={() => handleRazorpayCheckout('high_profile_package', 21000, 'High Profile Package')}
            />
          </div>

          {/* Features Comparison Grid */}
          <div className="card-theme-wrapper" style={{ padding: '36px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--deep-maroon)', marginBottom: '24px', textAlign: 'center' }}>Package Comparison Matrix</h3>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', height: '40px', color: 'var(--deep-maroon)', fontWeight: 'bold' }}>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Feature Benefits</th>
                    <th>Monthly Membership</th>
                    <th>Good Profile</th>
                    <th>Second Marriage</th>
                    <th>High Profile</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>Directory Search Access</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>Unblurred Normal Profiles</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>Good Profile Unlock</td>
                    <td>—</td>
                    <td>✓</td>
                    <td>—</td>
                    <td>—</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>Leads Provided Until Marriage</td>
                    <td>—</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>Segregated Second Marriage Directory</td>
                    <td>—</td>
                    <td>—</td>
                    <td>✓</td>
                    <td>—</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>Earning ₹10 Lakh+ annually Directory</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <PremiumFooter onNavigate={handleNavigate} />
    </>
  );
}
