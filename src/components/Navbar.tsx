'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import { LanguageToggle } from './LanguageToggle';
import { siteConfig } from '../config/site';
import { NotificationBell } from './dashboard/NotificationBell';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const {
    isLoggedIn,
    setIsLoggedIn,
    setHasPaid300,
    setActivePackages,
    setIsRegistering,
    setRegStep,
    setShowLoginModal,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    userProfile
  } = useApp();

  const [pkgMenuOpen, setPkgMenuOpen] = React.useState(false);
  // Premium overview and the dedicated package directories all live under the
  // Packages menu, so keep the trigger highlighted for any of those routes.
  const isPackagesActive = pathname === '/premium' || pathname.startsWith('/packages');

  const handleEditProfile = () => {
    router.push('/my-account');
  };

  const handleRegisterFree = () => {
    setIsLoggedIn(true);
    setIsRegistering(true);
    setRegStep(1);
    router.push('/');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setHasPaid300(false);
    setActivePackages([]);
    setIsRegistering(false);
    router.push('/');
  };

  const handleLoginTrigger = () => {
    setShowLoginModal(true);
  };

  return (
    <header className="header font-sans">
      {/* Top decorative maroon bar with gold crest ornament */}
      <div className="header-top-strip">
        <div className="header-top-strip-ornament"></div>
      </div>

      <div className="container nav-outer-container">
        <div className="nav-container">
          <style>{`
            @media (max-width: 1280px) {
              #hamburger-btn { display: flex !important; }
              .nav-menu-desktop { display: none !important; }
              .nav-row-2 { display: none !important; }
            }
          `}</style>

          {/* Row 1: Primary links, Logo, Secondary Links */}
          <div className="nav-row-1">
            {/* Left Column (Row 1): Hamburger (mobile) + primary nav links (desktop) */}
            <div className="nav-section nav-left">
            <button
              className="hamburger-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              id="hamburger-btn"
            >
              ☰
            </button>
            <nav className="nav-menu-desktop">
              <ul className="nav-menu">
                <li>
                  <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
                    <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    {t('nav.home')}
                  </Link>
                </li>
                <li>
                  <Link href="/search" className={`nav-link ${pathname === '/search' ? 'active' : ''}`}>
                    <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    {t('nav.browse')}
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className={`nav-link ${pathname === '/how-it-works' ? 'active' : ''}`}>
                    <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    {t('nav.howItWorks')}
                  </Link>
                </li>
              </ul>
            </nav>
            {/* Vertical separator */}
            <div className="nav-left-divider nav-menu-desktop"></div>
          </div>

          {/* Center Column: Logo */}
          <div className="logo-wrapper" style={{ gridColumn: 2, justifySelf: 'center', zIndex: 10, display: 'flex', alignItems: 'center' }}>
            <Link href="/" className="logo-link" id="header-logo-link" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{siteConfig.logoText}</span>
            </Link>
          </div>

          {/* Right Column: Premium/Safety nav links */}
          <div className="nav-section nav-right">
            {/* Vertical separator */}
            <div className="nav-right-divider nav-menu-desktop"></div>
            <nav className="nav-menu-desktop">
              <ul className="nav-menu">
                  <li
                    style={{ position: 'relative' }}
                    onMouseEnter={() => setPkgMenuOpen(true)}
                    onMouseLeave={() => setPkgMenuOpen(false)}
                  >
                    <Link
                      href="/premium"
                      className={`nav-link ${isPackagesActive ? 'active' : ''}`}
                      aria-haspopup="true"
                      aria-expanded={pkgMenuOpen}
                      onFocus={() => setPkgMenuOpen(true)}
                    >
                      <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path>
                        <path d="M3 20h18a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1z"></path>
                      </svg>
                      {t('nav.premium')}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginInlineStart: '2px', transform: pkgMenuOpen ? 'rotate(180deg)' : 'none', transition: 'var(--transition-smooth)' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </Link>
                    {pkgMenuOpen && (
                      <ul
                        role="menu"
                        style={{
                          position: 'absolute',
                          top: '100%',
                          insetInlineStart: 0,
                          marginTop: '6px',
                          minWidth: '210px',
                          listStyle: 'none',
                          padding: '8px',
                          background: 'var(--cream-bg)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-toast)',
                          zIndex: 200,
                        }}
                      >
                        <li role="none">
                          <Link
                            href="/premium"
                            role="menuitem"
                            onClick={() => setPkgMenuOpen(false)}
                            style={{
                              display: 'block',
                              padding: '10px 14px',
                              fontSize: '13.5px',
                              fontWeight: 700,
                              borderRadius: '8px',
                              textDecoration: 'none',
                              color: pathname === '/premium' ? 'var(--deep-maroon)' : 'var(--text-dark)',
                              backgroundColor: pathname === '/premium' ? 'var(--soft-cream)' : 'transparent',
                            }}
                          >
                            {t('nav.allPackages')}
                          </Link>
                        </li>
                        <li role="none">
                          <Link
                            href="/packages/second-marriage"
                            role="menuitem"
                            onClick={() => setPkgMenuOpen(false)}
                            style={{
                              display: 'block',
                              padding: '10px 14px',
                              fontSize: '13.5px',
                              fontWeight: 700,
                              borderRadius: '8px',
                              textDecoration: 'none',
                              color: pathname === '/packages/second-marriage' ? 'var(--deep-maroon)' : 'var(--text-dark)',
                              backgroundColor: pathname === '/packages/second-marriage' ? 'var(--soft-cream)' : 'transparent',
                            }}
                          >
                            {t('nav.secondMarriage')}
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                  <li>
                    <Link href="/safety" className={`nav-link ${pathname === '/safety' ? 'active' : ''}`}>
                      <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      {t('nav.safety')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/event-management" className={`nav-link ${pathname === '/event-management' ? 'active' : ''}`}>
                      <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <path d="M9 22V12h6v10"></path>
                        <circle cx="17" cy="5" r="3"></circle>
                        <path d="M15.5 3.5 L18.5 6.5"></path>
                      </svg>
                      {t('nav.events')}
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          {/* Row 2: Action buttons */}
          <div className="nav-row-2 nav-menu-desktop">
            <div className="nav-actions-wrapper">
              <LanguageToggle variant="nav" />
              {isLoggedIn && <NotificationBell />}
              {isLoggedIn && (
                  <Link
                    href="/my-account"
                    className="btn btn-secondary nav-btn"
                  >
                    <svg className="btn-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    {t('nav.myAccount')}
                  </Link>
                )}
                <Link
                  href="/admin"
                  className="btn btn-secondary nav-btn"
                  id="btn-toggle-admin"
                >
                  <svg className="btn-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  {pathname.startsWith('/admin') ? t('nav.viewWebsite') : t('nav.adminPanel')}
                </Link>
                {isLoggedIn ? (
                  <div className="nav-actions-group">
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-brand)', fontFamily: 'var(--font-serif)', display: 'inline-flex', alignItems: 'center' }}>{t('nav.greeting')}</span>
                    <button
                      onClick={handleLogout}
                      className="btn btn-primary nav-btn"
                      id="btn-logout"
                    >
                      <svg className="btn-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      {t('nav.logout')}
                    </button>
                  </div>
                ) : (
                  <div className="nav-actions-group">
                    <button
                      onClick={handleLoginTrigger}
                      className="btn btn-secondary nav-btn"
                      id="btn-login-trigger"
                    >
                      <svg className="btn-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      {t('nav.login')}
                    </button>
                    <button
                      onClick={handleRegisterFree}
                      className="btn btn-gold nav-btn"
                    >
                      <svg className="btn-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="17" y1="11" x2="23" y2="11"></line>
                      </svg>
                      {t('nav.registerFree')}
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div
          className="modal-overlay font-sans"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ justifyContent: 'flex-start', alignItems: 'stretch', padding: 0, zIndex: 1000 }}
        >
          <div
            style={{
              backgroundColor: 'var(--cream-bg)',
              width: '280px',
              padding: '24px',
              boxShadow: 'var(--shadow-toast)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="logo">
                <Image
                  src="/images/rishte-forever-logo.png"
                  alt="Asan Nikah — Where Faith Meets Forever"
                  width={180}
                  height={68}
                />
              </span>
              <button className="modal-close-btn" onClick={() => setIsMobileMenuOpen(false)}>×</button>
            </div>
            <hr style={{ borderColor: 'var(--border-color)' }} />
            {isLoggedIn && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>Notifications</span>
                <NotificationBell />
              </div>
            )}
            <LanguageToggle variant="block" />
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: '10px 16px',
                fontWeight: '700',
                fontSize: '15px',
                color: pathname === '/' ? 'var(--deep-maroon)' : 'var(--text-dark)',
                backgroundColor: pathname === '/' ? 'var(--soft-cream)' : 'transparent',
                borderRadius: '8px',
                borderLeft: pathname === '/' ? '4px solid var(--gold-accent)' : '4px solid transparent',
                textDecoration: 'none',
                transition: 'var(--transition-smooth)'
              }}
            >
              {t('nav.home')}
            </Link>
            <Link
              href="/search"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: '10px 16px',
                fontWeight: '700',
                fontSize: '15px',
                color: pathname === '/search' ? 'var(--deep-maroon)' : 'var(--text-dark)',
                backgroundColor: pathname === '/search' ? 'var(--soft-cream)' : 'transparent',
                borderRadius: '8px',
                borderLeft: pathname === '/search' ? '4px solid var(--gold-accent)' : '4px solid transparent',
                textDecoration: 'none',
                transition: 'var(--transition-smooth)'
              }}
            >
              {t('nav.browse')}
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: '10px 16px',
                fontWeight: '700',
                fontSize: '15px',
                color: pathname === '/how-it-works' ? 'var(--deep-maroon)' : 'var(--text-dark)',
                backgroundColor: pathname === '/how-it-works' ? 'var(--soft-cream)' : 'transparent',
                borderRadius: '8px',
                borderLeft: pathname === '/how-it-works' ? '4px solid var(--gold-accent)' : '4px solid transparent',
                textDecoration: 'none',
                transition: 'var(--transition-smooth)'
              }}
            >
              {t('nav.howItWorks')}
            </Link>
            <Link
              href="/premium"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: '10px 16px',
                fontWeight: '700',
                fontSize: '15px',
                color: pathname === '/premium' ? 'var(--deep-maroon)' : 'var(--text-dark)',
                backgroundColor: pathname === '/premium' ? 'var(--soft-cream)' : 'transparent',
                borderRadius: '8px',
                borderLeft: pathname === '/premium' ? '4px solid var(--gold-accent)' : '4px solid transparent',
                textDecoration: 'none',
                transition: 'var(--transition-smooth)'
              }}
            >
              {t('nav.pricing')}
            </Link>
            <Link
              href="/packages/second-marriage"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: '10px 16px 10px 32px',
                fontWeight: '700',
                fontSize: '14px',
                color: pathname === '/packages/second-marriage' ? 'var(--deep-maroon)' : 'var(--text-dark)',
                backgroundColor: pathname === '/packages/second-marriage' ? 'var(--soft-cream)' : 'transparent',
                borderRadius: '8px',
                borderLeft: pathname === '/packages/second-marriage' ? '4px solid var(--gold-accent)' : '4px solid transparent',
                textDecoration: 'none',
                transition: 'var(--transition-smooth)'
              }}
            >
              ↳ {t('nav.secondMarriage')}
            </Link>
            <Link
              href="/safety"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: '10px 16px',
                fontWeight: '700',
                fontSize: '15px',
                color: pathname === '/safety' ? 'var(--deep-maroon)' : 'var(--text-dark)',
                backgroundColor: pathname === '/safety' ? 'var(--soft-cream)' : 'transparent',
                borderRadius: '8px',
                borderLeft: pathname === '/safety' ? '4px solid var(--gold-accent)' : '4px solid transparent',
                textDecoration: 'none',
                transition: 'var(--transition-smooth)'
              }}
            >
              {t('nav.safetyGuidelines')}
            </Link>
            <Link
              href="/event-management"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: '10px 16px',
                fontWeight: '700',
                fontSize: '15px',
                color: pathname === '/event-management' ? 'var(--deep-maroon)' : 'var(--text-dark)',
                backgroundColor: pathname === '/event-management' ? 'var(--soft-cream)' : 'transparent',
                borderRadius: '8px',
                borderLeft: pathname === '/event-management' ? '4px solid var(--gold-accent)' : '4px solid transparent',
                textDecoration: 'none',
                transition: 'var(--transition-smooth)'
              }}
            >
              {t('nav.eventManagement')}
            </Link>

            {isLoggedIn && (
              <Link
                href="/my-account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'center', display: 'block' }}
              >
                {t('nav.myAccount')}
              </Link>
            )}

            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="btn btn-secondary"
              style={{ width: '100%', textAlign: 'center', display: 'block' }}
            >
              {pathname.startsWith('/admin') ? t('nav.viewWebsite') : t('nav.adminPanel')}
            </Link>

            {isLoggedIn ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {t('nav.logout')}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => {
                    handleLoginTrigger();
                    setIsMobileMenuOpen(false);
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => {
                    handleRegisterFree();
                    setIsMobileMenuOpen(false);
                  }}
                  className="btn btn-gold"
                  style={{ width: '100%' }}
                >
                  {t('nav.registerFree')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
