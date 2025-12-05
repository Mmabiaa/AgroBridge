import { http, HttpResponse } from 'msw';
import { API_CONFIG } from '@/api/config';

const BASE_URL = API_CONFIG.BASE_URL;

export const usersHandlers = [
  http.get(`${BASE_URL}/users/profile/`, () => {
    return HttpResponse.json({
      id: '1',
      username: 'testuser',
      email: 'testuser@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'farmer',
    });
  }),

  http.put(`${BASE_URL}/users/profile/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),
];
