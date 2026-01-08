
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Sun, Moon } from 'lucide-react';

const MorningEveningChart = ({ data, morningLoad, eveningLoad }) => {
    const chartData = useMemo(() => {
        // If pre-calculated loads are provided, use them directly
        if (morningLoad !== undefined && eveningLoad !== undefined) {
            return [
                {
                    name: 'Morning (6am-6pm)',
                    Consumption: parseFloat(Number(morningLoad).toFixed(2)),
                    amt: Number(morningLoad)
                },
                {
                    name: 'Evening (6pm-6am)',
                    Consumption: parseFloat(Number(eveningLoad).toFixed(2)),
                    amt: Number(eveningLoad)
                }
            ];
        }

        if (!data || data.length === 0) return [];

        let morningConsumption = 0;
        let eveningConsumption = 0;

        // Morning: 6 AM - 6 PM (06:00 - 17:59)
        // Evening: 6 PM - 6 AM (18:00 - 05:59)
        // Fallback to calculation if props missing
        data.forEach(d => {
            const dateStr = d.date || d.timestamp; // Support both formats
            if (!dateStr) return;

            const date = new Date(dateStr);
            const hour = date.getHours();
            const val = parseFloat(d.maxKwH || d.consumption || d.totalKwH) || 0;

            if (hour >= 6 && hour < 18) {
                morningConsumption += val;
            } else {
                eveningConsumption += val;
            }
        });

        // If no data found in loop but we have some data, maybe it's pre-aggregated? 
        // Assuming raw hourly data for now.

        return [
            {
                name: 'Morning (6am-6pm)',
                Consumption: parseFloat(morningConsumption.toFixed(2)),
                amt: morningConsumption
            },
            {
                name: 'Evening (6pm-6am)',
                Consumption: parseFloat(eveningConsumption.toFixed(2)),
                amt: eveningConsumption
            }
        ];
    }, [data, morningLoad, eveningLoad]);

    const formattedData = useMemo(() => {
        // Ensure chartData is always valid for Recharts
        if (!chartData || chartData.length === 0) {
            return [
                { name: 'Morning (6am-6pm)', Consumption: 0 },
                { name: 'Evening (6pm-6am)', Consumption: 0 }
            ];
        }
        return chartData;
    }, [chartData]);

    return (
        <div className="glass-panel p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        Morning & Evening Consumption
                    </h3>
                    <p className="text-secondary text-sm">
                        Comparison of day vs night energy usage.
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="p-2 bg-yellow-500/10 rounded-full text-yellow-500">
                        <Sun size={20} />
                    </div>
                    <div className="p-2 bg-indigo-500/10 rounded-full text-indigo-500">
                        <Moon size={20} />
                    </div>
                </div>
            </div>

            {/* CSS-based Bar Chart - Simplified Relative Flow */}
            <div className="w-full mt-6 relative" style={{ height: '280px' }}>
                {/* Background Grid (Absolute) */}
                <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-400 select-none pointer-events-none z-0">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-full border-b border-slate-200"></div>
                    ))}
                </div>

                {/* Chart Content (Relative - Natural Flow) */}
                <div className="relative z-10 w-full h-full flex items-end justify-center" style={{ gap: '60px' }}>
                    {formattedData.map((data, index) => {
                        const val = Number(data.Consumption) || 0;
                        const maxVal = Math.max(...formattedData.map(d => Number(d.Consumption) || 0), 1) * 1.2;
                        const heightPct = Math.min((val / maxVal) * 100, 100);
                        const isMorning = index === 0;

                        return (
                            <div key={data.name} className="flex flex-col items-center group w-32 pb-2">
                                {/* Value Label */}
                                <div className="mb-2 text-center">
                                    <span style={{
                                        color: isMorning ? '#d97706' : '#4f46e5', // amber-600 / indigo-600
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem',
                                        display: 'block'
                                    }}>
                                        {val.toFixed(2)}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase">kWh</span>
                                </div>

                                {/* Bar Container */}
                                <div className="w-full flex items-end justify-center" style={{ height: '180px' }}>
                                    <div
                                        style={{
                                            width: '60px',
                                            height: `${heightPct}%`,
                                            minHeight: '20px',
                                            backgroundColor: isMorning ? '#f59e0b' : '#6366f1', // amber-500 / indigo-500
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            borderRadius: '8px 8px 0 0'
                                        }}
                                    ></div>
                                </div>

                                {/* Axis Label */}
                                <div className="mt-2 text-center">
                                    <div className="text-sm font-bold text-slate-700">
                                        {isMorning ? 'Morning' : 'Evening'}
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-500 uppercase mt-0.5">
                                        {isMorning ? '6am - 6pm' : '6pm - 6am'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* NO DATA OVERLAY */}
            {(formattedData[0].Consumption === 0 && formattedData[1].Consumption === 0) && (
                <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
                    <span className="text-xs text-secondary bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                        Waiting for data...
                    </span>
                </div>
            )}
        </div>
    );
};

export default MorningEveningChart;
