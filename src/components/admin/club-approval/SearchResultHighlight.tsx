/**
 * Search Result Highlighting Component
 * Highlights search terms in text content for better visibility
 */

import React from 'react';

interface SearchResultHighlightProps {
  text: string;
  searchTerm?: string;
  className?: string;
  highlightClassName?: string;
}

export const SearchResultHighlight: React.FC<SearchResultHighlightProps> = ({
  text,
  searchTerm,
  className = '',
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-800 px-1 rounded'
}) => {
  if (!searchTerm || !text) {
    return <span className={className}>{text}</span>;
  }

  // Escape special regex characters in search term
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create regex for case-insensitive matching
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
  
  // Split text by search term matches
  const parts = text.split(regex);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part matches the search term (case-insensitive)
        const isMatch = regex.test(part);
        regex.lastIndex = 0; // Reset regex for next test
        
        return isMatch ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
};

export default SearchResultHighlight;