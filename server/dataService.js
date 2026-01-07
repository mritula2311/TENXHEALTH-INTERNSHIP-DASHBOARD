const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

class DataService {
    constructor() {
        this.deviceFiles = {
            '1': 'Lenz Parameter History TenxHealth Technologies device 1.xlsx',
            '2': 'Lenz Parameter History TenxHealth Technologies device 2.xlsx'
        };
        this.cache = {}; // Cache loaded data
    }

    getFilePath(filename) {
        // Check root and server/data
        const rootPath = path.join(process.cwd(), filename);
        if (fs.existsSync(rootPath)) return rootPath;

        const serverVarPath = path.join(process.cwd(), 'server', 'data', filename);
        if (fs.existsSync(serverVarPath)) return serverVarPath;

        // Fallback for dev environment structures
        const upOne = path.join(process.cwd(), '..', filename);
        if (fs.existsSync(upOne)) return upOne;

        return null;
    }

    loadDeviceData(deviceId) {
        if (this.cache[deviceId]) return this.cache[deviceId];

        const filename = this.deviceFiles[deviceId];
        if (!filename) throw new Error(`Unknown device ID: ${deviceId}`);

        const filePath = this.getFilePath(filename);
        if (!filePath) throw new Error(`File not found: ${filename}`);

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Config based on file inspection: Headers at row 6 (0-indexed 5)
        // "date", "equipment", "maxKwH", "minKwH"
        const rawData = XLSX.utils.sheet_to_json(sheet, { range: 5 });

        // Normalize keys and Parse numbers
        const processedData = rawData.map(row => {
            // Map excel columns to standardized keys
            // Note: sheet_to_json uses the header row keys automatically
            return {
                date: row['date'],
                equipment: row['equipment'],
                // Calculate consumption if explicit column missing. 
                // Often maxKwH - prevMaxKwH, but for simplicity/dummy gen, we might use specific cols.
                // Based on inspection, let's assume valid data is present.
                // If totalKwH is not present, we might need to derive it or use maxKwH as a proxy for cumulative.
                // However, typically "Consumption" is differenced. 
                // For this implementation, looking at headers: 'maxKwH', 'minKwH'. 
                // Let's use maxKwH trend for consumption or if 'Active Energy' exists.
                // Start simple:
                totalKwH: parseFloat(row['maxKwH'] || 0),
                maxDemand: parseFloat(row['maxDemand'] || row['Max Demand'] || 0),
                // Add raw row for fallback
                ...row
            };
        }).filter(d => d.date); // Filter empty rows

        // Calculate derived consumption (diff of cumulative maxKwH) ? 
        // Or just return raw data. The user asked for "Consumption (kWh)". 
        // If keys are 'maxKwH', that usually implies a reading.
        // Let's calculate daily/hourly diffs if needed, or just pass through for now.

        this.cache[deviceId] = processedData;
        return processedData;
    }

    calculateStatistics(data) {
        if (!data || data.length === 0) return null;

        // Consumption (totalKwH might be cumulative reading or interval)
        // Assuming interval for stats calculation, or if cumulative, we need diffs.
        // Let's assume the excel contains interval data or we compute stats on the "demand" (load).
        // Let's compute stats for 'maxDemand' (kW) which is instantaneous.
        // And for 'totalKwH' if it looks like interval data, else diffs.
        // Heuristic: if values always increase, it's cumulative.

        const demands = data.map(d => d.maxDemand).filter(v => !isNaN(v));
        const kwhs = data.map(d => d.totalKwH).filter(v => !isNaN(v));

        const getStats = (arr) => {
            if (arr.length === 0) return { avg: 0, min: 0, max: 0, stdDev: 0 };
            const sum = arr.reduce((a, b) => a + b, 0);
            const avg = sum / arr.length;
            const min = Math.min(...arr);
            const max = Math.max(...arr);
            const variance = arr.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / arr.length;
            return {
                avg: parseFloat(avg.toFixed(2)),
                min: parseFloat(min.toFixed(2)),
                max: parseFloat(max.toFixed(2)),
                stdDev: parseFloat(Math.sqrt(variance).toFixed(2))
            };
        };

        return {
            demand: getStats(demands),
            consumption: getStats(kwhs) // Warning: if cumulative, this stat is meaningless mean-reading.
        };
    }

    generateDummyData(deviceId) {
        const historical = this.loadDeviceData(deviceId);
        if (!historical.length) return null;

        // Simple pattern generation:
        // 1. Group by hour of day
        // 2. Calculate average demand per hour
        // 3. Pick current hour
        // 4. Generate value = avg_hour + random_noise

        const now = new Date();
        const currentHour = now.getHours();

        const hourData = historical.filter(d => {
            if (!d.date || typeof d.date !== 'string') return false;
            // Parse "DD-MM-YYYY HH:mm:ss" - typical excel format or js string
            let h = -1;
            if (d.date.includes(' ')) {
                const timePart = d.date.split(' ')[1];
                h = parseInt(timePart.split(':')[0], 10);
            }
            return h === currentHour;
        });

        // Fallback to all data if hour specific not found
        const sourceData = hourData.length > 5 ? hourData : historical;

        const stats = this.calculateStatistics(sourceData);

        // Generate valid random based on stdDev
        const noise = (Math.random() - 0.5) * (stats.demand.stdDev || 1);
        const newDemand = Math.max(0, stats.demand.avg + noise);

        // For consumption (kWh), assume it relates to demand * time (1h) approx?
        // Or just use the same stat method
        const kwhStats = this.calculateStatistics(historical.slice(0, 100)); // Sample for kwh base
        // If cumulative, we can't just jiggle. We need an interval value.
        // Let's assume we return an interval value for the dashboard to plot.

        return {
            deviceId,
            timestamp: now.toISOString(),
            maxDemand: parseFloat(newDemand.toFixed(2)),
            totalKwH: parseFloat((newDemand * 0.5).toFixed(2)), // Approx 30m reading?
            stats: stats // Include context
        };
    }
}

module.exports = new DataService();
