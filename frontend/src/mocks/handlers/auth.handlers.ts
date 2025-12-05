import { http, HttpResponse } from 'msw';
import { API_CONFIG } from '@/api/config';

const BASE_URL = API_CONFIG.BASE_URL;

export const authHandlers = [
  // Login
  http.post(`${BASE_URL}/auth/login/`, async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };

    if (body.username && body.password) {
      return HttpResponse.json({
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        user: {
          id: '1',
          username: body.username,
          email: `${body.username}@example.com`,
          first_name: 'John',
          last_name: 'Doe',
          role: 'farmer',
        },
      });
    }

    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  // Register
  http.post(`${BASE_URL}/auth/register/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json(
      {
        id: '1',
        username: body.username,
        email: body.email,
        message: 'Registration successful',
      },
      { status: 201 }
    );
  }),

  // Get current user
  http.get(`${BASE_URL}/auth/user/`, () => {
    return HttpResponse.json({
      id: '1',
      username: 'testuser',
      email: 'testuser@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'farmer',
      is_verified: true,
    });
  }),

  // Refresh token
  http.post(`${BASE_URL}/auth/token/refresh/`, () => {
    return HttpResponse.json({
      access: 'new-mock-access-token',
    });
  }),

  // Logout
  http.post(`${BASE_URL}/auth/logout/`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),
];
