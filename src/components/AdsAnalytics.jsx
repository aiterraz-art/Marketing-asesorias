import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { TrendingUp, Users, DollarSign, MousePointerClick, Loader2, AlertTriangle, ChevronDown, ChevronRight, BrainCircuit, MessageCircle } from 'lucide-react';
import { fetchAdInsights, fetchCampaignInsights, fetchAdsByCampaign } from '../lib/meta-ads';
import { analyzeAdsPerformance, continueAdsAnalysisChat } from '../lib/openai';

export default function AdsAnalytics() {
    const [accountData, setAccountData] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('last_30d');
    const [expandedCampaign, setExpandedCampaign] = useState(null);
    const [adsData, setAdsData] = useState({}); // Cache specific campaign ads

    // AI Analysis State
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    // AI Chat State
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatting, setIsChatting] = useState(false);

    const [kpis, setKpis] = useState({
        spend: 0,
        ctr: 0,
        cpc: 0,
        conversations: 0,
        costPerMsg: 0
    });

    useEffect(() => {
        loadData();
    }, [period]);

    async function loadData() {
        setLoading(true);
        setError(null);
        setAnalysisResult(null);
        setChatMessages([]); // Reset chat on new data
        try {
            // ... existing loadData logic ...
            // Parallel fetch for account history and breakdown
            const [history, campaignsData] = await Promise.all([
                fetchAdInsights(period),
                fetchCampaignInsights(period)
            ]);

            // Sort history for charts
            const sortedHistory = history.sort((a, b) => new Date(a.raw_date) - new Date(b.raw_date));
            setAccountData(sortedHistory);
            setCampaigns(campaignsData);

            // Calculate Account KPIs
            if (sortedHistory.length > 0) {
                const totalSpend = sortedHistory.reduce((acc, curr) => acc + curr.spend, 0);
                const totalConverse = sortedHistory.reduce((acc, curr) => acc + curr.conversations, 0);
                const avgCtr = sortedHistory.reduce((acc, curr) => acc + curr.ctr, 0) / sortedHistory.length;
                const avgCpc = sortedHistory.reduce((acc, curr) => acc + curr.cpc, 0) / sortedHistory.length;

                setKpis({
                    spend: totalSpend,
                    ctr: avgCtr,
                    cpc: avgCpc,
                    conversations: totalConverse,
                    costPerMsg: totalConverse > 0 ? totalSpend / totalConverse : 0
                });
            }

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const toggleCampaign = async (campaignId) => {
        // ... existing toggleCampaign logic ...
        if (expandedCampaign === campaignId) {
            setExpandedCampaign(null);
        } else {
            setExpandedCampaign(campaignId);
            if (!adsData[campaignId]) {
                // Fetch ads for this campaign
                try {
                    const ads = await fetchAdsByCampaign(campaignId, period);
                    setAdsData(prev => ({ ...prev, [campaignId]: ads }));
                } catch (e) {
                    console.error("Failed to load ads", e);
                }
            }
        }
    };

    const handleRunAIAnalysis = async () => {
        if (campaigns.length === 0) return;
        setAnalyzing(true);
        setChatMessages([]); // Reset chat
        try {
            const analysis = await analyzeAdsPerformance(campaigns);
            setAnalysisResult(analysis);
            // Initialize chat with summary context implicitly or explicitly if needed
        } catch (e) {
            alert("Error analizando datos: " + e.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSendChatMessage = async () => {
        if (!chatInput.trim()) return;

        const userMsg = { role: 'user', content: chatInput };
        const newHistory = [...chatMessages, userMsg];

        setChatMessages(newHistory);
        setChatInput('');
        setIsChatting(true);

        try {
            const response = await continueAdsAnalysisChat(newHistory, campaigns);
            setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error("Chat error", error);
            alert("Error en el chat: " + error.message);
        } finally {
            setIsChatting(false);
        }
    };

    if (loading && accountData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full animate-fade-in">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in p-6 h-auto lg:h-[calc(100vh-100px)] overflow-y-auto w-full">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Rendimiento de Anuncios</h1>
                    <p className="text-zinc-400 mt-1 flex items-center gap-2">
                        {error ? <span className="text-red-400 flex items-center gap-2"><AlertTriangle size={14} /> {error}</span> : "Centro de Comando Meta Ads"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRunAIAnalysis}
                        disabled={analyzing || campaigns.length === 0}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50"
                    >
                        {analyzing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                        {analyzing ? 'Analizando...' : 'Analizar con IA'}
                    </button>

                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary cursor-pointer"
                    >
                        <option value="today">Hoy</option>
                        <option value="last_7d">Últimos 7 días</option>
                        <option value="last_30d">Últimos 30 días</option>
                        <option value="last_90d">Últimos 90 días</option>
                    </select>
                </div>
            </div>

            {/* AI Analysis Result */}
            {analysisResult && (
                <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-6 shadow-2xl animate-in slide-in-from-top-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-lg shrink-0">
                            <BrainCircuit className="text-indigo-400" size={24} />
                        </div>
                        <div className="space-y-4 w-full">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Análisis Estratégico IA</h3>
                                <p className="text-zinc-300 text-sm leading-relaxed">{analysisResult.summary}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                                    <span className="text-xs text-emerald-400 uppercase font-bold tracking-wider">Campaña Ganadora 🏆</span>
                                    <p className="text-white font-medium mt-1">{analysisResult.winner_campaign}</p>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                                    <span className="text-xs text-red-400 uppercase font-bold tracking-wider">Campaña Perdedora 📉</span>
                                    <p className="text-white font-medium mt-1">{analysisResult.loser_campaign}</p>
                                </div>
                            </div>

                            <div className="bg-zinc-900/50 rounded-lg p-4">
                                <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-2 block">Acciones Recomendadas</span>
                                <ul className="space-y-2">
                                    {analysisResult.actions.map((action, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-200">
                                            <span className="text-indigo-400 mt-0.5">•</span>
                                            {action}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Conversational Chat Section */}
                            <div className="border-t border-indigo-500/30 pt-4 mt-6">
                                <h4 className="text-zinc-400 text-sm font-bold mb-3 flex items-center gap-2">
                                    <MessageCircle size={16} /> Profundizar Análisis
                                </h4>

                                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                                    {chatMessages.length === 0 && (
                                        <p className="text-zinc-500 text-xs italic text-center py-2">
                                            Pregunta a la IA sobre estos resultados para obtener recomendaciones detalladas...
                                        </p>
                                    )}
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`rounded-lg px-4 py-2 text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-200'}`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isChatting && (
                                        <div className="flex justify-start">
                                            <div className="bg-zinc-800 rounded-lg px-4 py-2 flex items-center gap-2">
                                                <Loader2 size={14} className="animate-spin text-zinc-400" />
                                                <span className="text-zinc-500 text-xs">Escribiendo...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                                        placeholder="Ej: ¿Cómo mejoro la campaña perdedora?"
                                        className="flex-1 bg-zinc-900 border border-zinc-700/50 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
                                    />
                                    <button
                                        onClick={handleSendChatMessage}
                                        disabled={isChatting || !chatInput.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 disabled:opacity-50 transition-colors flex items-center justify-center"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Gasto Total" value={`$${kpis.spend.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`} icon={<DollarSign size={20} />} color="text-emerald-500" />
                <KpiCard title="Conversaciones" value={kpis.conversations} icon={<MessageCircle size={20} />} color="text-purple-500" highlight />
                <KpiCard title="Costo por Msj" value={`$${kpis.costPerMsg.toFixed(0)}`} icon={<DollarSign size={20} />} color="text-orange-500" />
                <KpiCard title="CTR Promedio" value={`${kpis.ctr.toFixed(2)}%`} icon={<MousePointerClick size={20} />} color="text-blue-500" />
            </div>

            {/* Campaigns Table */}
            <div className="bg-surface border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <h3 className="font-bold text-white">Rendimiento por Campaña</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-900 text-zinc-400">
                            <tr>
                                <th className="px-4 py-3 font-medium w-8"></th>
                                <th className="px-4 py-3 font-medium">Campaña</th>
                                <th className="px-4 py-3 font-medium text-right">Gasto</th>
                                <th className="px-4 py-3 font-medium text-right">Msjs</th>
                                <th className="px-4 py-3 font-medium text-right">Costo/Msj</th>
                                <th className="px-4 py-3 font-medium text-right">CTR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {campaigns.length > 0 ? campaigns.map((camp) => (
                                <React.Fragment key={camp.id}>
                                    <tr className="hover:bg-zinc-800/50 transition-colors cursor-pointer group" onClick={() => toggleCampaign(camp.id)}>
                                        <td className="px-4 py-3 text-zinc-500">
                                            {expandedCampaign === camp.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-white group-hover:text-primary transition-colors">{camp.name}</td>
                                        <td className="px-4 py-3 text-right text-zinc-300">${camp.spend.toLocaleString('es-CL')}</td>
                                        <td className="px-4 py-3 text-right text-white font-bold">{camp.conversations}</td>
                                        <td className="px-4 py-3 text-right text-zinc-300">
                                            {camp.costPerConversation > 0 ? `$${camp.costPerConversation.toFixed(0)}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-zinc-300">{camp.ctr.toFixed(2)}%</td>
                                    </tr>
                                    {/* Ads Dropdown */}
                                    {expandedCampaign === camp.id && (
                                        <tr>
                                            <td colSpan={6} className="bg-zinc-900/30 p-0 border-b border-zinc-800">
                                                <div className="p-4 pl-12">
                                                    {!adsData[camp.id] ? (
                                                        <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                                            <Loader2 size={12} className="animate-spin" /> Cargando anuncios...
                                                        </div>
                                                    ) : (
                                                        <table className="w-full text-xs text-left">
                                                            <thead className="text-zinc-500 border-b border-zinc-700/50">
                                                                <tr>
                                                                    <th className="py-2 px-2">Anuncio</th>
                                                                    <th className="py-2 px-2 text-right">Gasto</th>
                                                                    <th className="py-2 px-2 text-right">Msjs</th>
                                                                    <th className="py-2 px-2 text-right">Costo/Msj</th>
                                                                    <th className="py-2 px-2 text-right">CTR</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-zinc-700/30 text-zinc-400">
                                                                {adsData[camp.id].map(ad => (
                                                                    <tr key={ad.id} className="hover:bg-white/5">
                                                                        <td className="py-2 px-2">{ad.name}</td>
                                                                        <td className="py-2 px-2 text-right">${ad.spend.toLocaleString('es-CL')}</td>
                                                                        <td className="py-2 px-2 text-right text-zinc-200">{ad.conversations}</td>
                                                                        <td className="py-2 px-2 text-right">{ad.costPerConversation > 0 ? `$${ad.costPerConversation.toFixed(0)}` : '-'}</td>
                                                                        <td className="py-2 px-2 text-right">{ad.ctr.toFixed(2)}%</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-zinc-500">No se encontraron campañas activas con gasto en este periodo.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Daily Chart */}
            <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-xl flex flex-col h-80">
                <h3 className="text-lg font-semibold text-white mb-4">Evolución de Gasto Diario</h3>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={accountData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="shortDate" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="spend" fill="#f97316" radius={[4, 4, 0, 0]} name="Gasto ($)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon, color, highlight }) {
    return (
        <div className={`bg-surface border  rounded-xl p-5 hover:border-primary/30 transition-all ${highlight ? 'border-primary/40 bg-primary/5' : 'border-zinc-800'}`}>
            <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-medium ${highlight ? 'text-white' : 'text-zinc-400'}`}>{title}</span>
                <div className={`p-2 bg-zinc-900 rounded-lg ${color}`}>{icon}</div>
            </div>
            <div className="flex items-end gap-3">
                <span className="text-2xl font-bold text-white">{value}</span>
            </div>
        </div>
    );
}
