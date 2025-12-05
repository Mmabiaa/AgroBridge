import { http, HttpResponse } from 'msw';
import { API_CONFIG } from '@/api/config';

const BASE_URL = API_CONFIG.BASE_URL;

export const adminHandlers = [
  http.get(`${BASE_URL}/admin/users/`, () => {
    return HttpResponse.json({ count: 0, results: [] });
  }),
  http.get(`${BASE_URL}/admin/system/health/`, () => {
    return HttpResponse.json({ status: 'healthy' });
  }),
];
