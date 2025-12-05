import { http, HttpResponse } from 'msw';
import { API_CONFIG } from '@/api/config';

const BASE_URL = API_CONFIG.BASE_URL;

export const emergencyHandlers = [
  http.get(`${BASE_URL}/emergency/alerts/`, () => {
    return HttpResponse.json({ count: 0, results: [] });
  }),
];
