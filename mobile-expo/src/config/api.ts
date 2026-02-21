/**
 * API base URL:
 * - Dev: use your machine's LAN IP (e.g. 192.168.1.8) or 10.0.2.2 for Android emulator
 * - Prod: your Render URL (e.g. https://expense-tracker-api-xxxx.onrender.com)
 */
const DEV_HOST = '192.168.1.8'; // Change to 10.0.2.2 for Android emulator
const PROD_API = 'https://expense-tracker-api-production-e7b2.up.railway.app';
export const API_BASE = __DEV__ ? `http://${DEV_HOST}:3000` : PROD_API;

export const API_PREFIX = '/api';
