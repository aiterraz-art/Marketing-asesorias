import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronLeft, ChevronRight, Plus, GripVertical, Trash } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ContentCalendar() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ... existing code ...

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;
        if (!confirm('¿Estás seguro de que quieres eliminar este contenido del calendario?')) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('content_items')
                .delete()
                .eq('id', selectedEvent.id);

            if (error) throw error;

            // Update local state
            setEvents(events.filter(e => e.id !== selectedEvent.id));
            setSelectedEvent(null);
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Error al eliminar el evento.');
        } finally {
            setIsDeleting(false);
        }
    };

    // ... existing code ...

    <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-between">
        <button
            onClick={handleDeleteEvent}
            disabled={isDeleting}
            className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
        >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash size={16} />}
            Eliminar
        </button>
        <button onClick={() => setSelectedEvent(null)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
            Cerrar
        </button>
    </div>

    // Dates logic
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchEvents();
    }, []);

    async function fetchEvents() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('content_items')
                .select('*')
                .order('scheduled_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    }

    // Helper to get days of current week
    const getWeekDays = () => {
        const days = [];
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay() || 7; // Get current day number, make Sunday 7
        if (day !== 1) startOfWeek.setHours(-24 * (day - 1)); // Go back to Monday

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays();

    const changeWeek = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (offset * 7));
        setCurrentDate(newDate);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-6 animate-fade-in relative">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Calendario Editorial</h1>
                    <p className="text-zinc-400 mt-1">Organiza tu semana y revisa guiones</p>
                </div>
                <div className="flex items-center gap-4 bg-surface border border-zinc-800 rounded-lg p-1">
                    <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-zinc-800 rounded-md transition-colors"><ChevronLeft size={20} /></button>
                    <span className="font-medium text-white px-2 w-32 text-center">
                        {weekDays[0].toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })}
                    </span>
                    <button onClick={() => changeWeek(1)} className="p-2 hover:bg-zinc-800 rounded-md transition-colors"><ChevronRight size={20} /></button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 flex-1 overflow-y-auto">
                {weekDays.map((dateObj, index) => {
                    const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });
                    const dayNum = dateObj.getDate();

                    // Filter events for this day
                    const dayEvents = events.filter(e => {
                        if (!e.scheduled_date) return false;
                        const d = new Date(e.scheduled_date);
                        return d.getDate() === dayNum && d.getMonth() === dateObj.getMonth();
                    });

                    return (
                        <div key={index} className={`bg-surface border border-zinc-800 rounded-xl flex flex-col h-full min-h-[300px] ${dateObj.toDateString() === new Date().toDateString() ? 'ring-1 ring-primary/50' : ''}`}>
                            <div className="p-3 border-b border-zinc-800 font-medium text-zinc-400 flex justify-between">
                                <span className="capitalize">{dateStr}</span>
                                <span className={`text-zinc-600 ${dateObj.toDateString() === new Date().toDateString() ? 'text-primary font-bold' : ''}`}>{dayNum}</span>
                            </div>
                            <div className="p-2 flex-1 space-y-2 overflow-y-auto max-h-[500px]">
                                {dayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className="cursor-pointer"
                                    >
                                        <DraggableEvent event={event} />
                                    </div>
                                ))}
                                {dayEvents.length === 0 && (
                                    <div className="h-full flex items-center justify-center opacity-20 hover:opacity-100 transition-opacity group cursor-pointer">
                                        <Plus size={24} className="text-zinc-600 group-hover:text-primary" />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-surface border border-zinc-700 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in scale-95 duration-200">
                        <div className="p-6 border-b border-zinc-700 flex justify-between items-start bg-zinc-900">
                            <div>
                                <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded uppercase tracking-wider">{selectedEvent.type}</span>
                                <h2 className="text-2xl font-bold text-white mt-2">{selectedEvent.title}</h2>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                                <X size={24} className="text-zinc-400" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {(selectedEvent.script_content) && (
                                <div>
                                    <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-2">Guion / Estructura</h3>
                                    <div className="bg-zinc-900/50 p-4 rounded-lg text-zinc-300 whitespace-pre-line border border-zinc-800">
                                        {selectedEvent.script_content}
                                    </div>
                                </div>
                            )}

                            {(selectedEvent.production_plan) && (
                                <div>
                                    <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-2">Plan de Grabación</h3>
                                    <div className="bg-zinc-900/50 p-4 rounded-lg text-zinc-300 whitespace-pre-line border border-zinc-800">
                                        {selectedEvent.production_plan}
                                    </div>
                                </div>
                            )}

                            {(selectedEvent.ads_copy) && (
                                <div>
                                    <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-2">Copy para Redes</h3>
                                    <div className="bg-zinc-900/50 p-4 rounded-lg text-zinc-300 whitespace-pre-line border border-zinc-800 italic">
                                        {selectedEvent.ads_copy}
                                    </div>
                                </div>
                            )}

                            {!selectedEvent.script_content && !selectedEvent.production_plan && (
                                <div className="text-center py-10 text-zinc-500">
                                    Este contenido no tiene detalles generados por IA.
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-between">
                            <button
                                onClick={handleDeleteEvent}
                                disabled={isDeleting}
                                className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash size={16} />}
                                Eliminar
                            </button>
                            <button onClick={() => setSelectedEvent(null)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DraggableEvent({ event }) {
    const statusColors = {
        idea: 'bg-zinc-800 border-zinc-700 text-zinc-400',
        scripted: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        ready: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    };

    return (
        <div
            className={`p-3 rounded-lg border text-sm font-medium cursor-grab active:cursor-grabbing hover:translate-y-[-2px] transition-all shadow-sm ${statusColors[event.status] || statusColors.idea}`}
        >
            <div className="flex items-start justify-between gap-2">
                <span>{event.title}</span>
                <GripVertical size={14} className="opacity-50" />
            </div>
        </div>
    );
}
