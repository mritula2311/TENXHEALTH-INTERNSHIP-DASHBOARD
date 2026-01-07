import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import EnergyDashboard from './components/EnergyDashboard';
import TicketSystem from './components/TicketSystem';
import { fetchHourlyData, fetchDailyData } from './api';
import './tor_dashboard.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [socket, setSocket] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connect to Socket.io
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // Fetch Initial Data
    const loadData = async () => {
      try {
        const [hourly, daily] = await Promise.all([
          fetchHourlyData(),
          fetchDailyData()
        ]);
        setHourlyData(hourly);
        setDailyData(daily);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => newSocket.close();
  }, []);

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <EnergyDashboard hourlyData={hourlyData} dailyData={dailyData} />
            )}
            {activeTab === 'tickets' && (
              <TicketSystem socket={socket} />
            )}
            {activeTab === 'settings' && (
              <div className="glass-panel text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                <p className="text-secondary">Configuration options for n8n webhooks and API keys would go here.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
