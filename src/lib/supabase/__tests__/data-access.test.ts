/**
 * Data Access Layer Tests
 * Tests for the Supabase data access functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClub, getClubById, getClubs } from '../clubs';
import { createVolunteerProfile, getVolunteerProfileByUserId } from '../volunteers';
import { createOpportunity, getOpportunityById } from '../opportunities';
import { createApplication, getApplicationById } from '../applications';
import { sendMessage, getMessageById } from '../messages';
import { signUp, signIn, getCurrentUser } from '../auth';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    getUser: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  rpc: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/lib/react-query-error-handler', () => ({
  handleSupabaseError: vi.fn((error) => ({ message: error.message || 'Test error' })),
}));

vi.mock('@/lib/sanitization', () => ({
  sanitizeObject: vi.fn((obj) => obj),
}));

describe('Clubs Data Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createClub', () => {
    it('should create a club successfully', async () => {
      const mockClub = {
        id: '1',
        name: 'Test Club',
        location: 'Test Location',
        contact_email: 'test@example.com',
        sport_types: ['football'],
        verified: false,
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockClub, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await createClub({
        name: 'Test Club',
        location: 'Test Location',
        contact_email: 'test@example.com',
        sport_types: ['football'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockClub);
      expect(mockSupabase.from).toHaveBeenCalledWith('clubs');
    });

    it('should handle creation errors', async () => {
      const mockError = new Error('Creation failed');
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await createClub({
        name: 'Test Club',
        location: 'Test Location',
        contact_email: 'test@example.com',
        sport_types: ['football'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getClubById', () => {
    it('should fetch club by ID successfully', async () => {
      const mockClub = {
        id: '1',
        name: 'Test Club',
        location: 'Test Location',
        contact_email: 'test@example.com',
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockClub, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getClubById('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockClub);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });
  });

  describe('getClubs', () => {
    it('should fetch clubs with filters', async () => {
      const mockClubs = [
        { id: '1', name: 'Club 1', verified: true },
        { id: '2', name: 'Club 2', verified: true },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockClubs, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getClubs({ verified: true, sport_types: ['football'] });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockClubs);
      expect(mockQuery.eq).toHaveBeenCalledWith('verified', true);
      expect(mockQuery.overlaps).toHaveBeenCalledWith('sport_types', ['football']);
    });
  });
});

describe('Volunteers Data Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createVolunteerProfile', () => {
    it('should create volunteer profile successfully', async () => {
      const mockUser = { id: 'user-1' };
      const mockProfile = {
        id: '1',
        user_id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await createVolunteerProfile({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        location: 'Test Location',
        skills: ['JavaScript'],
        availability: ['Weekends'],
        is_visible: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfile);
    });

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await createVolunteerProfile({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        location: 'Test Location',
        skills: ['JavaScript'],
        availability: ['Weekends'],
        is_visible: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not authenticated');
    });
  });
});

describe('Opportunities Data Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOpportunity', () => {
    it('should create opportunity successfully', async () => {
      const mockOpportunity = {
        id: '1',
        club_id: 'club-1',
        title: 'Test Opportunity',
        description: 'Test Description',
        required_skills: ['JavaScript'],
        time_commitment: '2 hours/week',
        status: 'active',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOpportunity, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await createOpportunity('club-1', {
        title: 'Test Opportunity',
        description: 'Test Description',
        required_skills: ['JavaScript'],
        time_commitment: '2 hours/week',
        is_recurring: false,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOpportunity);
    });
  });
});

describe('Applications Data Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createApplication', () => {
    it('should create application successfully', async () => {
      const mockApplication = {
        id: '1',
        opportunity_id: 'opp-1',
        volunteer_id: 'vol-1',
        message: 'Test message',
        status: 'pending',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockApplication, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await createApplication('opp-1', 'vol-1', {
        message: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockApplication);
    });
  });
});

describe('Messages Data Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockUser = { id: 'user-1' };
      const mockMessage = {
        id: '1',
        sender_id: 'user-1',
        recipient_id: 'user-2',
        subject: 'Test Subject',
        content: 'Test Content',
        read: false,
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMessage, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await sendMessage({
        recipient_id: 'user-2',
        subject: 'Test Subject',
        content: 'Test Content',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessage);
    });
  });
});

describe('Authentication Data Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should sign up user successfully', async () => {
      const mockAuthData = {
        user: { id: '1', email: 'test@example.com' },
        session: { access_token: 'token' },
      };

      mockSupabase.auth.signUp.mockResolvedValue({ data: mockAuthData, error: null });

      const result = await signUp('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAuthData);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle sign up errors', async () => {
      const mockError = new Error('Sign up failed');
      mockSupabase.auth.signUp.mockResolvedValue({ data: null, error: mockError });

      const result = await signUp('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockAuthData = {
        user: { id: '1', email: 'test@example.com' },
        session: { access_token: 'token' },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: mockAuthData, error: null });

      const result = await signIn('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAuthData);
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await getCurrentUser();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });
  });
});