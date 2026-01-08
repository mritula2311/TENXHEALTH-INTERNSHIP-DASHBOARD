import React, { useMemo, useState, useEffect } from 'react';
import { Zap, Activity, Sun, Moon } from 'lucide-react';
import StatisticsOverlay from './StatisticsOverlay';
import ConsumptionBreakdown from './ConsumptionBreakdown';
import ConsumptionGraph from './ConsumptionGraph';
import TicketFeed from './TicketFeed';
import { fetchStatistics, fetchDeviceHistory } from '../api';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="glass-panel flex flex-col justify-between h-32">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-secondary text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold mt-1 text-primary">{value}</h3>
            </div>
            <div className={`p-2 rounded-lg bg-${color}-500/10`}>
                <Icon className={`text-${color}`} size={20} />
            </div>
        </div>
        <p className="text-secondary text-xs">{subtext}</p>
    </div>
);

import MorningEveningChart from './PredictionChart'; // Re-using file for now, but component is renamed

const EnergyDashboard = ({ hourlyData = [], dailyData = [] }) => {
    // ... existing ... 

    // ... (down to usage) ...


    // ... (existing state and simple effects) ...
    const [stats, setStats] = useState(null);
    const [selectedDevice, setSelectedDevice] = useState('1');
    const [deviceHistory, setDeviceHistory] = useState([]);
    const [error, setError] = useState(null);

    // Fetch stats and specific history
    useEffect(() => {
        const loadStats = async () => {
            try {
                const s = await fetchStatistics();
                setStats(s);
            } catch (e) {
                console.error("Stats error", e);
                setError(e);
            }
        };
        loadStats();
    }, []);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const h = await fetchDeviceHistory(selectedDevice);
                setDeviceHistory(h || []); // Ensure it's an array
            } catch (e) {
                console.error("History error", e);
                setError(e);
            }
        };
        loadHistory();
    }, [selectedDevice]);

    // Current Device Stats
    const deviceStats = useMemo(() => {
        if (!stats || !stats[selectedDevice]) return null;
        return stats[selectedDevice];
    }, [stats, selectedDevice]);

    // Process Hourly Data for Chart (Merged or Specific)
    const chartData = useMemo(() => {
        try {
            const source = (deviceHistory && deviceHistory.length > 0) ? deviceHistory : (hourlyData || []);
            return source.map(d => {
                if (!d || !d.date) return null;
                const dateStr = String(d.date);
                const timePart = dateStr.includes(' ') ? dateStr.split(' ')[1] : dateStr;
                return {
                    time: timePart ? timePart.substring(0, 5) : '',
                    value: Number(d.totalKwH) || 0,
                    demand: Number(d.maxDemand) || 0,
                    // Pass full date for prediction chart to parse if needed, usually just needed in parent
                    date: d.date,
                    maxKwH: d.totalKwH // Ensure compatibility with Prediction logic
                };
            }).filter(d => d !== null).slice(-50); // Show last 50 points for clarity
        } catch (e) {
            console.error("Chart data error", e);
            setError(e);
            return [];
        }
    }, [hourlyData, deviceHistory]);

    // Calculate Totals based on current view
    const totalConsumption = useMemo(() => {
        try {
            const source = (deviceHistory && deviceHistory.length > 0) ? deviceHistory : (hourlyData || []);
            return source.reduce((acc, curr) => acc + (Number(curr.totalKwH) || 0), 0).toFixed(2);
        } catch (e) {
            console.error("Total consumption error", e);
            setError(e);
            return "0.00";
        }
    }, [hourlyData, deviceHistory]);

    const maxDemand = useMemo(() => {
        try {
            const source = (deviceHistory && deviceHistory.length > 0) ? deviceHistory : (hourlyData || []);
            if (source.length === 0) return "0.00";
            return Math.max(...source.map(d => Number(d.maxDemand) || 0), 0).toFixed(2);
        } catch (e) {
            console.error("Max demand error", e);
            setError(e);
            return "0.00";
        }
    }, [hourlyData, deviceHistory]);

    // Process Morning vs Evening
    const timeOfDayData = useMemo(() => {
        try {
            const source = (deviceHistory && deviceHistory.length > 0) ? deviceHistory : (hourlyData || []);
            let morningSum = 0;
            let eveningSum = 0;

            source.forEach(d => {
                if (!d || !d.date) return;
                const dateStr = String(d.date);
                const timeStr = dateStr.split(' ')[1];
                if (!timeStr) return;

                const hour = parseInt(timeStr.split(':')[0], 10);
                const val = Number(d.totalKwH) || 0;

                if (hour >= 6 && hour < 18) morningSum += val;
                else eveningSum += val;
            });

            return [
                { name: 'Morning', value: parseFloat(morningSum.toFixed(2)) },
                { name: 'Evening', value: parseFloat(eveningSum.toFixed(2)) }
            ];
        } catch (e) {
            console.error("Time of day error", e);
            setError(e);
            return [{ name: 'Morning', value: 0 }, { name: 'Evening', value: 0 }];
        }
    }, [hourlyData, deviceHistory]);

    if (error) return <div className="p-4 text-red-500">Dashboard Error: {error.message || "An unknown error occurred."}</div>;

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold">Energy Overview</h2>
                    <p className="text-secondary">Real-time monitoring and analysis</p>
                </div>
                <div className="flex gap-4">
                    <select
                        className="input w-40"
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                    >
                        <option value="1">Device 1 (MFM 1)</option>
                        <option value="2">Device 2 (MFM 2)</option>
                    </select>
                    <div className="glass-panel px-4 py-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-green">System Online</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <StatCard
                    title="Total Consumption"
                    value={`${totalConsumption} kWh`}
                    subtext="Selected device period"
                    icon={Zap}
                    color="cyan"
                />
                <StatCard
                    title="Peak Demand"
                    value={`${maxDemand} kW`}
                    subtext="Max recorded demand"
                    icon={Activity}
                    color="purple"
                />
                <StatCard
                    title="Morning Load"
                    value={`${timeOfDayData[0].value} kWh`}
                    subtext="6:00 AM - 6:00 PM"
                    icon={Sun}
                    color="yellow"
                />
                <StatCard
                    title="Evening Load"
                    value={`${timeOfDayData[1].value} kWh`}
                    subtext="6:00 PM - 6:00 AM"
                    icon={Moon}
                    color="indigo"
                />
            </div>

            {/* Main Content Grid - Flexible Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Detailed Breakdown Card */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <ConsumptionBreakdown
                        totalConsumption={Number(totalConsumption)}
                        averageConsumption={deviceStats?.consumption?.avg || 0}
                    />
                    {/* NEW: Morning & Evening Chart in the sidebar column */}
                    <MorningEveningChart
                        // Use calculated timeOfDayData values if available, else fallback to data prop logic
                        morningLoad={timeOfDayData[0]?.value}
                        eveningLoad={timeOfDayData[1]?.value}
                        data={deviceHistory && deviceHistory.length > 0 ? deviceHistory : (hourlyData || [])}
                    />
                </div>

                {/* Consumption Graph (Area Chart) */}
                <div className="lg:col-span-2">
                    <ConsumptionGraph
                        data={chartData}
                        stats={deviceStats?.consumption}
                    />
                </div>
            </div>

            {/* AI Ticket Feed Section */}
            <div className="grid grid-cols-1 mb-8">
                <div className="h-96">
                    <TicketFeed />
                </div>
            </div>
        </div>
    );
};

export default EnergyDashboard;
