import axios from 'axios';

const API_BASE = 'http://localhost:3000';

export const fetchHourlyData = async () => {
    try {
        const response = await axios.get(`${API_BASE}/api/energy/hourly`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch hourly data", error);
        return [];
    }
};

export const fetchDailyData = async () => {
    try {
        const response = await axios.get(`${API_BASE}/api/energy/daily`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch daily data", error);
        return [];
    }
};
// Fetch calculated statistics for all devices
export const fetchStatistics = async () => {
    try {
        const response = await axios.get(`${API_BASE}/api/energy/statistics`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch statistics", error);
        return null;
    }
};

// Fetch historical data for a specific device
export const fetchDeviceHistory = async (deviceId) => {
    try {
        const response = await axios.get(`${API_BASE}/api/energy/device/${deviceId}/historical`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch history for device ${deviceId}`, error);
        return [];
    }
};

// Trigger dummy data generation based on patterns
export const generateDummyData = async () => {
    try {
        const response = await axios.post(`${API_BASE}/api/energy/generate-dummy`);
        return response.data;
    } catch (error) {
        console.error("Failed to generate dummy data", error);
        return null;
    }
};

// Submit ticket to n8n for automation and processing
export const raiseTicket = async (ticketData) => {
    try {
        const response = await axios.post(`${API_BASE}/api/n8n/submit-ticket`, {
            ...ticketData,
            timestamp: new Date().toISOString()
        });
        return response.data;
    } catch (error) {
        console.error("Failed to raise ticket", error);
        throw error;
    }
};

// Send energy alert to n8n for processing
export const sendEnergyAlert = async (alertData) => {
    try {
        const response = await axios.post(`${API_BASE}/api/n8n/energy-alert`, alertData);
        return response.data;
    } catch (error) {
        console.error("Failed to send energy alert", error);
        throw error;
    }
};

// Trigger data sync with n8n
export const triggerDataSync = async () => {
    try {
        const response = await axios.post(`${API_BASE}/api/n8n/sync`);
        return response.data;
    } catch (error) {
        console.error("Failed to trigger data sync", error);
        throw error;
    }
};

// Get n8n configuration status
export const getN8nConfig = async () => {
    try {
        const response = await axios.get(`${API_BASE}/api/n8n/config`);
        return response.data;
    } catch (error) {
        console.error("Failed to get n8n config", error);
        return { isConfigured: false };
    }
};
