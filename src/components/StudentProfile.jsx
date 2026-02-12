import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    ArrowLeft, User, Ruler, Weight, Target, Activity, Calendar,
    TrendingUp, TrendingDown, Minus, Apple, Dumbbell, ChevronDown,
    ChevronUp, Plus, Loader2, Edit3, Check, X, Scale, Flame,
    Beef, Droplets, Wheat, BarChart3, ClipboardList, Heart
} from 'lucide-react';
import {
    getStudentPlans, getStudentMeasurements, addStudentMeasurement,
    updateStudentData
} from '../lib/supabase';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar
} from 'recharts';

const GOAL_LABELS = { cut: 'Definición', bulk: 'Volumen', maintenance: 'Mantenimiento', recomp: 'Recomposición' };
const ACTIVITY_LABELS = { 1.2: 'Sedentario', 1.375: 'Ligero', 1.55: 'Moderado', 1.725: 'Intenso', 1.9: 'Muy Intenso' };

const StudentProfile = ({ student, onBack, onStudentUpdated }) => {
    const [plans, setPlans] = useState([]);
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [expandedPlan, setExpandedPlan] = useState(null);

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});

    // Add measurement
    const [showAddMeasure, setShowAddMeasure] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [newFat, setNewFat] = useState('');
    const [isSavingMeasure, setIsSavingMeasure] = useState(false);

    useEffect(() => {
        if (student) loadData();
    }, [student]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [plansData, measurementsData] = await Promise.all([
                getStudentPlans(student.id),
                getStudentMeasurements(student.id)
            ]);
            setPlans(plansData || []);
            setMeasurements(measurementsData || []);
        } catch (err) {
            console.error("Error loading student data:", err);
        } finally {
            setLoading(false);
        }
    };

    // ─── Computed Data ───
    const weightData = measurements.map(m => ({
        date: new Date(m.measured_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
        peso: parseFloat(m.weight),
        grasa: m.body_fat_pct ? parseFloat(m.body_fat_pct) : null
    }));

    const macrosData = plans.map(p => ({
        date: new Date(p.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
        calorias: p.calories,
        proteina: p.protein_g,
        grasa: p.fat_g,
        carbs: p.carbs_g
    })).reverse();

    const firstWeight = measurements.length > 0 ? parseFloat(measurements[0].weight) : null;
    const lastWeight = measurements.length > 0 ? parseFloat(measurements[measurements.length - 1].weight) : null;
    const weightChange = firstWeight && lastWeight ? (lastWeight - firstWeight).toFixed(1) : null;
    const latestPlan = plans.length > 0 ? plans[0] : null;
    const nutritionPlans = plans.filter(p => p.nutrition_plan_text);
    const trainingPlans = plans.filter(p => p.training_plan_text);

    // ─── Handlers ───
    const handleStartEdit = () => {
        setEditData({
            full_name: student.full_name,
            age: student.age || '',
            weight: student.weight || '',
            height: student.height || '',
            body_fat_pct: student.body_fat_pct || '',
            activity_level: student.activity_level || 1.2,
            goal: student.goal || 'maintenance'
        });
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        try {
            await updateStudentData(student.id, editData);
            setIsEditing(false);
            if (onStudentUpdated) onStudentUpdated();
        } catch (err) {
            console.error("Error updating student:", err);
            alert("Error al actualizar el alumno.");
        }
    };

    const handleAddMeasurement = async () => {
        if (!newWeight) return;
        setIsSavingMeasure(true);
        try {
            await addStudentMeasurement({
                student_id: student.id,
                weight: parseFloat(newWeight),
                body_fat_pct: newFat ? parseFloat(newFat) : null
            });
            setNewWeight('');
            setNewFat('');
            setShowAddMeasure(false);
            await loadData();
        } catch (err) {
            console.error("Error adding measurement:", err);
            alert("Error al guardar la medida.");
        } finally {
            setIsSavingMeasure(false);
        }
    };

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

    // ─── Section Navigation ───
    const sections = [
        { id: 'dashboard', label: 'Resumen', icon: <BarChart3 size={16} /> },
        { id: 'nutrition', label: 'Nutrición', icon: <Apple size={16} /> },
        { id: 'training', label: 'Entrenamiento', icon: <Dumbbell size={16} /> },
        { id: 'measures', label: 'Medidas', icon: <Scale size={16} /> },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-zinc-500">Cargando ficha del alumno...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ─── Header ─── */}
            <div className="bg-surface border border-zinc-900 rounded-2xl overflow-hidden">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-primary transition-all"
                            title="Volver a la lista"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-700 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20">
                            {student.full_name.charAt(0)}
                        </div>
                        <div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editData.full_name}
                                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                    className="bg-black border border-zinc-700 rounded-lg px-3 py-1 text-white text-xl font-bold outline-none focus:border-primary"
                                />
                            ) : (
                                <h2 className="text-2xl font-bold text-white">{student.full_name}</h2>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                                <span className="flex items-center gap-1"><User size={13} /> {student.age} años</span>
                                <span className="flex items-center gap-1"><Ruler size={13} /> {student.height}cm</span>
                                <span className="flex items-center gap-1"><Weight size={13} /> {lastWeight || student.weight}kg</span>
                                <span className="flex items-center gap-1 capitalize">
                                    <Target size={13} /> {GOAL_LABELS[student.goal] || student.goal}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={handleSaveEdit} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                                    <Check size={16} /> Guardar
                                </button>
                                <button onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-sm font-medium hover:text-white transition-colors">
                                    <X size={16} /> Cancelar
                                </button>
                            </>
                        ) : (
                            <button onClick={handleStartEdit} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg text-sm font-medium hover:text-white hover:border-zinc-700 transition-all">
                                <Edit3 size={16} /> Editar Datos
                            </button>
                        )}
                    </div>
                </div>

                {/* Edit form */}
                {isEditing && (
                    <div className="px-6 pb-6 pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <EditField label="Edad" value={editData.age} onChange={(v) => setEditData({ ...editData, age: v })} type="number" />
                            <EditField label="Peso (kg)" value={editData.weight} onChange={(v) => setEditData({ ...editData, weight: v })} type="number" />
                            <EditField label="Altura (cm)" value={editData.height} onChange={(v) => setEditData({ ...editData, height: v })} type="number" />
                            <EditField label="% Grasa" value={editData.body_fat_pct} onChange={(v) => setEditData({ ...editData, body_fat_pct: v })} type="number" />
                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">Actividad</label>
                                <select
                                    value={editData.activity_level}
                                    onChange={(e) => setEditData({ ...editData, activity_level: parseFloat(e.target.value) })}
                                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white outline-none focus:border-primary"
                                >
                                    {Object.entries(ACTIVITY_LABELS).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">Objetivo</label>
                                <select
                                    value={editData.goal}
                                    onChange={(e) => setEditData({ ...editData, goal: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white outline-none focus:border-primary"
                                >
                                    {Object.entries(GOAL_LABELS).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Section Tabs ─── */}
            <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-1">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSection === s.id
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                            }`}
                    >
                        {s.icon} <span className="hidden sm:inline">{s.label}</span>
                    </button>
                ))}
            </div>

            {/* ─── Dashboard Section ─── */}
            {activeSection === 'dashboard' && (
                <div className="space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label="Peso Actual"
                            value={`${lastWeight || student.weight}kg`}
                            icon={<Weight size={18} />}
                            color="text-white"
                            bg="bg-primary/10 border-primary/20"
                        />
                        <StatCard
                            label="Cambio Total"
                            value={weightChange ? `${weightChange > 0 ? '+' : ''}${weightChange}kg` : '—'}
                            icon={weightChange > 0 ? <TrendingUp size={18} /> : weightChange < 0 ? <TrendingDown size={18} /> : <Minus size={18} />}
                            color={weightChange > 0 ? 'text-red-400' : weightChange < 0 ? 'text-emerald-400' : 'text-zinc-500'}
                            bg={weightChange > 0 ? 'bg-red-500/10 border-red-500/20' : weightChange < 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-zinc-900 border-zinc-800'}
                        />
                        <StatCard
                            label="Planes Generados"
                            value={plans.length}
                            icon={<ClipboardList size={18} />}
                            color="text-amber-400"
                            bg="bg-amber-500/10 border-amber-500/20"
                        />
                        <StatCard
                            label="Pesajes Registrados"
                            value={measurements.length}
                            icon={<Scale size={18} />}
                            color="text-blue-400"
                            bg="bg-blue-500/10 border-blue-500/20"
                        />
                    </div>

                    {/* Latest Plan Macros */}
                    {latestPlan && (
                        <div className="bg-surface border border-zinc-900 rounded-xl p-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Flame size={16} className="text-amber-400" /> Último Plan — Macros Objetivo
                            </h3>
                            <div className="grid grid-cols-4 gap-4">
                                <MacroCard label="Calorías" value={latestPlan.calories} unit="kcal" color="bg-gradient-to-br from-amber-500 to-orange-600" icon={<Flame size={16} />} />
                                <MacroCard label="Proteína" value={latestPlan.protein_g} unit="g" color="bg-gradient-to-br from-primary to-purple-700" icon={<Beef size={16} />} />
                                <MacroCard label="Grasas" value={latestPlan.fat_g} unit="g" color="bg-gradient-to-br from-amber-400 to-yellow-600" icon={<Droplets size={16} />} />
                                <MacroCard label="Carbohidratos" value={latestPlan.carbs_g} unit="g" color="bg-gradient-to-br from-blue-500 to-cyan-600" icon={<Wheat size={16} />} />
                            </div>
                        </div>
                    )}

                    {/* Weight Chart */}
                    {weightData.length >= 2 && (
                        <div className="bg-surface border border-zinc-900 rounded-xl p-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <TrendingDown size={16} className="text-emerald-400" /> Evolución de Peso
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={weightData}>
                                    <defs>
                                        <linearGradient id="spWeightGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} domain={['auto', 'auto']} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="peso" stroke="#7c3aed" strokeWidth={2} fill="url(#spWeightGrad)" name="peso" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Macros Evolution Chart */}
                    {macrosData.length >= 2 && (
                        <div className="bg-surface border border-zinc-900 rounded-xl p-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Apple size={16} className="text-amber-400" /> Evolución de Macronutrientes
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={macrosData}>
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

                    {weightData.length < 2 && macrosData.length < 2 && (
                        <div className="bg-surface border border-zinc-900 rounded-xl p-12 text-center">
                            <BarChart3 size={48} className="mx-auto mb-3 text-zinc-700" />
                            <p className="text-white font-medium">No hay datos suficientes para gráficos</p>
                            <p className="text-zinc-500 text-sm mt-1">Se necesitan al menos 2 registros de peso o 2 planes guardados.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Nutrition Plans Section ─── */}
            {activeSection === 'nutrition' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Apple size={18} className="text-primary" />
                            Planes Nutricionales ({nutritionPlans.length})
                        </h3>
                    </div>

                    {nutritionPlans.length === 0 ? (
                        <div className="bg-surface border border-zinc-900 rounded-xl p-12 text-center">
                            <Apple size={48} className="mx-auto mb-3 text-zinc-700" />
                            <p className="text-white font-medium">Sin planes nutricionales</p>
                            <p className="text-zinc-500 text-sm mt-1">Genera un plan desde la pestaña de Calculadora o Rutinas.</p>
                        </div>
                    ) : (
                        nutritionPlans.map((plan) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                type="nutrition"
                                isExpanded={expandedPlan === `n-${plan.id}`}
                                onToggle={() => setExpandedPlan(expandedPlan === `n-${plan.id}` ? null : `n-${plan.id}`)}
                            />
                        ))
                    )}
                </div>
            )}

            {/* ─── Training Plans Section ─── */}
            {activeSection === 'training' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Dumbbell size={18} className="text-blue-400" />
                            Planes de Entrenamiento ({trainingPlans.length})
                        </h3>
                    </div>

                    {trainingPlans.length === 0 ? (
                        <div className="bg-surface border border-zinc-900 rounded-xl p-12 text-center">
                            <Dumbbell size={48} className="mx-auto mb-3 text-zinc-700" />
                            <p className="text-white font-medium">Sin planes de entrenamiento</p>
                            <p className="text-zinc-500 text-sm mt-1">Genera un plan desde la pestaña de Rutinas.</p>
                        </div>
                    ) : (
                        trainingPlans.map((plan) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                type="training"
                                isExpanded={expandedPlan === `t-${plan.id}`}
                                onToggle={() => setExpandedPlan(expandedPlan === `t-${plan.id}` ? null : `t-${plan.id}`)}
                            />
                        ))
                    )}
                </div>
            )}

            {/* ─── Measurements Section ─── */}
            {activeSection === 'measures' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Scale size={18} className="text-emerald-400" />
                            Registro de Medidas ({measurements.length})
                        </h3>
                        <button
                            onClick={() => setShowAddMeasure(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                            <Plus size={16} /> Registrar Peso
                        </button>
                    </div>

                    {/* Add Measurement Inline Form */}
                    {showAddMeasure && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-end gap-3 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex-1 space-y-1 w-full">
                                <label className="text-[10px] text-zinc-600 uppercase font-bold">Peso (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={newWeight}
                                    onChange={(e) => setNewWeight(e.target.value)}
                                    placeholder="82.5"
                                    autoFocus
                                    className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary text-sm"
                                />
                            </div>
                            <div className="flex-1 space-y-1 w-full">
                                <label className="text-[10px] text-zinc-600 uppercase font-bold">% Grasa (opcional)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={newFat}
                                    onChange={(e) => setNewFat(e.target.value)}
                                    placeholder="18.5"
                                    className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary text-sm"
                                />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleAddMeasurement}
                                    disabled={!newWeight || isSavingMeasure}
                                    className="flex-1 sm:flex-none px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-1.5"
                                >
                                    {isSavingMeasure ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    Guardar
                                </button>
                                <button
                                    onClick={() => { setShowAddMeasure(false); setNewWeight(''); setNewFat(''); }}
                                    className="px-3 py-2.5 text-zinc-500 hover:text-white text-sm transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mini Weight Chart */}
                    {weightData.length >= 2 && (
                        <div className="bg-surface border border-zinc-900 rounded-xl p-6">
                            <h4 className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-4">Curva de Peso</h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={weightData}>
                                    <defs>
                                        <linearGradient id="spMeasureGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} />
                                    <YAxis tick={{ fill: '#71717a', fontSize: 10 }} domain={['auto', 'auto']} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2} fill="url(#spMeasureGrad)" name="peso" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Measurements Table */}
                    <div className="bg-surface border border-zinc-900 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-zinc-900 bg-zinc-900/20">
                            <h4 className="text-white font-bold text-sm">Historial Completo</h4>
                        </div>
                        {measurements.length === 0 ? (
                            <p className="p-8 text-center text-zinc-500 text-sm">Sin registros de peso. Usa el botón "Registrar Peso" para comenzar.</p>
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
                                        {[...measurements].reverse().map((m, i, arr) => {
                                            const nextIdx = i < arr.length - 1 ? i + 1 : null;
                                            const current = parseFloat(m.weight);
                                            const prev = nextIdx !== null ? parseFloat(arr[nextIdx].weight) : null;
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
                                                    <td className={`p-3 pr-4 text-right font-mono font-medium ${diff > 0 ? 'text-red-400' : diff < 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
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
                </div>
            )}
        </div>
    );
};

// ─── Sub-components ───

const StatCard = ({ label, value, icon, color, bg }) => (
    <div className={`border rounded-xl p-4 ${bg}`}>
        <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider">{label}</span>
            <span className={color}>{icon}</span>
        </div>
        <p className={`text-2xl font-bold ${color === 'text-white' ? 'text-white' : color}`}>{value}</p>
    </div>
);

const MacroCard = ({ label, value, unit, color, icon }) => (
    <div className={`${color} rounded-xl p-4 text-white text-center`}>
        <div className="flex items-center justify-center gap-1.5 mb-1 opacity-80 text-xs uppercase font-bold tracking-wider">
            {icon} {label}
        </div>
        <p className="text-2xl font-black">{value}<span className="text-sm font-normal ml-0.5 opacity-80">{unit}</span></p>
    </div>
);

const EditField = ({ label, value, onChange, type = 'text' }) => (
    <div className="space-y-1">
        <label className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || '' : e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white outline-none focus:border-primary transition-colors"
        />
    </div>
);

const PlanCard = ({ plan, type, isExpanded, onToggle }) => {
    const content = type === 'nutrition' ? plan.nutrition_plan_text : plan.training_plan_text;
    const isNutrition = type === 'nutrition';

    return (
        <div className="bg-surface border border-zinc-900 rounded-xl overflow-hidden transition-all">
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-zinc-900/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isNutrition ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-400'}`}>
                        {isNutrition ? <Apple size={18} /> : <Dumbbell size={18} />}
                    </div>
                    <div className="text-left">
                        <p className="text-white font-medium text-sm">
                            {new Date(plan.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                            <span>{plan.calories} kcal</span>
                            <span>P: {plan.protein_g}g</span>
                            <span>G: {plan.fat_g}g</span>
                            <span>C: {plan.carbs_g}g</span>
                            <span className="capitalize px-1.5 py-0.5 bg-zinc-900 rounded text-[10px]">
                                {GOAL_LABELS[plan.goal] || plan.goal}
                            </span>
                        </div>
                    </div>
                </div>
                {isExpanded ? <ChevronUp size={18} className="text-zinc-500" /> : <ChevronDown size={18} className="text-zinc-500" />}
            </button>
            {isExpanded && content && (
                <div className="border-t border-zinc-900 p-6 bg-black/30 animate-in slide-in-from-top-2 duration-300">
                    <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                </div>
            )}
            {isExpanded && !content && (
                <div className="border-t border-zinc-900 p-6 text-center text-zinc-600 text-sm">
                    Este plan fue guardado solo con macros (sin texto generado por IA).
                </div>
            )}
        </div>
    );
};

export default StudentProfile;
