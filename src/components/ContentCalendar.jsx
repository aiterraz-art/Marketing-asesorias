import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MoreVertical, Copy, Download, Trash2, CheckCircle, X, Sparkles, Image as ImageIcon, Megaphone } from 'lucide-react';

export default function ContentCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        fetchMonthItems();
    }, [currentDate]);

    async function fetchMonthItems() {
        setLoading(true);
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

        try {
            const { data, error } = await supabase
                .from('content_items')
                .select('*')
                .gte('scheduled_date', startOfMonth)
                .lte('scheduled_date', endOfMonth);

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching calendar items:', error);
        } finally {
            setLoading(false);
        }
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return new Date(year, month, 1).getDay(); // 0 = Sunday
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth();
        const firstDay = getFirstDayOfMonth();
        const days = [];

        // Empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 bg-zinc-900/30 border border-zinc-800/50"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
            const dayItems = items.filter(item => item.scheduled_date && item.scheduled_date.startsWith(dateStr));

            days.push(
                <div key={day} className="h-32 bg-zinc-900/50 border border-zinc-800/80 p-2 overflow-y-auto hover:bg-zinc-800/30 transition-all relative group flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-bold ${dayItems.length > 0 ? 'text-white' : 'text-zinc-600'}`}>
                            {day}
                        </span>
                        {dayItems.some(item => item.ads_copy) && (
                            <Megaphone size={10} className="text-emerald-400 opacity-60" title="Contiene Ads" />
                        )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                        {dayItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`w-full text-left text-[10px] p-1.5 rounded-md truncate flex items-center gap-1.5 transition-all border
                                    ${item.status === 'published' ? 'opacity-40 border-transparent bg-zinc-800/50' : ''}
                                    ${item.type === 'reel' && item.status !== 'published' ? 'bg-pink-500/5 text-pink-300 border-pink-500/10 hover:bg-pink-500/20 hover:border-pink-500/30' : ''}
                                    ${item.type === 'post' && item.status !== 'published' ? 'bg-blue-500/5 text-blue-300 border-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/30' : ''}
                                    ${item.type === 'story' && item.status !== 'published' ? 'bg-amber-500/5 text-amber-300 border-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/30' : ''}
                                    ${item.ads_copy ? 'ring-1 ring-emerald-500/20' : ''}
                                `}
                            >
                                <div className={`w-1 h-1 rounded-full shrink-0 ${item.type === 'reel' ? 'bg-pink-500' :
                                        item.type === 'post' ? 'bg-blue-500' : 'bg-amber-500'
                                    }`} />

                                <span className="truncate flex-1">
                                    {item.title}
                                </span>

                                {item.ads_copy && <Megaphone size={8} className="text-emerald-400 shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    return (
        <div className="h-full flex flex-col p-6 lg:p-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 bg-surface p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/20 text-primary rounded-lg">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white capitalize">
                            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </h2>
                        <p className="text-sm text-zinc-400">Planificador de Contenido</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors">
                        Hoy
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-surface rounded-xl border border-zinc-800 shadow-xl overflow-hidden flex flex-col">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 bg-zinc-900 border-b border-zinc-800">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                        <div key={day} className="py-3 text-center text-sm font-medium text-zinc-400 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="col-span-7 h-64 flex items-center justify-center text-zinc-500">
                            Cargando calendario...
                        </div>
                    ) : renderCalendarDays()}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <DetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onRefresh={fetchMonthItems}
                />
            )}
        </div>
    );
}

function DetailModal({ item, onClose, onRefresh }) {

    const handleCopyCaption = () => {
        // Format for Instagram
        const separator = "\n.\n.\n";
        const content = `🔥 ${item.title}\n\n${item.script_content || ''}\n${separator}🚀 ${item.production_plan ? "Tip: " + item.production_plan : ""}`;
        navigator.clipboard.writeText(content);
        alert("¡Caption copiado! 📋");
    };

    const handleDelete = async () => {
        if (!confirm("¿Seguro que quieres eliminar este contenido?")) return;

        try {
            const { error } = await supabase.from('content_items').delete().eq('id', item.id);
            if (error) throw error;
            onRefresh();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Error al eliminar");
        }
    };

    const handleToggleStatus = async () => {
        const newStatus = item.status === 'published' ? 'idea' : 'published';
        try {
            const { error } = await supabase
                .from('content_items')
                .update({ status: newStatus })
                .eq('id', item.id);
            if (error) throw error;
            onRefresh();
            item.status = newStatus; // Optimistic update for UI in modal
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex justify-between items-start bg-zinc-900">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider
                                ${item.type === 'reel' ? 'bg-pink-500/20 text-pink-400' :
                                    item.type === 'post' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}
                             `}>
                                {item.type}
                            </span>
                            <span className="text-zinc-500 text-xs">
                                {new Date(item.scheduled_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white leading-tight">{item.title}</h3>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">

                    {/* Image if exists */}
                    {item.image_url && (
                        <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black relative group">
                            <img src={item.image_url} alt="Content Asset" className="w-full h-auto max-h-[300px] object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <a
                                    href={item.image_url}
                                    target="_blank"
                                    download="imagen_post.png"
                                    className="text-white text-xs hover:underline flex items-center gap-1"
                                >
                                    <Download size={14} /> Descargar Imagen Original
                                </a>
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-bold text-zinc-400 uppercase mb-2 flex items-center gap-2">
                            <MoreVertical size={14} /> Guion / Caption
                        </h4>
                        <div className="bg-zinc-950/50 p-4 rounded-lg text-zinc-300 text-sm whitespace-pre-line border border-zinc-800/50 leading-relaxed font-mono">
                            {item.script_content}
                        </div>
                    </div>

                    {item.production_plan && (
                        <div>
                            <h4 className="text-sm font-bold text-zinc-400 uppercase mb-2">Plan de Producción</h4>
                            <p className="text-zinc-400 text-sm bg-zinc-900 p-3 rounded border border-zinc-800">{item.production_plan}</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDelete}
                            className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm flex items-center gap-2"
                        >
                            <Trash2 size={16} /> <span className="hidden sm:inline">Eliminar</span>
                        </button>
                        <button
                            onClick={handleToggleStatus}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                                ${item.status === 'published'
                                    ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-800 hover:bg-emerald-900/40'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'}
                             `}
                        >
                            <CheckCircle size={16} />
                            {item.status === 'published' ? 'Publicado' : 'Marcar Publicado'}
                        </button>
                    </div>

                    <button
                        onClick={handleCopyCaption}
                        className="flex-1 sm:flex-none px-6 py-3 bg-primary hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Copy size={18} /> Copiar Caption
                    </button>
                </div>

            </div>
        </div>
    );
}
