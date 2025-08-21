/**
 * Search Utilities Tests
 * Tests for enhanced search functionality utilities
 */

import { describe, it, expect } from 'vitest';
import {
  enhancedSearch,
  getSearchMatches,
  buildSearchQuery,
  normalizeSearchTerm,
  extractSearchKeywords,
  scoreSearchResult
} from '../search-utils';

describe('search-utils', () => {
  describe('enhancedSearch', () => {
    it('performs case-insensitive substring search by default', () => {
      expect(enhancedSearch('Football Club', 'football')).toBe(true);
      expect(enhancedSearch('Football Club', 'FOOTBALL')).toBe(true);
      expect(enhancedSearch('Football Club', 'basketball')).toBe(false);
    });

    it('performs case-sensitive search when specified', () => {
      expect(enhancedSearch('Football Club', 'Football', { caseSensitive: true })).toBe(true);
      expect(enhancedSearch('Football Club', 'football', { caseSensitive: true })).toBe(false);
    });

    it('performs fuzzy matching when enabled', () => {
      expect(enhancedSearch('Football Club', 'Footbal', { fuzzyMatch: true, maxDistance: 2 })).toBe(true);
      expect(enhancedSearch('Football Club', 'Fotball', { fuzzyMatch: true, maxDistance: 2 })).toBe(true);
      expect(enhancedSearch('Football Club', 'Basketball', { fuzzyMatch: true, maxDistance: 2 })).toBe(false);
    });

    it('handles empty inputs', () => {
      expect(enhancedSearch('', 'test')).toBe(false);
      expect(enhancedSearch('test', '')).toBe(false);
      expect(enhancedSearch('', '')).toBe(false);
    });
  });

  describe('getSearchMatches', () => {
    it('finds exact matches', () => {
      const matches = getSearchMatches('Football Club Manchester', 'Club');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({
        start: 9,
        end: 13,
        match: 'Club'
      });
    });

    it('finds multiple matches', () => {
      const matches = getSearchMatches('Club Football Club', 'Club');
      expect(matches).toHaveLength(2);
      expect(matches[0].start).toBe(0);
      expect(matches[1].start).toBe(14);
    });

    it('handles case-insensitive matching', () => {
      const matches = getSearchMatches('Football CLUB', 'club');
      expect(matches).toHaveLength(1);
      expect(matches[0].match).toBe('CLUB');
    });

    it('returns empty array for no matches', () => {
      const matches = getSearchMatches('Football Club', 'Basketball');
      expect(matches).toHaveLength(0);
    });
  });

  describe('buildSearchQuery', () => {
    it('builds basic search query', () => {
      const { conditions, params } = buildSearchQuery('test', ['name', 'email']);
      expect(conditions).toEqual(['name LIKE ?', 'email LIKE ?']);
      expect(params).toEqual(['%test%', '%test%']);
    });

    it('builds fuzzy search query', () => {
      const { conditions, params } = buildSearchQuery('test', ['name'], { fuzzyMatch: true });
      expect(conditions).toEqual(['(name LIKE ? OR SOUNDEX(name) = SOUNDEX(?))']);
      expect(params).toEqual(['%test%', 'test']);
    });

    it('handles empty search term', () => {
      const { conditions, params } = buildSearchQuery('', ['name']);
      expect(conditions).toHaveLength(0);
      expect(params).toHaveLength(0);
    });

    it('handles empty search fields', () => {
      const { conditions, params } = buildSearchQuery('test', []);
      expect(conditions).toHaveLength(0);
      expect(params).toHaveLength(0);
    });
  });

  describe('normalizeSearchTerm', () => {
    it('trims whitespace', () => {
      expect(normalizeSearchTerm('  test  ')).toBe('test');
    });

    it('converts to lowercase', () => {
      expect(normalizeSearchTerm('TEST')).toBe('test');
    });

    it('removes special characters', () => {
      expect(normalizeSearchTerm('test@#$%')).toBe('test');
    });

    it('normalizes multiple spaces', () => {
      expect(normalizeSearchTerm('test   multiple   spaces')).toBe('test multiple spaces');
    });

    it('handles complex input', () => {
      expect(normalizeSearchTerm('  Test@Club#123  ')).toBe('testclub123');
    });
  });

  describe('extractSearchKeywords', () => {
    it('extracts individual words', () => {
      expect(extractSearchKeywords('football club')).toEqual(['football', 'club']);
    });

    it('handles single word', () => {
      expect(extractSearchKeywords('football')).toEqual(['football']);
    });

    it('filters empty keywords', () => {
      expect(extractSearchKeywords('football   club')).toEqual(['football', 'club']);
    });

    it('normalizes keywords', () => {
      expect(extractSearchKeywords('Football CLUB')).toEqual(['football', 'club']);
    });

    it('handles empty input', () => {
      expect(extractSearchKeywords('')).toEqual([]);
      expect(extractSearchKeywords('   ')).toEqual([]);
    });
  });

  describe('scoreSearchResult', () => {
    it('gives highest score for exact match', () => {
      const score = scoreSearchResult('football', 'football');
      expect(score).toBeGreaterThan(100);
    });

    it('gives high score for starts with match', () => {
      const score = scoreSearchResult('football club', 'football');
      expect(score).toBeGreaterThan(80);
    });

    it('gives medium score for contains match', () => {
      const score = scoreSearchResult('manchester football club', 'football');
      expect(score).toBeGreaterThan(60);
    });

    it('applies field weight multiplier', () => {
      const score = scoreSearchResult('football', 'football', 2);
      expect(score).toBeGreaterThan(200);
    });

    it('gives score for word boundary matches', () => {
      const score = scoreSearchResult('the football club', 'football');
      expect(score).toBeGreaterThan(0);
    });

    it('gives score for keyword matches', () => {
      const score = scoreSearchResult('manchester united football club', 'football club');
      expect(score).toBeGreaterThan(0);
    });

    it('returns 0 for no match', () => {
      const score = scoreSearchResult('basketball', 'football');
      expect(score).toBe(0);
    });

    it('handles empty inputs', () => {
      expect(scoreSearchResult('', 'test')).toBe(0);
      expect(scoreSearchResult('test', '')).toBe(0);
    });
  });
});