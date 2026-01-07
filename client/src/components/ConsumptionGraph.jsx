import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import StatisticsOverlay from './StatisticsOverlay';

const ConsumptionGraph = ({ data, stats }) => {
    return (
        <div className="glass-panel h-full flex flex-col">
            <h3 className="text-xl font-bold text-orange-500 mb-4 font-heading">Consumption Profile</h3>

            {/* Stats Overlay integrated if stats provided */}
            {stats && <StatisticsOverlay stats={stats} unit="kWh" />}

            <div className="w-full h-96 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF5722" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#FF5722" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(26, 35, 126, 0.1)" />
                        <XAxis
                            dataKey="time"
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
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e0e0e0', color: '#1a237e', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            itemStyle={{ color: '#1a237e' }}
                        />

                        {/* Area */}
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#FF5722"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorConsumption)"
                            name="Consumption"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ConsumptionGraph;
