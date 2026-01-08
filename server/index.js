const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const dataService = require('./dataService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for dev, restrict in prod
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('<h1>✅ Server is Running</h1><p>n8n Dashboard Backend</p>');
});

// --- Helper function to send data to n8n ---
async function sendToN8n(webhookPath, data) {
    const url = `${config.n8n.baseUrl}${webhookPath}`;
    console.log(`Sending to n8n: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                callbackUrl: config.server.webhookCallbackUrl,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`n8n responded with status: ${response.status}`);
        }

        const result = await response.json().catch(() => ({ status: 'ok' }));
        console.log('n8n response:', result);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error sending to n8n:', error.message);
        return { success: false, error: error.message };
    }
}

// --- Data Loading Functions ---

const DATA_DIR = path.join(__dirname, 'data');
const HOURLY_FILE = 'Lenz Parameter History TenxHealth Technologies.xlsx';
const DAILY_FILE = 'Tenx Health Technologies_Equipment_Daily_Cosp(kWh)_30_12_2025.xlsx';

function getHourlyData() {
    try {
        const filePath = path.join(DATA_DIR, HOURLY_FILE);
        if (!fs.existsSync(filePath)) return { error: "File not found" };

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Parse raw data (skip header row)
        // Structure based on analysis: [Date, Equipment, MaxKwH, MinKwH, TotalKwH, MaxDemand]
        const headers = rawData[0];
        const rows = rawData.slice(1);

        const parsed = rows.map(row => ({
            date: row[0],
            equipment: row[1],
            maxKwH: row[2],
            minKwH: row[3],
            totalKwH: row[4],
            maxDemand: row[5]
        })).filter(r => r.date); // Filter empty rows

        return parsed;
    } catch (e) {
        console.error("Error reading hourly data:", e);
        return [];
    }
}

function getDailyData() {
    try {
        const filePath = path.join(DATA_DIR, DAILY_FILE);
        if (!fs.existsSync(filePath)) return { error: "File not found" };

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Based on analysis, the data structure is a bit complex with metadata at top.
        // The actual table seems to start around row 10 (index 9) based on previous analysis.
        // Row 10: ["Description", "SequenceNo", "1-Dec-2025", ...]

        let headerRowIndex = -1;
        for (let i = 0; i < 20; i++) {
            if (rawData[i] && rawData[i][0] === 'Description') {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) return { error: "Could not find data table" };

        const headers = rawData[headerRowIndex];
        const dataRows = rawData.slice(headerRowIndex + 1);

        const result = dataRows.map(row => {
            const obj = {};
            headers.forEach((h, i) => {
                if (h) obj[h] = row[i];
            });
            return obj;
        }).filter(r => r.Description); // Filter valid rows

        return result;
    } catch (e) {
        console.error("Error reading daily data:", e);
        return [];
    }
}

// --- API Endpoints ---

app.get('/api/energy/hourly', (req, res) => {
    // Legacy support or aggregate all devices
    const d1 = dataService.loadDeviceData('1');
    const d2 = dataService.loadDeviceData('2');
    res.json([...d1, ...d2]);
});

// POST endpoint to receive incoming energy data from dummy sender
app.post('/api/energy/hourly', (req, res) => {
    console.log("Received energy data from dummy sender:", req.body);

    // Broadcast to connected clients via Socket.IO
    io.emit('energy-update', req.body);

    res.json({
        status: 'success',
        message: 'Energy data received and broadcasted',
        data: req.body
    });
});

app.get('/api/energy/daily', (req, res) => {
    // Assuming daily is still handled by the other file or we aggregate
    const data = getDailyData();
    res.json(data);
});

app.get('/api/energy/device/:deviceId/historical', (req, res) => {
    try {
        const data = dataService.loadDeviceData(req.params.deviceId);
        res.json(data);
    } catch (e) {
        res.status(404).json({ error: e.message });
    }
});

app.get('/api/energy/statistics', (req, res) => {
    try {
        const d1 = dataService.loadDeviceData('1');
        const d2 = dataService.loadDeviceData('2');
        res.json({
            '1': dataService.calculateStatistics(d1),
            '2': dataService.calculateStatistics(d2)
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/energy/generate-dummy', (req, res) => {
    try {
        const d1 = dataService.generateDummyData('1');
        const d2 = dataService.generateDummyData('2');
        res.json([d1, d2]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- n8n Integration ---

// Webhook for n8n to push updates/tickets back to dashboard
app.post('/webhook', (req, res) => {
    console.log("Received webhook from n8n:", req.body);

    // Broadcast the update to all connected clients
    io.emit('n8n-update', req.body);

    res.json({ status: 'success', message: 'Update broadcasted' });
});

// --- Ticket Storage (In-Memory) ---
let activeTickets = [];

// --- Send data TO n8n ---

// Get all execution tickets
app.get('/api/tickets', (req, res) => {
    res.json(activeTickets);
});

// Send energy alert to n8n for processing
app.post('/api/n8n/energy-alert', async (req, res) => {
    const alertData = {
        type: 'energy_alert',
        ...req.body
    };

    const result = await sendToN8n(config.n8n.webhooks.energyAlert, alertData);
    res.json(result);
});

// Submit ticket to n8n for automation/processing
app.post('/api/n8n/submit-ticket', async (req, res) => {
    const ticketData = {
        type: 'ticket_submission',
        ...req.body
    };

    const result = await sendToN8n(config.n8n.webhooks.ticketSubmit, ticketData);
    res.json(result);
});

// Specific endpoint for n8n to create tickets
app.post('/webhook/ticket', (req, res) => {
    console.log("Received ticket from n8n:", req.body);

    const ticketData = {
        ticketId: req.body.ticketId || `T-${Date.now()}`,
        subject: req.body.subject || 'Auto-generated Ticket',
        description: req.body.description || req.body.message,
        status: req.body.status || 'open',
        priority: req.body.priority || 'medium',
        isAiGenerated: true,
        source: 'n8n',
        alertType: req.body.alertType,
        timestamp: new Date().toISOString()
    };

    // Persist in memory (keep last 50)
    activeTickets.unshift(ticketData);
    if (activeTickets.length > 50) {
        activeTickets = activeTickets.slice(0, 50);
    }

    io.emit('n8n-update', ticketData);
    res.json({ status: 'success', ticket: ticketData });
});

// Submit ticket to n8n for automation/processing
app.post('/api/n8n/submit-ticket', async (req, res) => {
    const ticketData = {
        type: 'ticket_submission',
        ...req.body
    };

    const result = await sendToN8n(config.n8n.webhooks.ticketSubmit, ticketData);
    res.json(result);
});

// Request data sync/processing from n8n
app.post('/api/n8n/sync', async (req, res) => {
    const syncData = {
        type: 'data_sync',
        hourlyData: getHourlyData(),
        dailyData: getDailyData()
    };

    const result = await sendToN8n(config.n8n.webhooks.dataSync, syncData);
    res.json(result);
});

// Get n8n configuration (for frontend)
app.get('/api/n8n/config', (req, res) => {
    res.json({
        isConfigured: !!config.n8n.baseUrl,
        baseUrl: config.n8n.baseUrl,
        webhooks: config.n8n.webhooks
    });
});

// --- Dummy Data Sender Control ---
const dummyDataSender = require('./dummy-data-sender');
let autoSenderInterval = null;

// Send a single dummy data packet to n8n
app.post('/api/send-dummy-data', async (req, res) => {
    const forceAnomaly = req.body.forceAnomaly || false;
    const data = dummyDataSender.generateEnergyData(forceAnomaly);

    console.log(`📊 Sending ${forceAnomaly ? 'FORCED ANOMALY' : 'random'} data to n8n:`, data);

    try {
        const response = await fetch('http://localhost:5678/webhook/energy-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json().catch(() => ({ status: 'ok' }));
        res.json({ success: true, dataSent: data, n8nResponse: result });
    } catch (error) {
        console.error('Error sending to n8n:', error.message);
        res.json({ success: false, error: error.message, dataSent: data });
    }
});

// Start automatic data sending every 30 seconds
app.post('/api/start-auto-sender', (req, res) => {
    if (autoSenderInterval) {
        return res.json({ success: false, message: 'Auto sender is already running' });
    }

    const intervalMs = req.body.intervalMs || 30000;

    autoSenderInterval = setInterval(async () => {
        const data = dummyDataSender.generateEnergyData();
        console.log(`🔄 Auto-sending data to n8n:`, data);

        try {
            await fetch('http://localhost:5678/webhook/energy-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Auto-send error:', error.message);
        }
    }, intervalMs);

    console.log(`✅ Auto sender started (every ${intervalMs / 1000} seconds)`);
    res.json({ success: true, message: `Auto sender started at ${intervalMs / 1000}s interval` });
});

// Stop automatic data sending
app.post('/api/stop-auto-sender', (req, res) => {
    if (!autoSenderInterval) {
        return res.json({ success: false, message: 'Auto sender is not running' });
    }

    clearInterval(autoSenderInterval);
    autoSenderInterval = null;

    console.log('⏹️ Auto sender stopped');
    res.json({ success: true, message: 'Auto sender stopped' });
});

// Get auto sender status
app.get('/api/auto-sender-status', (req, res) => {
    res.json({
        running: !!autoSenderInterval,
        message: autoSenderInterval ? 'Auto sender is running' : 'Auto sender is stopped'
    });
});

// --- Socket.io ---

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = config.server.port;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`n8n integration configured for: ${config.n8n.baseUrl}`);
});
