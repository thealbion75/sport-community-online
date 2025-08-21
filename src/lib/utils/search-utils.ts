/**
 * Enhanced Search Utilities
 * Provides advanced search functionality for club applications
 */

export interface SearchOptions {
  caseSensitive?: boolean;
  fuzzyMatch?: boolean;
  highlightMatches?: boolean;
  maxDistance?: number; // For fuzzy matching
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Enhanced search function with fuzzy matching support
 */
export function enhancedSearch(
  text: string,
  searchTerm: string,
  options: SearchOptions = {}
): boolean {
  const {
    caseSensitive = false,
    fuzzyMatch = false,
    maxDistance = 2
  } = options;

  if (!text || !searchTerm) return false;

  const normalizedText = caseSensitive ? text : text.toLowerCase();
  const normalizedSearch = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  // Exact match or substring match
  if (normalizedText.includes(normalizedSearch)) {
    return true;
  }

  // Fuzzy matching
  if (fuzzyMatch) {
    const words = normalizedText.split(/\s+/);
    return words.some(word => {
      const distance = levenshteinDistance(word, normalizedSearch);
      return distance <= maxDistance;
    });
  }

  return false;
}

/**
 * Get search match positions for highlighting
 */
export function getSearchMatches(
  text: string,
  searchTerm: string,
  options: SearchOptions = {}
): Array<{ start: number; end: number; match: string }> {
  const matches: Array<{ start: number; end: number; match: string }> = [];
  
  if (!text || !searchTerm) return matches;

  const {
    caseSensitive = false,
    fuzzyMatch = false,
    maxDistance = 2
  } = options;

  const normalizedText = caseSensitive ? text : text.toLowerCase();
  const normalizedSearch = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  // Find exact matches
  let index = 0;
  while ((index = normalizedText.indexOf(normalizedSearch, index)) !== -1) {
    matches.push({
      start: index,
      end: index + searchTerm.length,
      match: text.substring(index, index + searchTerm.length)
    });
    index += searchTerm.length;
  }

  // Find fuzzy matches if enabled
  if (fuzzyMatch && matches.length === 0) {
    const words = text.split(/\s+/);
    let currentIndex = 0;

    words.forEach(word => {
      const wordStart = text.indexOf(word, currentIndex);
      const normalizedWord = caseSensitive ? word : word.toLowerCase();
      
      if (levenshteinDistance(normalizedWord, normalizedSearch) <= maxDistance) {
        matches.push({
          start: wordStart,
          end: wordStart + word.length,
          match: word
        });
      }
      
      currentIndex = wordStart + word.length;
    });
  }

  return matches;
}

/**
 * Build search query for backend with advanced options
 */
export function buildSearchQuery(
  searchTerm: string,
  searchFields: string[],
  options: SearchOptions = {}
): { conditions: string[]; params: string[] } {
  const conditions: string[] = [];
  const params: string[] = [];

  if (!searchTerm || searchFields.length === 0) {
    return { conditions, params };
  }

  const { fuzzyMatch = false } = options;
  
  searchFields.forEach(field => {
    if (fuzzyMatch) {
      // For fuzzy search, we'll use LIKE with wildcards and soundex if available
      conditions.push(`(${field} LIKE ? OR SOUNDEX(${field}) = SOUNDEX(?))`);
      params.push(`%${searchTerm}%`, searchTerm);
    } else {
      conditions.push(`${field} LIKE ?`);
      params.push(`%${searchTerm}%`);
    }
  });

  return { conditions, params };
}

/**
 * Normalize search term for better matching
 */
export function normalizeSearchTerm(searchTerm: string): string {
  return searchTerm
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Extract search keywords from a search term
 */
export function extractSearchKeywords(searchTerm: string): string[] {
  return normalizeSearchTerm(searchTerm)
    .split(' ')
    .filter(keyword => keyword.length > 0);
}

/**
 * Score search results based on relevance
 */
export function scoreSearchResult(
  text: string,
  searchTerm: string,
  fieldWeight: number = 1
): number {
  if (!text || !searchTerm) return 0;

  const normalizedText = text.toLowerCase();
  const normalizedSearch = searchTerm.toLowerCase();
  
  let score = 0;

  // Exact match gets highest score
  if (normalizedText === normalizedSearch) {
    score += 100 * fieldWeight;
  }
  
  // Starts with search term
  else if (normalizedText.startsWith(normalizedSearch)) {
    score += 80 * fieldWeight;
  }
  
  // Contains search term
  else if (normalizedText.includes(normalizedSearch)) {
    score += 60 * fieldWeight;
  }
  
  // Word boundary matches
  const wordBoundaryRegex = new RegExp(`\\b${normalizedSearch}\\b`, 'i');
  if (wordBoundaryRegex.test(normalizedText)) {
    score += 40 * fieldWeight;
  }

  // Keyword matches
  const keywords = extractSearchKeywords(searchTerm);
  const matchedKeywords = keywords.filter(keyword => 
    normalizedText.includes(keyword)
  );
  score += (matchedKeywords.length / keywords.length) * 20 * fieldWeight;

  return score;
}