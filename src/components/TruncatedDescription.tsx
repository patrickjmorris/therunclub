'use client'

import React, { useState, useRef, useEffect } from 'react';

interface TruncatedDescriptionProps {
  description: string;
  maxLines: number;
}

const TruncatedDescription: React.FC<TruncatedDescriptionProps> = ({ description, maxLines }) => {
  const [isTruncated, setIsTruncated] = useState(true);
  const [showButton, setShowButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (contentRef.current) {
        const lineHeight = parseInt(window.getComputedStyle(contentRef.current).lineHeight);
        const maxHeight = lineHeight * maxLines;
        setShowButton(contentRef.current.scrollHeight > maxHeight);
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);

    return () => {
      window.removeEventListener('resize', checkTruncation);
    };
  }, [maxLines]);

  return (
    <div>
      <div
        ref={contentRef}
        className={`prose prose-slate text-lg font-medium leading-8 text-slate-700 ${
          isTruncated ? 'line-clamp-3' : ''
        }`}
        dangerouslySetInnerHTML={{ __html: description }}
      />
      {showButton && (
        <button
          onClick={() => setIsTruncated(!isTruncated)}
          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {isTruncated ? 'See more' : 'See less'}
        </button>
      )}
    </div>
  );
};

export default TruncatedDescription;