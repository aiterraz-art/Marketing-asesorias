import React, { useState, useEffect } from 'react';
import { X, BarChart3, Table2, TrendingUp, TrendingDown, Minus, Calendar, Loader2, Dumbbell, Apple } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getStudentPlans, getStudentMeasurements } from '../lib/supabase';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const StudentHistory = ({ student, isOpen, onClose }) => {
    const [plans, setPlans] = useState([]);
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'table'
    const [expandedPlan, setExpandedPlan] = useState(null);

    useEffect(() => {
        if (isOpen && student) {
            loadHistory();
        }
    }, [isOpen, student]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const [plansData, measurementsData] = await Promise.all([
                getStudentPlans(student.id),
                getStudentMeasurements(student.id)
            ]);
            setPlans(plansData);
            setMeasurements(measurementsData);
        } catch (err) {
            console.error("Error loading history:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Preparar datos para gráficos
    const weightData = measurements.map(m => ({
        date: new Date(m.measured_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
        peso: parseFloat(m.weight),
        grasa: m.body_fat_pct ? parseFloat(m.body_fat_pct) : null
    }));

    const caloriesData = plans.map(p => ({
        date: new Date(p.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
        calorias: p.calories,
        proteina: p.protein_g,
        grasa: p.fat_g,
        carbs: p.carbs_g
    })).reverse();

    // Stats rápidas
    const firstWeight = measurements.length > 0 ? parseFloat(measurements[0].weight) : null;
    const lastWeight = measurements.length > 0 ? parseFloat(measurements[measurements.length - 1].weight) : null;
    const weightChange = firstWeight && lastWeight ? (lastWeight - firstWeight).toFixed(1) : null;

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload) return null;
        return (
            <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs">
                <p className="text-zinc-400 mb-1">{label}</p>
                {payload.map((entry, i) => (
                    <p key={i} style={{ color: entry.color }} className="font-medium">
                        {entry.name}: {entry.value}{entry.name === 'peso' ? 'kg' : entry.name === 'grasa' ? '%' : entry.name === 'calorias' ? ' kcal' : 'g'}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 mb-8">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                            {student.full_name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{student.full_name}</h2>
                            <p className="text-zinc-500 text-sm">
                                {student.age} años • {student.weight}kg • {student.height}cm •
                                {student.goal === 'cut' ? ' Definición' : student.goal === 'bulk' ? ' Volumen' : ' Mantenimiento'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* View mode toggle */}
                        <div className="flex bg-zinc-900 rounded-lg border border-zinc-800 p-0.5">
                            <button
                                onClick={() => setViewMode('dashboard')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'dashboard' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'}`}
                            >
                                <BarChart3 size={14} /> Dashboard
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'}`}
                            >
                                <Table2 size={14} /> Tablas
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-800">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center">
                        <Loader2 className="animate-spin text-primary mx-auto mb-3" size={32} />
                        <p className="text-zinc-500">Cargando historial...</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                                <p className="text-zinc-500 text-xs uppercase mb-1">Planes Generados</p>
                                <p className="text-2xl font-bold text-white">{plans.length}</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                                <p className="text-zinc-500 text-xs uppercase mb-1">Pesajes Registrados</p>
                                <p className="text-2xl font-bold text-white">{measurements.length}</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                                <p className="text-zinc-500 text-xs uppercase mb-1">Peso Inicial</p>
                                <p className="text-2xl font-bold text-white">{firstWeight ? `${firstWeight}kg` : '—'}</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                                <p className="text-zinc-500 text-xs uppercase mb-1">Cambio de Peso</p>
                                <div className="flex items-center gap-2">
                                    <p className={`text-2xl font-bold ${weightChange > 0 ? 'text-red-400' : weightChange < 0 ? 'text-green-400' : 'text-white'}`}>
                                        {weightChange ? `${weightChange > 0 ? '+' : ''}${weightChange}kg` : '—'}
                                    </p>
                                    {weightChange && (
                                        weightChange > 0 ? <TrendingUp size={18} className="text-red-400" /> :
                                            weightChange < 0 ? <TrendingDown size={18} className="text-green-400" /> :
                                                <Minus size={18} className="text-zinc-500" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {viewMode === 'dashboard' ? (
                            /* ============ DASHBOARD VIEW ============ */
                            <div className="space-y-6">
                                {/* Weight Chart */}
                                {weightData.length >= 2 && (
                                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                            <TrendingDown size={18} className="text-green-400" /> Evolución de Peso
                                        </h3>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <AreaChart data={weightData}>
                                                <defs>
                                                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} />
                                                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} domain={['auto', 'auto']} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area type="monotone" dataKey="peso" stroke="#7c3aed" strokeWidth={2} fill="url(#weightGrad)" name="peso" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Calories Chart */}
                                {caloriesData.length >= 2 && (
                                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                            <Apple size={18} className="text-amber-400" /> Evolución de Calorías y Macros
                                        </h3>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={caloriesData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} />
                                                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="calorias" fill="#f59e0b" name="calorias" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Macros Chart */}
                                {caloriesData.length >= 2 && (
                                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                            <Dumbbell size={18} className="text-blue-400" /> Distribución de Macronutrientes
                                        </h3>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <LineChart data={caloriesData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} />
                                                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} unit="g" />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Line type="monotone" dataKey="proteina" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} name="proteina" />
                                                <Line type="monotone" dataKey="grasa" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="grasa" />
                                                <Line type="monotone" dataKey="carbs" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="carbs" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> Proteína</span>
                                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Grasas</span>
                                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Carbohidratos</span>
                                        </div>
                                    </div>
                                )}

                                {weightData.length < 2 && caloriesData.length < 2 && (
                                    <div className="text-center py-12 text-zinc-500">
                                        <BarChart3 size={48} className="mx-auto mb-3 text-zinc-700" />
                                        <p className="font-medium text-white">No hay datos suficientes para gráficos</p>
                                        <p className="text-sm mt-1">Se necesitan al menos 2 registros de peso o 2 planes guardados.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ============ TABLE VIEW ============ */
                            <div className="space-y-6">
                                {/* Measurements Table */}
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                                    <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
                                        <TrendingDown size={16} className="text-green-400" />
                                        <h3 className="text-white font-bold text-sm">Historial de Pesajes ({measurements.length})</h3>
                                    </div>
                                    {measurements.length === 0 ? (
                                        <p className="p-6 text-center text-zinc-500 text-sm">Sin registros de peso.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                                                        <th className="text-left p-3 pl-4">Fecha</th>
                                                        <th className="text-right p-3">Peso (kg)</th>
                                                        <th className="text-right p-3">% Grasa</th>
                                                        <th className="text-right p-3 pr-4">Cambio</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {measurements.map((m, i) => {
                                                        const prev = i > 0 ? parseFloat(measurements[i - 1].weight) : null;
                                                        const current = parseFloat(m.weight);
                                                        const diff = prev ? (current - prev).toFixed(1) : null;
                                                        return (
                                                            <tr key={m.id} className="border-b border-zinc-900 hover:bg-zinc-800/30 transition-colors">
                                                                <td className="p-3 pl-4 text-zinc-300">
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar size={14} className="text-zinc-600" />
                                                                        {new Date(m.measured_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-right text-white font-mono font-medium">{m.weight}</td>
                                                                <td className="p-3 text-right text-zinc-400 font-mono">{m.body_fat_pct ? `${m.body_fat_pct}%` : '—'}</td>
                                                                <td className={`p-3 pr-4 text-right font-mono font-medium ${diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                                                                    {diff ? `${diff > 0 ? '+' : ''}${diff}` : '—'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Plans Table */}
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                                    <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
                                        <Apple size={16} className="text-amber-400" />
                                        <h3 className="text-white font-bold text-sm">Historial de Planes ({plans.length})</h3>
                                    </div>
                                    {plans.length === 0 ? (
                                        <p className="p-6 text-center text-zinc-500 text-sm">Sin planes guardados.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                                                        <th className="text-left p-3 pl-4">Fecha</th>
                                                        <th className="text-right p-3">Calorías</th>
                                                        <th className="text-right p-3">Proteína</th>
                                                        <th className="text-right p-3">Grasas</th>
                                                        <th className="text-right p-3">Carbs</th>
                                                        <th className="text-right p-3">Objetivo</th>
                                                        <th className="text-center p-3 pr-4">Detalle</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {plans.map((p) => (
                                                        <React.Fragment key={p.id}>
                                                            <tr className="border-b border-zinc-900 hover:bg-zinc-800/30 transition-colors cursor-pointer" onClick={() => setExpandedPlan(expandedPlan === p.id ? null : p.id)}>
                                                                <td className="p-3 pl-4 text-zinc-300">
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar size={14} className="text-zinc-600" />
                                                                        {new Date(p.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-right text-white font-mono font-medium">{p.calories} kcal</td>
                                                                <td className="p-3 text-right text-primary font-mono">{p.protein_g}g</td>
                                                                <td className="p-3 text-right text-amber-400 font-mono">{p.fat_g}g</td>
                                                                <td className="p-3 text-right text-blue-400 font-mono">{p.carbs_g}g</td>
                                                                <td className="p-3 text-right text-zinc-400 capitalize">{p.goal === 'cut' ? 'Definición' : p.goal === 'bulk' ? 'Volumen' : 'Mantenimiento'}</td>
                                                                <td className="p-3 pr-4 text-center">
                                                                    <button className="text-xs text-primary hover:underline">
                                                                        {expandedPlan === p.id ? 'Cerrar' : 'Ver Plan'}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                            {expandedPlan === p.id && (p.nutrition_plan_text || p.training_plan_text) && (
                                                                <tr>
                                                                    <td colSpan={7} className="p-0">
                                                                        <div className="bg-black/50 p-6 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                            {p.nutrition_plan_text && (
                                                                                <div>
                                                                                    <h4 className="text-primary text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
                                                                                        <Apple size={14} /> Plan Nutricional
                                                                                    </h4>
                                                                                    <div className="prose prose-invert prose-sm max-w-none text-zinc-300 text-xs leading-relaxed max-h-60 overflow-y-auto pr-2">
                                                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.nutrition_plan_text}</ReactMarkdown>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {p.training_plan_text && (
                                                                                <div>
                                                                                    <h4 className="text-blue-400 text-xs font-bold uppercase mb-3 flex items-center gap-1.5">
                                                                                        <Dumbbell size={14} /> Plan de Entrenamiento
                                                                                    </h4>
                                                                                    <div className="prose prose-invert prose-sm max-w-none text-zinc-300 text-xs leading-relaxed max-h-60 overflow-y-auto pr-2">
                                                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.training_plan_text}</ReactMarkdown>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {!p.nutrition_plan_text && !p.training_plan_text && (
                                                                                <p className="text-zinc-600 text-sm col-span-2 text-center py-4">Plan guardado solo con macros (sin texto generado por IA).</p>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentHistory;
