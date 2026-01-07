import React from 'react';
import { LayoutDashboard, Ticket, Settings, Zap } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    return (
        <div className="sidebar">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Zap className="text-cyan" size={24} />
                </div>
                <h1 className="text-xl font-bold m-0">EnergyAI</h1>
            </div>

            <nav className="flex-col gap-2">
                <button
                    className={`nav-item w-full ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <LayoutDashboard size={20} />
                    <span>Overview</span>
                </button>

                <button
                    className={`nav-item w-full ${activeTab === 'tickets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tickets')}
                >
                    <Ticket size={20} />
                    <span>Tickets & AI</span>
                </button>

                <button
                    className={`nav-item w-full ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </button>
            </nav>
        </div>
    );
};

export default Sidebar;
