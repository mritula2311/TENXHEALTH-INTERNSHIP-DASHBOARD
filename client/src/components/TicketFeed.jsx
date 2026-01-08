import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import io from 'socket.io-client';

const TicketFeed = () => {
    const [tickets, setTickets] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Initial fetch of persisted tickets
        const loadTickets = async () => {
            try {
                // Dynamic import to avoid circular dependencies if any, or just use global
                const { fetchTickets } = await import('../api');
                const existing = await fetchTickets();
                if (existing && existing.length > 0) {
                    setTickets(existing);
                }
            } catch (e) {
                console.error("Error loading tickets", e);
            }
        };
        loadTickets();

        const newSocket = io('http://localhost:3000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server for tickets');
        });

        // Listen for both generic n8n-updates (which might contain tickets)
        // and any specific ticket events if we defined them differently, 
        // but server emits 'n8n-update' for tickets too.
        newSocket.on('n8n-update', (data) => {
            console.log('Received n8n update:', data);
            if (data.ticketId) {
                setTickets(prev => {
                    // Prevent duplicates
                    const isDuplicate = prev.some(t => t.ticketId === data.ticketId);
                    if (isDuplicate) return prev;
                    return [data, ...prev].slice(0, 10);
                });
            }
        });

        return () => newSocket.close();
    }, []);

    if (tickets.length === 0) {
        return (
            <div className="glass-panel h-full p-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3">
                    <Clock className="text-indigo-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">AI Ticket Feed</h3>
                <p className="text-secondary text-sm">Waiting for n8n alerts...</p>
            </div>
        );
    }

    return (
        <div className="glass-panel h-full flex flex-col p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-orange-500 font-heading">Live AI Tickets</h3>
                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full">
                    {tickets.length} Active
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {tickets.map((ticket, index) => (
                    <div key={ticket.ticketId || index} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${(ticket.priority === 'CRITICAL' || ticket.priority === 'critical')
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-500'
                                }`}>
                                {ticket.priority || 'NORMAL'}
                            </span>
                            <span className="text-xs text-secondary">{new Date(ticket.timestamp || Date.now()).toLocaleTimeString()}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">{ticket.subject || ticket.title}</h4>
                        <p className="text-xs text-secondary line-clamp-2">{ticket.description}</p>
                        {ticket.equipment && (
                            <div className="mt-2 text-xs font-mono text-indigo-300 bg-indigo-900/20 px-2 py-1 rounded inline-block">
                                {ticket.equipment} | {ticket.consumption} kWh
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TicketFeed;
