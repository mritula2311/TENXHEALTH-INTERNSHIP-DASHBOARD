import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle, Clock, MessageSquare, Zap, AlertTriangle } from 'lucide-react';
import { raiseTicket } from '../api';

const TicketSystem = ({ socket }) => {
    const [tickets, setTickets] = useState([]);

    const [formData, setFormData] = useState({ subject: '', description: '', priority: 'medium' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch persisted tickets on mount
        const loadTickets = async () => {
            // Dynamic import to avoid potential circular dep if api imports this (unlikely but safe)
            const { fetchTickets } = await import('../api');
            const existing = await fetchTickets();
            if (existing && existing.length > 0) {
                setTickets(prev => {
                    // Merge with dummy initial state if needed, or replace. 
                    // Let's replace the dummy ones with real ones if real ones exist, 
                    // but maybe keep the dummy ones for demo purposes if real list is empty?
                    // Request implies "WHERE IS TICKET RAISED", so they want to see the real one.
                    // Filter out duplicates if any match by ID.
                    const uniqueExisting = existing.filter(e => !prev.some(p => p.id === e.ticketId));

                    // Transform API format to Component state format if needed
                    const mappedExisting = uniqueExisting.map(t => ({
                        id: t.ticketId,
                        subject: t.subject,
                        description: t.description,
                        status: t.status,
                        priority: t.priority,
                        timestamp: t.timestamp,
                        isAiGenerated: t.isAiGenerated,
                        source: t.source,
                        equipment: t.equipment,
                        alertType: t.alertType,
                        consumption: t.consumption
                    }));

                    return [...mappedExisting, ...prev];
                });
            }
        };
        loadTickets();

        if (!socket) return;

        socket.on('n8n-update', (data) => {
            console.log('Received n8n update:', data);

            // Handle ticket from n8n (with full energy data)
            if (data.ticketId || data.subject) {
                const newTicket = {
                    id: data.ticketId || `T-${Date.now()}`,
                    subject: data.subject || 'System Alert',
                    description: data.description || data.message || 'Received update from n8n',
                    status: data.status || 'open',
                    priority: data.priority || 'medium',
                    timestamp: data.timestamp || new Date().toLocaleString(),
                    isAiGenerated: true,
                    source: data.source || 'n8n',
                    // Energy specific data
                    equipment: data.equipment,
                    alertType: data.alertType,
                    consumption: data.consumption,
                    expected: data.expected,
                    isNight: data.isNight,
                    nightAnomaly: data.nightAnomaly,
                    thresholdBreach: data.thresholdBreach,
                    // AI Analysis data
                    aiAnalysis: data.aiAnalysis,
                    requiresManualCheck: data.requiresManualCheck
                };

                // Check if ticket already exists (update) or is new
                setTickets(prev => {
                    const existingIndex = prev.findIndex(t => t.id === newTicket.id);
                    if (existingIndex >= 0) {
                        // Update existing ticket
                        const updated = [...prev];
                        updated[existingIndex] = { ...updated[existingIndex], ...newTicket };
                        return updated;
                    }
                    // Add new ticket at the top
                    return [newTicket, ...prev];
                });
            }
        });

        return () => {
            socket.off('n8n-update');
        };
    }, [socket]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const newTicket = {
            id: `T-${Math.floor(Math.random() * 10000)}`,
            ...formData,
            status: 'open',
            timestamp: new Date().toLocaleString()
        };

        try {
            // Optimistic update
            setTickets(prev => [newTicket, ...prev]);

            // Send to backend/n8n
            await raiseTicket(newTicket);

            setFormData({ subject: '', description: '', priority: 'medium' });
        } catch (error) {
            alert('Failed to raise ticket');
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (ts) => {
        if (!ts) return '';
        try {
            const date = new Date(ts);
            return date.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return ts;
        }
    };

    return (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Ticket Form */}
            <div className="glass-panel lg:col-span-1 h-fit">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MessageSquare className="text-cyan" /> Raise Ticket
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm text-secondary mb-1 block">Subject</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Brief summary of the issue"
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm text-secondary mb-1 block">Priority</label>
                        <select
                            className="input"
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm text-secondary mb-1 block">Description</label>
                        <textarea
                            className="input h-32 resize-none"
                            placeholder="Detailed description..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary flex justify-center items-center gap-2" disabled={loading}>
                        {loading ? 'Sending...' : <><Send size={18} /> Submit Ticket</>}
                    </button>
                </form>
            </div>

            {/* Ticket List */}
            <div className="glass-panel lg:col-span-2">
                <h2 className="text-xl font-bold mb-6">Recent Tickets & AI Updates</h2>
                <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto">
                    {tickets.length === 0 && (
                        <div className="text-center p-8 text-secondary border border-dashed border-white/10 rounded-lg">
                            <CheckCircle className="mx-auto mb-2 opacity-50" size={32} />
                            <p>No active tickets found.</p>
                            <p className="text-xs mt-1">AI monitors system 24/7 for anomalies.</p>
                        </div>
                    )}
                    {tickets.map(ticket => (
                        <div key={ticket.id} className="ticket-item hover:bg-white/5 p-4 rounded-lg transition-colors border border-white/10">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`status-badge status-${ticket.status}`}>
                                        {ticket.status}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${ticket.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                        ticket.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-green-500/20 text-green-400'
                                        }`}>
                                        {ticket.priority}
                                    </span>
                                    <span className="text-secondary text-sm">{ticket.id}</span>
                                    {ticket.isAiGenerated && (
                                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded flex items-center gap-1">
                                            <Zap size={12} /> n8n Auto
                                        </span>
                                    )}
                                    {ticket.alertType === 'ANOMALY' && (
                                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded flex items-center gap-1">
                                            <AlertTriangle size={12} /> Anomaly
                                        </span>
                                    )}
                                </div>
                                <span className="text-secondary text-xs flex items-center gap-1">
                                    <Clock size={12} /> {formatTimestamp(ticket.timestamp)}
                                </span>
                            </div>

                            <h3 className="font-semibold text-lg mb-1">{ticket.subject}</h3>

                            {/* Equipment & Energy Info */}
                            {ticket.equipment && (
                                <div className="flex gap-4 text-xs text-secondary mb-2 flex-wrap">
                                    <span className="bg-blue-500/10 px-2 py-1 rounded">📟 {ticket.equipment}</span>
                                    {ticket.consumption !== undefined && (
                                        <span className="bg-cyan-500/10 px-2 py-1 rounded">
                                            ⚡ {ticket.consumption} kWh (expected: {ticket.expected} kWh)
                                        </span>
                                    )}
                                    {ticket.isNight && (
                                        <span className="bg-indigo-500/10 px-2 py-1 rounded">🌙 Night</span>
                                    )}
                                </div>
                            )}

                            <p className="text-secondary text-sm mb-3 whitespace-pre-wrap">{ticket.description}</p>

                            {ticket.aiResponse && (
                                <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-lg mt-2">
                                    <p className="text-cyan text-sm font-medium mb-1">AI Response:</p>
                                    <p className="text-sm text-gray-300">{ticket.aiResponse}</p>
                                </div>
                            )}

                            {ticket.aiAnalysis && (
                                <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg mt-2">
                                    <p className="text-purple-400 text-sm font-medium mb-1 flex items-center gap-1">
                                        <Zap size={14} /> AI Pattern Analysis:
                                    </p>
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{ticket.aiAnalysis}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TicketSystem;

