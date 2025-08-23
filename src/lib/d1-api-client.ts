/**
 * D1 API Client
 * Handles all API calls to the D1 worker endpoints
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get authentication token from session
 */
function getAuthToken(): string | null {
  try {
    const sessionData = localStorage.getItem('d1_session');
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData);
    return session.access_token;
  } catch {
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Club API functions
 */
export const clubsApi = {
  getVerifiedClubs: () => apiRequest('/clubs'),
  getClubById: (id: string) => apiRequest(`/clubs/${id}`),
  registerClub: (data: any) => apiRequest('/clubs', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

/**
 * Volunteer API functions
 */
export const volunteersApi = {
  getOpportunities: (filters?: any) => apiRequest('/volunteer-opportunities', {
    method: 'GET',
    ...(filters && { body: JSON.stringify(filters) })
  }),
  getVolunteerProfile: (id: string) => apiRequest(`/volunteers/${id}`),
  updateVolunteerProfile: (id: string, data: any) => apiRequest(`/volunteers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

/**
 * Applications API functions
 */
export const applicationsApi = {
  getVolunteerApplications: (filters?: any) => apiRequest('/volunteer-applications', {
    method: 'GET',
    ...(filters && { body: JSON.stringify(filters) })
  }),
  submitVolunteerApplication: (data: any) => apiRequest('/volunteer-applications', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getClubApplications: (filters?: any) => apiRequest('/club-applications', {
    method: 'GET',
    ...(filters && { body: JSON.stringify(filters) })
  }),
  submitClubApplication: (data: any) => apiRequest('/club-applications', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

/**
 * Sports Council API functions
 */
export const sportsCouncilApi = {
  getMeetings: () => apiRequest('/sports-council/meetings'),
  createMeeting: (data: any) => apiRequest('/sports-council/meetings', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateMeeting: (id: string, data: any) => apiRequest(`/sports-council/meetings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

/**
 * Messages API functions
 */
export const messagesApi = {
  getConversations: () => apiRequest('/messages/conversations'),
  getMessages: (conversationId: string) => apiRequest(`/messages/conversations/${conversationId}`),
  sendMessage: (data: any) => apiRequest('/messages', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

/**
 * File upload API functions
 */
export const filesApi = {
  uploadImage: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = getAuthToken();
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }
};