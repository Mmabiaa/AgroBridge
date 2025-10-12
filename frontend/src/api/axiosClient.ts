import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api/',
});

// Add a request interceptor to include JWT token
axiosClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;
