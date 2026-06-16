'use client';

import React from 'react';
import { FloralCorner } from './NikahComponents';
import { BusinessLocation } from '../lib/businessLocation';

interface GoogleMapSectionProps {
  location: BusinessLocation;
  isLoading?: boolean;
}

export const GoogleMapSection: React.FC<GoogleMapSectionProps> = ({ location, isLoading = false }) => {
  const { name, address, phone, phoneRaw, mapEmbedUrl, mapOpenUrl } = location;

  return (
    <div 
      className="card-theme-wrapper" 
      style={{ 
        position: 'relative', 
        padding: '40px', 
        marginTop: '48px', 
        borderRadius: 'var(--border-radius-xl, 16px)', 
        border: '1px solid var(--gold-light, #e9d5ff)', 
        background: 'var(--warm-ivory, #fdfbf7)', 
        boxShadow: 'var(--shadow-premium, 0 10px 30px rgba(0,0,0,0.05))',
        overflow: 'hidden'
      }}
    >
      <FloralCorner position="tl" color="var(--gold-accent)" />
      <FloralCorner position="tr" color="var(--gold-accent)" />
      <FloralCorner position="bl" color="var(--gold-accent)" />
      <FloralCorner position="br" color="var(--gold-accent)" />

      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '32px' 
        }}
      >
        {/* Section Heading */}
        <div style={{ textAlign: 'center' }}>
          <span 
            className="script-accent" 
            style={{ 
              display: 'block', 
              fontSize: '18px', 
              color: 'var(--gold-accent, #c5a880)', 
              fontFamily: 'var(--font-serif)', 
              fontStyle: 'italic',
              marginBottom: '6px' 
            }}
          >
            Visit Our Office
          </span>
          <h2 
            style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: '28px', 
              color: 'var(--deep-maroon, #6f1d35)', 
              fontWeight: 700, 
              margin: '0 0 8px 0',
              letterSpacing: '0.5px'
            }}
          >
            Visit / Contact Shadi Mubarak
          </h2>
          <div 
            style={{ 
              width: '80px', 
              height: '1px', 
              background: 'linear-gradient(90deg, transparent, var(--gold-accent), transparent)', 
              margin: '12px auto' 
            }} 
          />
        </div>

        {/* Content Body Grid */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', 
            gap: '32px',
            alignItems: 'stretch'
          }}
        >
          {/* Information & Buttons Panel */}
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              gap: '20px',
              padding: '10px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 
                style={{ 
                  fontFamily: 'var(--font-serif)', 
                  fontSize: '20px', 
                  color: 'var(--deep-maroon, #6f1d35)', 
                  margin: '0',
                  fontWeight: 600
                }}
              >
                {name} HQ
              </h3>
              <p 
                style={{ 
                  fontSize: '15px', 
                  color: 'var(--text-dark, #2b2b2b)', 
                  lineHeight: '1.6', 
                  margin: '0' 
                }}
              >
                📍 {address || "Address will be updated soon"}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span 
                style={{ 
                  fontSize: '12px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px', 
                  color: 'var(--gold-accent, #c5a880)', 
                  fontWeight: 600 
                }}
              >
                Customer Support Call Hours
              </span>
              <p style={{ margin: '0', fontSize: '15px', color: 'var(--text-dark)' }}>
                📞 Phone:{' '}
                <a 
                  href={`tel:${phoneRaw}`} 
                  style={{ 
                    color: 'var(--deep-maroon, #6f1d35)', 
                    fontWeight: 'bold', 
                    textDecoration: 'underline',
                    transition: 'opacity 0.2s' 
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '1.0')}
                >
                  {phone}
                </a>
              </p>
              <span style={{ fontSize: '13px', color: 'var(--text-muted, #7c7c7c)' }}>
                Available daily from 10:00 AM to 6:00 PM (IST) for verification assistance.
              </span>
            </div>

            {/* Actions Section */}
            <div 
              style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px', 
                marginTop: '10px' 
              }}
            >
              {mapOpenUrl ? (
                <a 
                  href={mapOpenUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-gold"
                  style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px', 
                    fontSize: '14px', 
                    textDecoration: 'none',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  Open in Google Maps
                </a>
              ) : (
                <button 
                  disabled 
                  className="btn" 
                  style={{ 
                    padding: '12px 20px', 
                    fontSize: '14px',
                    opacity: 0.6,
                    cursor: 'not-allowed'
                  }}
                >
                  Map link unavailable
                </button>
              )}

              <a 
                href={`tel:${phoneRaw}`} 
                className="btn btn-secondary"
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px', 
                  fontSize: '14px', 
                  textDecoration: 'none',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Call Support
              </a>
            </div>
          </div>

          {/* Interactive Map Embed Container */}
          <div 
            style={{ 
              position: 'relative', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              border: '1.5px solid var(--gold-light, #e9d5ff)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
              backgroundColor: '#eaeaea',
              minHeight: '260px'
            }}
          >
            {isLoading ? (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%', 
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  backgroundColor: 'var(--soft-cream)'
                }}
              >
                Loading location map...
              </div>
                        ) : mapEmbedUrl ? (
              <iframe
                title="Google Maps Location of Shadi Mubarak Office"
                src={mapEmbedUrl}
                className="map-iframe"
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '24px',
                  height: '100%', 
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  backgroundColor: 'var(--soft-cream)'
                }}
              >
                <span style={{ fontSize: '24px', marginBottom: '8px' }}>📍</span>
                <span>Map display is currently disabled or address details are pending update.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
