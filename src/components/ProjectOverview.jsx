import React, { useEffect, useState } from 'react';
import { Folder, Plus, ArrowRight, BarChart3, Calendar, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ProjectOverview({ onSelectCampaign }) {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    async function fetchCampaigns() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampaigns(data || []);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteCampaign(e, id) {
        e.stopPropagation(); // Prevent card click
        if (!confirm("¿Estás seguro de querer eliminar esta campaña y todo su contenido?")) return;

        try {
            // 1. Delete associated content items first (Manual Cascade)
            const { error: itemsError } = await supabase
                .from('content_items')
                .delete()
                .eq('campaign_id', id);

            if (itemsError) throw itemsError;

            // 2. Delete the campaign
            const { error } = await supabase
                .from('campaigns')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setCampaigns(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting campaign:', error);
            alert("No se pudo eliminar la campaña: " + error.message);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Mis Campañas</h1>
                    <p className="text-zinc-400 mt-1">Gestiona y organiza tus lanzamientos de marketing</p>
                </div>
                <button className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg hover:shadow-primary/20">
                    <Plus size={20} />
                    Nueva Campaña
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.length === 0 ? (
                    <div className="col-span-full text-center text-zinc-500 py-10">
                        No hay campañas activas. ¡Crea la primera!
                    </div>
                ) : (
                    campaigns.map((campaign) => (
                        <div
                            key={campaign.id}
                            className="group bg-surface border border-zinc-800 rounded-xl p-5 hover:border-primary/50 transition-all cursor-pointer hover:shadow-xl hover:shadow-black/50 relative"
                            onClick={() => onSelectCampaign(campaign)}
                        >
                            <button
                                onClick={(e) => deleteCampaign(e, campaign.id)}
                                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-red-500 bg-zinc-900/50 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Eliminar campaña"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-zinc-800/50 rounded-lg text-primary group-hover:text-white group-hover:bg-primary/20 transition-colors">
                                    <Folder size={24} />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${campaign.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                    }`}>
                                    {campaign.status === 'active' ? 'Activa' : 'Borrador'}
                                </span>
                            </div>

                            <h3 className="text-xl font-semibold text-white mb-2 pr-8">{campaign.title}</h3>

                            <div className="space-y-4 mt-4">
                                <div className="flex items-center justify-between text-sm text-zinc-400">
                                    <span className="flex items-center gap-1"><BarChart3 size={14} /> {campaign.contentCount || 0} assets</span>
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(campaign.created_at).toLocaleDateString()}</span>
                                </div>

                                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-primary h-full rounded-full transition-all duration-500"
                                        style={{ width: `${campaign.progress || 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )))}

                {/* Create Card */}
                <div className="border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-5 flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 transition-all cursor-pointer min-h-[200px]">
                    <div className="p-4 rounded-full bg-zinc-900 mb-3">
                        <Plus size={24} />
                    </div>
                    <span className="font-medium">Crear Nueva Campaña</span>
                </div>
            </div>
        </div>
    );
}
