import React, { useEffect, useState } from 'react';
import { ArrowRight, BarChart3, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import AdsAnalytics from './AdsAnalytics';
import { supabase } from '../lib/supabase';

export default function UnifiedDashboard({ setActiveTab }) {
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUpcoming();
    }, []);

    async function fetchUpcoming() {
        try {
            const { data, error } = await supabase
                .from('content_items')
                .select('*')
                .gte('scheduled_date', new Date().toISOString())
                .order('scheduled_date', { ascending: true })
                .limit(3);

            if (error) throw error;
            setUpcomingEvents(data || []);
        } catch (error) {
            console.error('Error fetching dashboard events:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 space-y-8 animate-fade-in h-auto lg:h-[calc(100vh-100px)] overflow-y-auto">

            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-zinc-900 to-black border border-zinc-800 rounded-2xl p-8 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-white mb-2">Hola, Entrenador 👋</h1>
                    <p className="text-zinc-400 max-w-xl text-lg">
                        Tu Marketing OS está listo. {upcomingEvents.length > 0
                            ? `Tienes ${upcomingEvents.length} piezas de contenido próximas.`
                            : 'No hay contenido programado próximamente.'}
                    </p>
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => setActiveTab('generator')}
                            className="bg-primary hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg hover:shadow-primary/25"
                        >
                            Crear Contenido
                        </button>
                        <button
                            onClick={() => setActiveTab('chat')}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                            <MessageSquare size={18} />
                            Consultar a la IA
                        </button>
                    </div>
                </div>

                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Quick Actions / Shortcuts */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="text-primary" />
                        Resumen de Rendimiento
                    </h2>
                    <div className="bg-surface border border-zinc-800 rounded-xl h-[400px] overflow-hidden relative">
                        {/* Embed a mini version of analytics or just a placeholder for the overview */}
                        <div className="absolute inset-0 opacity-80 scale-90 origin-top-left pointer-events-none">
                            <AdsAnalytics />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface to-transparent flex items-end justify-center pb-6">
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className="text-white bg-zinc-800/80 backdrop-blur hover:bg-zinc-700 px-4 py-2 rounded-full text-sm font-medium border border-zinc-700 transition-colors flex items-center gap-2"
                            >
                                Ver Reporte Completo <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Pulse / Upcoming */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="text-primary" />
                        Próximos en Calendario
                    </h2>
                    <div className="bg-surface border border-zinc-800 rounded-xl p-5 space-y-4 min-h-[200px]">
                        {loading ? (
                            <div className="flex justify-center items-center h-full py-10">
                                <Loader2 className="animate-spin text-zinc-500" />
                            </div>
                        ) : upcomingEvents.length === 0 ? (
                            <div className="text-center text-zinc-500 py-8">
                                No hay eventos próximos.
                                <br />
                                <button onClick={() => setActiveTab('generator')} className="text-primary hover:underline mt-2">¡Crea algo nuevo!</button>
                            </div>
                        ) : (
                            upcomingEvents.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-800 cursor-pointer" onClick={() => setActiveTab('calendar')}>
                                    <div className={`w-2 h-12 rounded-full ${item.status === 'ready' ? 'bg-emerald-500' :
                                        item.status === 'draft' ? 'bg-yellow-500' : 'bg-zinc-700'
                                        }`}></div>
                                    <div>
                                        <h4 className="font-semibold text-zinc-200 line-clamp-1">{item.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                                            <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-700 capitalize">{item.type}</span>
                                            <span>• {new Date(item.scheduled_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )))}

                        <button
                            onClick={() => setActiveTab('calendar')}
                            className="w-full py-3 mt-2 text-sm text-zinc-400 hover:text-white border border-dashed border-zinc-700 rounded-lg hover:bg-zinc-900 transition-all"
                        >
                            Ver Calendario Completo
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
