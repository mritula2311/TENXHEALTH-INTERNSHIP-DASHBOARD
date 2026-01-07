import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Menu } from 'lucide-react';

const EnergyUsageChart = ({ hourlyData, dailyData }) => {
    const [viewMode, setViewMode] = useState('day'); // 'day' | 'hour' | 'month' | 'division' | 'site'

    const chartData = viewMode === 'day' ? dailyData : hourlyData;

    // Normalize data keys for the generic chart
    const normalizedData = chartData.map(d => {
        if (viewMode === 'day') {
            // dailyData has 'date', 'TenxHealth MFM 1', 'TenxHealth MFM 2'
            // We need to sum them or pick one for the general "Energy usage" view shown in image.
            // The image shows single bars per day. Let's sum them for Total Usage.
            const val1 = Number(d['TenxHealth MFM 1']) || 0;
            const val2 = Number(d['TenxHealth MFM 2']) || 0;
            return {
                name: d.date,
                value: val1 + val2,
                formattedValue: (val1 + val2).toFixed(1)
            };
        } else {
            // hourlyData has 'date', 'totalKwH', 'maxDemand'
            if (!d || !d.date) return null;
            const timePart = d.date.split(' ')[1]?.substring(0, 5) || d.date;
            return {
                name: timePart,
                value: Number(d.totalKwH) || 0,
                formattedValue: (Number(d.totalKwH) || 0).toFixed(1)
            };
        }
    }).filter(d => d !== null);

    // Limit points for nicer display if needed
    const displayData = viewMode === 'hour' ? normalizedData.slice(-12) : normalizedData.slice(-7);

    return (
        <div className="glass-panel h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-orange-500 mb-4 font-heading">Energy Usage</h3>
                    <div className="flex gap-4 border-b border-indigo-900/10">
                        {['Day wise', 'Hour wise'].map(mode => {
                            const modeKey = mode.toLowerCase().split(' ')[0];
                            return (
                                <button
                                    key={modeKey}
                                    className={`pb-2 text-sm font-medium transition-colors border-b-2 ${viewMode === modeKey
                                            ? 'text-primary border-blue-900'
                                            : 'text-secondary border-transparent hover:text-primary'
                                        }`}
                                    onClick={() => setViewMode(modeKey)}
                                >
                                    {mode}
                                </button>
                            );
                        })}
                        {/* Placeholders for other tabs in image if needed */}
                        <button className="pb-2 text-sm font-medium text-secondary border-b-2 border-transparent cursor-not-allowed opacity-50">Month wise</button>
                        <button className="pb-2 text-sm font-medium text-secondary border-b-2 border-transparent cursor-not-allowed opacity-50">Division wise</button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-indigo-900 text-white rounded text-sm font-semibold">Energy</button>
                    <button className="px-3 py-1 text-secondary hover:text-primary rounded text-sm font-semibold">Cost</button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayData} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(26, 35, 126, 0.05)" />
                        <XAxis
                            dataKey="name"
                            stroke="#5c6bc0"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#5c6bc0"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#5c6bc0', fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0, 188, 212, 0.05)' }}
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.05)', color: '#1a237e', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value) => [`${value} kWh`, 'Usage']}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {displayData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#00bcd4" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default EnergyUsageChart;
