import React from 'react';

const StatisticsOverlay = ({ stats, unit = 'kWh' }) => {
    if (!stats) return null;

    const { avg, max, min, stdDev } = stats;

    return (
        <div className="stats-overlay">
            <h4 className="text-xs font-bold uppercase text-secondary mb-1 border-b pb-1 border-gray-100">
                Statistics
            </h4>

            <div className="stats-row stat-avg">
                <span className="stat-label">Average</span>
                <span className="stat-value">{avg} {unit}</span>
            </div>

            <div className="stats-row stat-max">
                <span className="stat-label">Max</span>
                <span className="stat-value">{max} {unit}</span>
            </div>

            <div className="stats-row stat-min">
                <span className="stat-label">Min</span>
                <span className="stat-value">{min} {unit}</span>
            </div>

            <div className="stats-row">
                <span className="stat-label">Std Dev</span>
                <span className="stat-value text-secondary">±{stdDev}</span>
            </div>
        </div>
    );
};

export default StatisticsOverlay;
