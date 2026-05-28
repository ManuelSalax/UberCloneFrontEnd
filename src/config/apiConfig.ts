/**
 * API Configuration for the Uber Clone App.
 * When testing on physical devices or emulators, change BACKEND_IP to your local computer's IP address.
 */

export const BACKEND_IP = 'localhost'; // Change this to your local computer IP (e.g. 192.168.1.20) when testing on a real device or emulator
export const PORT = '5000';

export const BASE_URL = `http://${BACKEND_IP}:${PORT}`;
export const API_BASE_URL = `${BASE_URL}/api`;
