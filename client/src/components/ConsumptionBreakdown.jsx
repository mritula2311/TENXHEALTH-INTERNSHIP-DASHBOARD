import React from 'react';

const ConsumptionBreakdown = ({ totalConsumption, averageConsumption }) => {
    // Mock simulation
    const costPerUnit = 12; // INR
    const actualCost = (totalConsumption * costPerUnit).toFixed(0);
    const predictiveConsumption = (totalConsumption * 1.05).toFixed(0);
    const predictiveCost = (predictiveConsumption * costPerUnit).toFixed(0);
    const powerFactor = 0.87;

    return (
        <div className="glass-panel h-full flex flex-col p-6">
            <h3 className="text-xl font-bold text-orange-500 mb-6 font-heading">Energy Consumption</h3>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="pb-4 text-sm font-bold text-gray-400 uppercase tracking-wider w-[30%] pl-2">Metric</th>
                            <th className="pb-4 text-lg font-bold text-primary w-[35%]">Actual</th>
                            <th className="pb-4 text-lg font-bold text-primary w-[35%]">Predictive</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Consumption Row */}
                        <tr className="border-t border-b border-dashed border-gray-200 hover:bg-white/5 transition-colors">
                            <td className="py-6 align-middle pl-2">
                                <div className="text-base font-bold text-indigo-500">Consumption</div>
                                <div className="text-xs font-bold text-gray-400 mt-1">kWh</div>
                            </td>
                            <td className="py-6 align-middle">
                                <span className="text-3xl font-bold text-primary">{Math.round(totalConsumption)}</span>
                            </td>
                            <td className="py-6 align-middle">
                                <span className="text-3xl font-bold text-primary">{predictiveConsumption}</span>
                            </td>
                        </tr>

                        {/* Cost Row */}
                        <tr className="border-b border-dashed border-gray-200 hover:bg-white/5 transition-colors">
                            <td className="py-6 align-middle pl-2">
                                <div className="text-base font-bold text-indigo-500">Cost</div>
                                <div className="text-xs font-bold text-gray-400 mt-1">INR</div>
                            </td>
                            <td className="py-6 align-middle">
                                <span className="text-3xl font-bold text-primary">{actualCost}</span>
                            </td>
                            <td className="py-6 align-middle">
                                <span className="text-3xl font-bold text-primary">{predictiveCost}</span>
                            </td>
                        </tr>

                         {/* Footer Row (PF / Avg) */}
                         <tr className="hover:bg-white/5 transition-colors">
                            <td className="py-6 align-middle pl-2">
                                <div className="text-base font-bold text-indigo-500">Analysis</div>
                            </td>
                            <td className="py-6 align-middle">
                                <div className="text-3xl font-bold text-primary">{powerFactor}</div>
                                <div className="text-xs font-bold text-gray-400 mt-1">PF</div>
                            </td>
                            <td className="py-6 align-middle">
                                <div className="text-3xl font-bold text-primary">{Math.round(averageConsumption)}</div>
                                <div className="text-xs font-bold text-gray-400 mt-1">Avg kWh</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ConsumptionBreakdown;
