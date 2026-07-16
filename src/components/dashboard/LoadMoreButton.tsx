'use client';

import React from 'react';

interface LoadMoreButtonProps {
  hasMore: boolean;
  loading: boolean;
  onClick: () => void;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ hasMore, loading, onClick }) => {
  if (!hasMore) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
      <button onClick={onClick} disabled={loading} className="btn btn-secondary" style={{ padding: '10px 28px' }}>
        {loading ? 'Loading…' : 'Load more'}
      </button>
    </div>
  );
};

export default LoadMoreButton;
