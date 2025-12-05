import { http, HttpResponse } from 'msw';
import { API_CONFIG } from '@/api/config';

const BASE_URL = API_CONFIG.BASE_URL;

export const analyticsHandlers = [
  http.get(`${BASE_URL}/analytics/dashboard/`, () => {
    return HttpResponse.json({});
  }),
];
