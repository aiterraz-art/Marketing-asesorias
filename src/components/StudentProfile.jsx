import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    ArrowLeft, User, Ruler, Weight, Target, Activity, Calendar,
    TrendingUp, TrendingDown, Minus, Apple, Dumbbell, ChevronDown,
    ChevronUp, Plus, Loader2, Edit3, Check, X, Scale, Flame,
    Beef, Droplets, Wheat, BarChart3, ClipboardList, Heart, Download, Sparkles,
    Video, Clock, Pill
} from 'lucide-react';
import {
    getStudentPlans, getStudentMeasurements, addStudentMeasurement,
    updateStudentData, getStudentSessions, addStudentSession
} from '../lib/supabase';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, Legend
} from 'recharts';
import NutritionAssistant from './NutritionAssistant';

const GOAL_LABELS = { cut: 'Definición', bulk: 'Volumen', maintenance: 'Mantenimiento', recomp: 'Recomposición' };
const ACTIVITY_LABELS = { 1.2: 'Sedentario', 1.375: 'Ligero', 1.55: 'Moderado', 1.725: 'Intenso', 1.9: 'Muy Intenso' };

const StudentProfile = ({ student, onBack, onStudentUpdated }) => {
    const [plans, setPlans] = useState([]);
    const [measurements, setMeasurements] = useState([]);
    const [sessions, setSessions] = useState([]);
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
    const [newWaist, setNewWaist] = useState('');
    const [newHip, setNewHip] = useState('');
    const [newPhoto, setNewPhoto] = useState(null);
    const [isSavingMeasure, setIsSavingMeasure] = useState(false);
    const [nextVideoCall, setNextVideoCall] = useState(student.next_videocall_date ? new Date(student.next_videocall_date).toISOString().slice(0, 16) : '');

    useEffect(() => {
        if (student) loadData();
    }, [student]);

    const loadData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                getStudentPlans(student.id),
                getStudentMeasurements(student.id),
                getStudentSessions(student.id)
            ]);

            const [plansResult, measurementsResult, sessionsResult] = results;

            if (plansResult.status === 'fulfilled') {
                setPlans(plansResult.value || []);
                console.log("Plans loaded:", plansResult.value);
            } else {
                console.error("Error loading plans:", plansResult.reason);
            }

            if (measurementsResult.status === 'fulfilled') {
                setMeasurements(measurementsResult.value || []);
            } else {
                console.error("Error loading measurements:", measurementsResult.reason);
            }

            if (sessionsResult.status === 'fulfilled') {
                setSessions(sessionsResult.value || []);
            } else {
                // Si falla sessions (probablemente tabla no existe), no romper el resto
                console.warn("Could not load sessions (table might be missing):", sessionsResult.reason);
                setSessions([]);
            }
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
    const nutritionPlans = plans; // DEBUG MODE: Mostrar TODOS los planes
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
            goal: student.goal || 'maintenance',
            last_payment_date: student.last_payment_date || '',
            last_routine_date: student.last_routine_date || ''
        });
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        try {
            // Limpiar datos para evitar errores de casting en PostgreSQL (strings vacíos en columnas numéricas/fecha)
            const cleanData = { ...editData };

            // Convertir a número o null si está vacío
            const numericFields = ['age', 'weight', 'height', 'body_fat_pct', 'activity_level'];
            numericFields.forEach(field => {
                if (cleanData[field] === '' || cleanData[field] === undefined) {
                    cleanData[field] = null;
                } else {
                    cleanData[field] = Number(cleanData[field]);
                }
            });

            // Fechas vacías a null
            const dateFields = ['last_payment_date', 'last_routine_date'];
            dateFields.forEach(field => {
                if (cleanData[field] === '') cleanData[field] = null;
            });

            await updateStudentData(student.id, cleanData);
            setIsEditing(false);
            if (onStudentUpdated) onStudentUpdated();
        } catch (err) {
            console.error("Error updating student:", err);
            alert(`Error al actualizar el alumno: ${err.message || 'Error desconocido'}`);
        }
    };

    const handleAddMeasurement = async () => {
        if (!newWeight) return;
        setIsSavingMeasure(true);
        try {
            await addStudentMeasurement({
                student_id: student.id,
                weight: parseFloat(newWeight),
                body_fat_pct: newFat ? parseFloat(newFat) : null,
                waist_cm: newWaist ? parseFloat(newWaist) : null,
                hip_cm: newHip ? parseFloat(newHip) : null,
                photo_url: newPhoto // Simplificado, idealmente subir a Storage
            });

            // Lógica de decremento de controles
            if (student.remaining_checks > 0) {
                const nextCheckDate = new Date();
                nextCheckDate.setDate(nextCheckDate.getDate() + 7);

                await updateStudentData(student.id, {
                    remaining_checks: student.remaining_checks - 1,
                    next_checkin_date: student.remaining_checks > 1 ? nextCheckDate.toISOString().split('T')[0] : null
                });
            }

            setNewWeight('');
            setNewFat('');
            setNewWaist('');
            setNewHip('');
            setNewPhoto(null);
            setShowAddMeasure(false);
            await loadData();
            if (onStudentUpdated) onStudentUpdated();
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
        { id: 'nutrition', label: 'Planes Nutri', icon: <Apple size={16} /> },
        { id: 'training', label: 'Entrenamientos', icon: <Dumbbell size={16} /> },
        { id: 'measures', label: 'Progresos', icon: <Scale size={16} /> },
        { id: 'ai_nutrition', label: 'Asistente Pro', icon: <Sparkles size={16} /> },
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
                            <div className="flex items-center gap-3">
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

                                {!isEditing && (
                                    <div className="flex gap-2">
                                        {/* Días de Plan Restantes */}
                                        {student.next_payment_date && (
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${(() => {
                                                const now = new Date();
                                                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                                return student.next_payment_date > todayStr;
                                            })()
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                <Clock size={10} />
                                                {(() => {
                                                    const now = new Date();
                                                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                                    const diffDays = Math.ceil((new Date(student.next_payment_date) - new Date(todayStr)) / (1000 * 60 * 60 * 24));
                                                    return diffDays > 0 ? `${diffDays} Días de Plan` : 'Plan Vencido';
                                                })()}
                                            </span>
                                        )}
                                        {/* Controles Pendientes */}
                                        {(student.remaining_checks > 0) && (
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                                <Activity size={10} />
                                                {student.remaining_checks} Controles Pendientes
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
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
                        nutritionPlans.map((plan) => {
                            // Encontrar el índice original en 'plans' para el número de versión global
                            const globalIndex = plans.findIndex(p => p.id === plan.id);
                            const version = plans.length - globalIndex;
                            return (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    type="nutrition"
                                    versionNumber={version}
                                    isExpanded={expandedPlan === `n-${plan.id}`}
                                    onToggle={() => setExpandedPlan(expandedPlan === `n-${plan.id}` ? null : `n-${plan.id}`)}
                                    studentName={student.full_name}
                                />
                            );
                        })
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
                        plans.filter(p => p.training_plan_text).map((plan) => {
                            const globalIndex = plans.findIndex(p => p.id === plan.id);
                            const version = plans.length - globalIndex;
                            return (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    type="training"
                                    versionNumber={version}
                                    isExpanded={expandedPlan === `t-${plan.id}`}
                                    onToggle={() => setExpandedPlan(expandedPlan === `t-${plan.id}` ? null : `t-${plan.id}`)}
                                    studentName={student.full_name}
                                />
                            );
                        })
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
                            <div className="flex-1 space-y-1 w-full">
                                <label className="text-[10px] text-zinc-600 uppercase font-bold">Cintura (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={newWaist}
                                    onChange={(e) => setNewWaist(e.target.value)}
                                    placeholder="85"
                                    className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary text-sm"
                                />
                            </div>
                            <div className="flex-1 space-y-1 w-full">
                                <label className="text-[10px] text-zinc-600 uppercase font-bold">Cadera (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={newHip}
                                    onChange={(e) => setNewHip(e.target.value)}
                                    placeholder="95"
                                    className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary text-sm"
                                />
                            </div>
                            <div className="flex-1 space-y-1 w-full">
                                <label className="text-[10px] text-zinc-600 uppercase font-bold">Foto de Progreso</label>
                                <input
                                    type="file"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setNewPhoto(reader.result);
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-zinc-500 file:bg-zinc-800 file:border-none file:text-white file:px-2 file:py-1 file:rounded file:mr-2"
                                />
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

            {/* ─── AI Nutrition Assistant Section ─── */}
            {activeSection === 'ai_nutrition' && (
                <NutritionAssistant
                    selectedStudent={student}
                    latestPlan={plans[0]}
                    onPlanSaved={onStudentUpdated}
                />
            )}

            {/* ─── Administrative Section ─── */}
            {activeSection === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Payment Control Card */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col space-y-6">
                        <div className="flex items-center gap-3 text-emerald-400">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Scale size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">Gestión de Pagos</h4>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Estado Administrativo</p>
                            </div>
                        </div>

                        <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500">Último Pago</span>
                                <span className="text-white font-medium">{student.last_payment_date ? new Date(student.last_payment_date).toLocaleDateString() : 'Ninguno'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500">Próximo Pago</span>
                                <span className={`font-bold ${new Date(student.next_payment_date) < new Date() ? 'text-red-500' : 'text-emerald-400'}`}>
                                    {student.next_payment_date ? new Date(student.next_payment_date).toLocaleDateString() : 'Pendiente'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={async () => {
                                const today = new Date();
                                const nextMonth = new Date();
                                nextMonth.setMonth(today.getMonth() + 1);
                                await updateStudentData(student.id, {
                                    last_payment_date: today.toISOString().split('T')[0],
                                    next_payment_date: nextMonth.toISOString().split('T')[0]
                                });
                                if (onStudentUpdated) onStudentUpdated();
                            }}
                            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-sm transition-all border border-zinc-700 flex items-center justify-center gap-2"
                        >
                            <Check size={16} className="text-emerald-400" />
                            Registrar Pago Hoy
                        </button>
                    </div>

                    {/* Video Call Session Card */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col space-y-6 md:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3 text-blue-400">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Video size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">Sesiones de Video</h4>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Programación de Citas</p>
                            </div>
                        </div>

                        <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 space-y-4">
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Programar Siguiente Sesión</label>
                                <div className="flex gap-2">
                                    <input
                                        type="datetime-local"
                                        value={nextVideoCall}
                                        onChange={(e) => setNextVideoCall(e.target.value)}
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:border-primary outline-none transition-colors"
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!nextVideoCall) return;
                                            try {
                                                await updateStudentData(student.id, {
                                                    next_videocall_date: new Date(nextVideoCall).toISOString()
                                                });
                                                if (onStudentUpdated) onStudentUpdated();
                                                alert("Sesión programada con éxito");
                                            } catch (err) {
                                                console.error("Error scheduling videocall:", err);
                                                alert("Error al programar la sesión");
                                            }
                                        }}
                                        className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                                    >
                                        <Check size={16} /> Agendar
                                    </button>
                                </div>
                            </div>

                            {student.next_videocall_date && (
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase">
                                            <Clock size={14} /> Cita Pendiente
                                        </div>
                                        <div className="text-white font-bold text-sm">
                                            {new Date(student.next_videocall_date).toLocaleString('es-CL', {
                                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                if (!confirm("¿Marcar esta sesión como realizada?")) return;
                                                try {
                                                    await addStudentSession({
                                                        student_id: student.id,
                                                        session_date: student.next_videocall_date,
                                                        session_type: sessions.length === 0 ? 'initial' : 'follow_up',
                                                        notes: 'Sesión completada desde el panel'
                                                    });
                                                    await updateStudentData(student.id, {
                                                        next_videocall_date: null
                                                    });
                                                    setNextVideoCall('');
                                                    await loadData();
                                                    if (onStudentUpdated) onStudentUpdated();
                                                } catch (err) {
                                                    console.error("Error completing session:", err);
                                                    alert("Error al completar la sesión");
                                                }
                                            }}
                                            className="flex-1 py-2 bg-emerald-500 text-white rounded-lg font-bold text-xs hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <Check size={14} /> Marcar Realizada
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Session History Mini List */}
                        {sessions.length > 0 && (
                            <div className="space-y-2 mt-2">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1">Historial de Sesiones</p>
                                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                    {sessions.map(s => (
                                        <div key={s.id} className="bg-black/20 border border-zinc-800/50 rounded-lg p-2 flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${s.session_type === 'initial' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                                <span className="text-zinc-300 font-medium">
                                                    {s.session_type === 'initial' ? 'Sesión Inicial' : 'Seguimiento'}
                                                </span>
                                            </div>
                                            <span className="text-zinc-500">
                                                {new Date(s.session_date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-[10px] text-zinc-500 italic">
                            * Al agendar, la sesión aparecerá automáticamente en el Calendario Maestro.
                        </div>
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

const PlanCard = ({ plan, type, isExpanded, onToggle, studentName, versionNumber }) => {
    const isNutrition = type === 'nutrition';
    const content = isNutrition
        ? (plan.nutrition_plan_text || plan.supplementation_plan_text)
        : plan.training_plan_text;
    const contentRef = useRef(null);

    const handleExportPDF = (e) => {
        e.stopPropagation();
        const element = contentRef.current;
        if (!element) return;

        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Plan_${isNutrition ? 'Nutricion' : 'Entrenamiento'}_${studentName.replace(/\s+/g, '_')}_${new Date(plan.created_at).toLocaleDateString()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true, width: 680 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        import('html2pdf.js').then(html2pdf => {
            html2pdf.default().set(opt).from(element).save();
        });
    };

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
                        <div className="flex items-center gap-2">
                            <p className="text-white font-bold text-sm">
                                {new Date(plan.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                            <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded font-black uppercase">
                                VERSIÓN {versionNumber}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wider">
                            <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(plan.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {(plan.calories > 0 || plan.protein_g > 0 || plan.fat_g > 0 || plan.carbs_g > 0) && (
                                <>
                                    <span>{plan.calories} kcal</span>
                                    <span>P: {plan.protein_g}g</span>
                                    <span>G: {plan.fat_g}g</span>
                                    <span>C: {plan.carbs_g}g</span>
                                </>
                            )}
                            <span className="capitalize px-1.5 py-0.5 bg-zinc-900 rounded text-[10px]">
                                {GOAL_LABELS[plan.goal] || plan.goal}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {content && (
                        <button
                            onClick={handleExportPDF}
                            className="p-2 text-zinc-500 hover:text-white transition-colors"
                            title="Descargar PDF"
                        >
                            <Download size={18} />
                        </button>
                    )}
                    {isExpanded ? <ChevronUp size={18} className="text-zinc-500" /> : <ChevronDown size={18} className="text-zinc-500" />}
                </div>
            </button>
            {isExpanded && (plan.nutrition_plan_text || plan.supplementation_plan_text || plan.training_plan_text) && (
                <div className="border-t border-zinc-900 p-6 bg-black/30 animate-in slide-in-from-top-2 duration-300 space-y-6">
                    <div ref={contentRef} className="space-y-6">
                        {isNutrition && plan.nutrition_plan_text && (
                            <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed bg-black/20 p-4 rounded-lg border border-zinc-800/50">
                                <div className="flex items-center gap-2 mb-4 text-primary uppercase text-[10px] font-black tracking-widest border-b border-primary/20 pb-2">
                                    <Apple size={12} /> Plan de Alimentación
                                </div>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan.nutrition_plan_text}</ReactMarkdown>
                            </div>
                        )}

                        {isNutrition && plan.supplementation_plan_text && (
                            <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/20">
                                <div className="flex items-center gap-2 mb-4 text-emerald-400 uppercase text-[10px] font-black tracking-widest border-b border-emerald-500/20 pb-2">
                                    <Pill size={12} /> Protocolo de Suplementación
                                </div>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan.supplementation_plan_text}</ReactMarkdown>
                            </div>
                        )}

                        {!isNutrition && plan.training_plan_text && (
                            <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed bg-black/20 p-4 rounded-lg border border-zinc-800/50">
                                <div className="flex items-center gap-2 mb-4 text-blue-400 uppercase text-[10px] font-black tracking-widest border-b border-blue-400/20 pb-2">
                                    <Dumbbell size={12} /> Plan de Entrenamiento
                                </div>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan.training_plan_text}</ReactMarkdown>
                            </div>
                        )}
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
