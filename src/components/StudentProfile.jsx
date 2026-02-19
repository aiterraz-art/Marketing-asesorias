import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';
import {
    ArrowLeft, User, Ruler, Weight, Target, Activity, Calendar,
    TrendingUp, TrendingDown, Minus, Apple, Dumbbell, ChevronDown,
    ChevronUp, Plus, Loader2, Edit3, Check, X, Scale, Flame,
    Beef, Droplets, Wheat, BarChart3, ClipboardList, Heart, Download, Sparkles,
    Video, Clock, Pill, Trash2, Camera, ZoomIn, Image, Eye, Upload
} from 'lucide-react';
import {
    getStudentPlans, getStudentMeasurements, addStudentMeasurement,
    updateStudentData, getStudentSessions, addStudentSession, deleteStudentPlan,
    getStudentPhotos, addStudentPhoto, deleteStudentPhoto, uploadPhoto,
    getStudentTasks, addStudentTask, updateStudentTask, deleteStudentTask,
    getFoods, updateStudentPlan
} from '../lib/supabase';
import { analyzeBodyComposition } from '../lib/openai';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, Legend
} from 'recharts';
import NutritionAssistant from './NutritionAssistant';
import VisualPlanEditor from './VisualPlanEditor';
import PortionReference from './PortionReference';

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

    // Photo Gallery
    const [photos, setPhotos] = useState([]);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [photoFiles, setPhotoFiles] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const photoInputRef = useRef(null);
    const [nextVideoCall, setNextVideoCall] = useState(student.next_videocall_date ? new Date(student.next_videocall_date).toISOString().slice(0, 16) : '');

    // Agenda / Tasks
    const [tasks, setTasks] = useState([]);
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        type: 'checkin', // checkin, payment, video_call, other
        due_date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [isSavingTask, setIsSavingTask] = useState(false);

    // Foods for Calculator
    const [foods, setFoods] = useState([]);


    useEffect(() => {
        if (student) loadData();
    }, [student]);

    const loadData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                getStudentPlans(student.id),
                getStudentMeasurements(student.id),
                getStudentSessions(student.id),
                getStudentPhotos(student.id),
                getStudentTasks(student.id),
                getFoods()
            ]);

            const [plansResult, measurementsResult, sessionsResult, photosResult, tasksResult, foodsResult] = results;

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
                console.warn("Could not load sessions (table might be missing):", sessionsResult.reason);
                setSessions([]);
            }

            if (photosResult.status === 'fulfilled') {
                setPhotos(photosResult.value || []);
            } else {
                console.warn("Could not load photos (table might be missing):", photosResult.reason);
                setPhotos([]);
            }

            if (tasksResult.status === 'fulfilled') {
                setTasks(tasksResult.value || []);
            } else {
                console.warn("Could not load tasks (table might be missing):", tasksResult.reason);
                setTasks([]);
            }

            if (foodsResult.status === 'fulfilled') {
                setFoods(foodsResult.value || []);
            } else {
                console.warn("Could not load foods:", foodsResult.reason);
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

    const handleDeletePlan = async (planId) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este plan? Esta acción no se puede deshacer.')) return;

        try {
            await deleteStudentPlan(planId);
            await loadData();
            // Si el plan eliminado era el expandido, colapsarlo
            if (expandedPlan === `n-${planId}` || expandedPlan === `t-${planId}`) {
                setExpandedPlan(null);
            }

            // Sincronizar con el dashboard principal
            if (onStudentUpdated) await onStudentUpdated();

            alert("Plan eliminado correctamente.");
        } catch (err) {
            console.error("Error deleting plan:", err);
            alert("Error al eliminar el plan.");
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
    const CATEGORY_LABELS = { front: 'Frontal', side: 'Lateral', back: 'Espalda' };
    const CATEGORY_COLORS = { front: 'bg-blue-500/20 text-blue-400', side: 'bg-amber-500/20 text-amber-400', back: 'bg-emerald-500/20 text-emerald-400' };

    const handlePhotoUpload = async () => {
        if (photoFiles.length === 0) return;
        setIsUploadingPhoto(true);
        setUploadProgress({ current: 0, total: photoFiles.length });
        try {
            for (let i = 0; i < photoFiles.length; i++) {
                const file = photoFiles[i];
                setUploadProgress({ current: i + 1, total: photoFiles.length });
                setIsAnalyzing(true);

                // 1. Subir foto a Supabase Storage
                const publicUrl = await uploadPhoto(file);

                // 2. Leer como base64 para análisis IA
                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });

                // 3. Analizar con IA (detecta categoría automáticamente)
                let aiAnalysis = null;
                try {
                    aiAnalysis = await analyzeBodyComposition(base64, student, photos);
                } catch (aiErr) {
                    console.error(`AI analysis failed for file ${i + 1}:`, aiErr);
                    aiAnalysis = { error: 'El análisis IA no pudo completarse. La foto se guardó correctamente.', detected_category: 'front' };
                }
                setIsAnalyzing(false);

                // 4. Guardar registro con categoría detectada por IA
                const detectedCat = aiAnalysis?.detected_category || 'front';
                await addStudentPhoto({
                    student_id: student.id,
                    photo_url: publicUrl,
                    category: detectedCat,
                    ai_analysis: aiAnalysis,
                    notes: ''
                });
            }

            // 5. Limpiar y recargar
            setPhotoFiles([]);
            setPhotoPreviews([]);
            await loadData();
        } catch (err) {
            console.error('Error uploading photos:', err);
            alert(`Error al subir fotos: ${err.message}`);
        } finally {
            setIsUploadingPhoto(false);
            setIsAnalyzing(false);
            setUploadProgress({ current: 0, total: 0 });
        }
    };

    const handleDeletePhoto = async (photo) => {
        if (!confirm('¿Eliminar esta foto y su análisis? Esta acción no se puede deshacer.')) return;
        try {
            await deleteStudentPhoto(photo.id, photo.photo_url);
            setSelectedPhoto(null);
            await loadData();
        } catch (err) {
            console.error('Error deleting photo:', err);
            alert('Error al eliminar la foto.');
        }
    };

    const handleAddTask = async () => {
        if (!newTask.title || !newTask.due_date) return;
        setIsSavingTask(true);
        try {
            await addStudentTask({
                student_id: student.id,
                ...newTask
            });
            setShowAddTask(false);
            setNewTask({
                title: '',
                type: 'checkin',
                due_date: new Date().toISOString().split('T')[0],
                notes: ''
            });
            await loadData();
        } catch (err) {
            console.error("Error adding task:", err);
            alert("Error al guardar la tarea");
        } finally {
            setIsSavingTask(false);
        }
    };

    const handleToggleTask = async (task) => {
        try {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

            await updateStudentTask(task.id, {
                status: newStatus,
                completed_at: completedAt
            });
            await loadData();
        } catch (err) {
            console.error("Error toggling task:", err);
            alert("Error al actualizar tarea");
        }
    };

    const handleDeleteTask = async (id) => {
        if (!confirm('¿Eliminar esta tarea?')) return;
        try {
            await deleteStudentTask(id);
            await loadData();
        } catch (err) {
            console.error("Error deleting task:", err);
            alert("Error al eliminar tarea");
        }
    };

    const sections = [
        { id: 'dashboard', label: 'Resumen', icon: <BarChart3 size={16} /> },
        { id: 'nutrition', label: 'Planes Nutri', icon: <Apple size={16} /> },
        { id: 'training', label: 'Entrenamientos', icon: <Dumbbell size={16} /> },
        { id: 'measures', label: 'Progresos', icon: <Scale size={16} /> },
        { id: 'gallery', label: 'Galería', icon: <Camera size={16} /> },
        { id: 'calendar', label: 'Agenda', icon: <Calendar size={16} /> },
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
                                    onDelete={() => handleDeletePlan(plan.id)}
                                />
                            );
                        })
                    )}
                </div>
            )}

            {/* ─── Calendar / Agenda Section ─── */}
            {activeSection === 'calendar' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Calendar size={18} className="text-purple-400" />
                            Agenda y Tareas ({tasks.filter(t => t.status !== 'completed').length} Pendientes)
                        </h3>
                        <button
                            onClick={() => setShowAddTask(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                            <Plus size={16} /> Nueva Tarea
                        </button>
                    </div>

                    {showAddTask && (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 animate-in slide-in-from-top-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Título</label>
                                    <input
                                        type="text"
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="Ej: Pago Mensualidad, Control Semanal..."
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Tipo</label>
                                    <select
                                        value={newTask.type}
                                        onChange={e => setNewTask({ ...newTask, type: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm outline-none focus:border-primary"
                                    >
                                        <option value="payment">💰 Pago</option>
                                        <option value="checkin">⚖️ Control</option>
                                        <option value="video_call">📹 Videollamada</option>
                                        <option value="other">📝 Otro</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Fecha Vencimiento</label>
                                    <input
                                        type="date"
                                        value={newTask.due_date}
                                        onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Notas (Opcional)</label>
                                    <input
                                        type="text"
                                        value={newTask.notes}
                                        onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
                                        placeholder="Detalles adicionales..."
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowAddTask(false)} className="px-3 py-2 text-zinc-400 hover:text-white text-sm">Cancelar</button>
                                <button
                                    onClick={handleAddTask}
                                    disabled={isSavingTask || !newTask.title}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSavingTask && <Loader2 size={14} className="animate-spin" />}
                                    Guardar Tarea
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-surface border border-zinc-900 rounded-xl overflow-hidden">
                        {/* Pending Tasks */}
                        <div className="p-4 bg-zinc-900/40 border-b border-zinc-900">
                            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Pendientes</h4>
                        </div>
                        <div className="divide-y divide-zinc-900">
                            {tasks.filter(t => t.status !== 'completed').length === 0 && (
                                <p className="p-8 text-center text-zinc-500 text-sm">No hay tareas pendientes. ¡Todo al día!</p>
                            )}
                            {tasks.filter(t => t.status !== 'completed').map(task => (
                                <div key={task.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/20 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handleToggleTask(task)}
                                            className="w-6 h-6 rounded-full border-2 border-zinc-600 hover:border-primary hover:bg-primary/20 transition-all flex items-center justify-center group-hover:scale-110"
                                            title="Marcar como completada"
                                        >
                                            <div className="w-0 h-0 bg-primary rounded-full transition-all" />
                                        </button>
                                        <div>
                                            <p className="text-white font-medium flex items-center gap-2">
                                                {task.type === 'payment' && '💰'}
                                                {task.type === 'checkin' && '⚖️'}
                                                {task.type === 'video_call' && '📹'}
                                                {task.type === 'other' && '📝'}
                                                {task.title}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                Vence: {new Date(task.due_date).toLocaleDateString()}
                                                {task.notes && <span className="ml-2">• {task.notes}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteTask(task.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Completed Tasks History */}
                        {tasks.filter(t => t.status === 'completed').length > 0 && (
                            <>
                                <div className="p-4 bg-zinc-900/40 border-y border-zinc-900 mt-4">
                                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Historial Completado</h4>
                                </div>
                                <div className="divide-y divide-zinc-900 opacity-60">
                                    {tasks.filter(t => t.status === 'completed').map(task => (
                                        <div key={task.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/20 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => handleToggleTask(task)}
                                                    className="w-6 h-6 rounded-full bg-primary border-2 border-primary flex items-center justify-center text-white"
                                                    title="Marcar como pendiente"
                                                >
                                                    <Check size={12} />
                                                </button>
                                                <div>
                                                    <p className="text-zinc-400 line-through font-medium flex items-center gap-2">
                                                        {task.title}
                                                    </p>
                                                    <p className="text-xs text-zinc-600">
                                                        Completado: {new Date(task.completed_at || task.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteTask(task.id)} className="text-zinc-600 hover:text-red-400">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
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
                                    onDelete={() => handleDeletePlan(plan.id)}
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

            {/* ─── Photo Gallery Section ─── */}
            {activeSection === 'gallery' && (
                <div className="space-y-6">
                    {/* Upload Zone */}
                    <div className="bg-surface border border-zinc-900 rounded-2xl p-6">
                        <h3 className="text-white font-bold flex items-center gap-2 mb-1">
                            <Camera size={18} className="text-primary" />
                            Subir Fotos de Progreso
                        </h3>
                        <p className="text-zinc-600 text-xs mb-4">Selecciona una o varias fotos. La IA detectará automáticamente si es frontal, lateral o espalda.</p>

                        <div className="flex flex-col gap-4">
                            {/* Drop Zone */}
                            <div
                                onClick={() => photoInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
                                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary'); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-primary');
                                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                                    if (files.length > 0) {
                                        setPhotoFiles(prev => [...prev, ...files]);
                                        files.forEach(file => {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setPhotoPreviews(prev => [...prev, reader.result]);
                                            reader.readAsDataURL(file);
                                        });
                                    }
                                }}
                                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${photoPreviews.length > 0 ? 'border-primary/40 bg-primary/5' : 'border-zinc-800'
                                    }`}
                            >
                                {photoPreviews.length > 0 ? (
                                    <div className="w-full">
                                        <div className="flex flex-wrap gap-3 justify-center">
                                            {photoPreviews.map((prev, idx) => (
                                                <div key={idx} className="relative group">
                                                    <img src={prev} alt={`Preview ${idx + 1}`} className="h-24 w-20 rounded-lg object-cover border border-zinc-700" />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPhotoFiles(pf => pf.filter((_, i) => i !== idx));
                                                            setPhotoPreviews(pp => pp.filter((_, i) => i !== idx));
                                                        }}
                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                    <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[8px] text-zinc-300 font-mono">{idx + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-center text-zinc-500 text-xs mt-3">Haz clic para agregar más fotos</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={32} className="text-zinc-600 mb-2" />
                                        <p className="text-zinc-500 text-sm text-center">Arrastra fotos aquí o haz clic para seleccionar</p>
                                        <p className="text-zinc-700 text-xs mt-1">JPG, PNG — Puedes seleccionar varias a la vez</p>
                                    </>
                                )}
                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
                                        if (files.length > 0) {
                                            setPhotoFiles(prev => [...prev, ...files]);
                                            files.forEach(file => {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setPhotoPreviews(prev => [...prev, reader.result]);
                                                reader.readAsDataURL(file);
                                            });
                                        }
                                        e.target.value = '';
                                    }}
                                />
                            </div>

                            {/* Action bar */}
                            {photoFiles.length > 0 && (
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-400 text-xs">{photoFiles.length} foto{photoFiles.length > 1 ? 's' : ''} seleccionada{photoFiles.length > 1 ? 's' : ''}</span>
                                        <button
                                            onClick={() => { setPhotoFiles([]); setPhotoPreviews([]); }}
                                            className="text-zinc-600 text-xs hover:text-white transition-colors flex items-center gap-1"
                                        >
                                            <X size={12} /> Limpiar
                                        </button>
                                    </div>
                                    <button
                                        onClick={handlePhotoUpload}
                                        disabled={isUploadingPhoto}
                                        className="py-2.5 px-6 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                    >
                                        {isUploadingPhoto ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                {isAnalyzing
                                                    ? `Analizando ${uploadProgress.current}/${uploadProgress.total}...`
                                                    : `Subiendo ${uploadProgress.current}/${uploadProgress.total}...`
                                                }
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={16} />
                                                Subir y Analizar ({photoFiles.length})
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Photo Timeline Grid */}
                    {photos.length === 0 ? (
                        <div className="bg-surface border border-zinc-900 rounded-xl p-12 text-center">
                            <Image size={48} className="mx-auto mb-3 text-zinc-700" />
                            <p className="text-white font-medium">Sin fotos de progreso</p>
                            <p className="text-zinc-500 text-sm mt-1">Sube la primera foto para comenzar a rastrear el avance visual.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Image size={18} className="text-primary" />
                                Timeline de Progreso ({photos.length} fotos)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {photos.map((photo) => {
                                    const analysis = photo.ai_analysis;
                                    const fatPct = analysis?.body_fat_estimated;
                                    return (
                                        <div
                                            key={photo.id}
                                            onClick={() => setSelectedPhoto(photo)}
                                            className="group relative bg-surface border border-zinc-900 rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all"
                                        >
                                            <div className="aspect-[3/4] overflow-hidden">
                                                <img
                                                    src={photo.photo_url}
                                                    alt={`Progreso ${photo.category}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            {/* Overlay badges */}
                                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${CATEGORY_COLORS[photo.category] || 'bg-zinc-800 text-zinc-400'}`}>
                                                    {CATEGORY_LABELS[photo.category] || photo.category}
                                                </span>
                                                {fatPct && (
                                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-black/70 text-white backdrop-blur-sm">
                                                        🔥 {fatPct}% grasa
                                                    </span>
                                                )}
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center">
                                                    <ZoomIn size={14} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <p className="text-zinc-500 text-[10px] font-medium">
                                                    {new Date(photo.photo_date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                                {analysis?.muscle_quality && (
                                                    <p className="text-zinc-400 text-[10px] mt-0.5">Calidad muscular: {analysis.muscle_quality}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Photo Detail Modal */}
                    {selectedPhoto && (
                        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
                            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <Eye size={18} className="text-primary" />
                                        <div>
                                            <h3 className="text-white font-bold text-sm">Análisis de Composición Corporal</h3>
                                            <p className="text-zinc-500 text-xs">
                                                {new Date(selectedPhoto.photo_date).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                {' · '}
                                                <span className={`${CATEGORY_COLORS[selectedPhoto.category]?.split(' ')[1] || 'text-zinc-400'}`}>
                                                    {CATEGORY_LABELS[selectedPhoto.category] || selectedPhoto.category}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDeletePhoto(selectedPhoto)}
                                            className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                            title="Eliminar foto"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setSelectedPhoto(null)}
                                            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="flex flex-col md:flex-row">
                                    {/* Photo */}
                                    <div className="md:w-1/2 p-4">
                                        <img
                                            src={selectedPhoto.photo_url}
                                            alt="Progreso"
                                            className="w-full rounded-xl object-contain max-h-[60vh]"
                                        />
                                    </div>

                                    {/* Analysis */}
                                    <div className="md:w-1/2 p-4 space-y-4 border-t md:border-t-0 md:border-l border-zinc-800">
                                        {selectedPhoto.ai_analysis?.error ? (
                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                                <p className="text-amber-400 text-sm">{selectedPhoto.ai_analysis.error}</p>
                                            </div>
                                        ) : selectedPhoto.ai_analysis ? (
                                            <>
                                                {/* Fat Percentage Hero */}
                                                <div className="bg-gradient-to-br from-primary/20 to-purple-900/20 border border-primary/20 rounded-xl p-5 text-center">
                                                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">% Grasa Estimado</p>
                                                    <p className="text-4xl font-black text-white">
                                                        {selectedPhoto.ai_analysis.body_fat_estimated || '—'}
                                                        <span className="text-lg text-zinc-400">%</span>
                                                    </p>
                                                    <p className="text-zinc-500 text-xs mt-1">Rango: {selectedPhoto.ai_analysis.body_fat_range || '—'}</p>
                                                </div>

                                                {/* Muscle Distribution */}
                                                {selectedPhoto.ai_analysis.muscle_distribution && (
                                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                                        <h4 className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider mb-3">Distribución Muscular</h4>
                                                        <div className="space-y-2">
                                                            {Object.entries(selectedPhoto.ai_analysis.muscle_distribution).map(([key, val]) => {
                                                                const labels = { upper_body: 'Tren Superior', core: 'Core', lower_body: 'Tren Inferior' };
                                                                const colors = { 'Desarrollado': 'text-emerald-400', 'Proporcionado': 'text-blue-400', 'Definido': 'text-emerald-400', 'Normal': 'text-blue-400', 'Por mejorar': 'text-amber-400', 'Por definir': 'text-amber-400' };
                                                                return (
                                                                    <div key={key} className="flex justify-between items-center">
                                                                        <span className="text-zinc-400 text-xs">{labels[key] || key}</span>
                                                                        <span className={`text-xs font-bold ${colors[val] || 'text-zinc-300'}`}>{val}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Quality & Symmetry */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                                                        <p className="text-[10px] text-zinc-600 uppercase font-bold">Calidad Muscular</p>
                                                        <p className="text-white font-bold text-sm mt-1">{selectedPhoto.ai_analysis.muscle_quality || '—'}</p>
                                                    </div>
                                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                                                        <p className="text-[10px] text-zinc-600 uppercase font-bold">Simetría</p>
                                                        <p className="text-white font-bold text-sm mt-1">{selectedPhoto.ai_analysis.symmetry || '—'}</p>
                                                    </div>
                                                </div>

                                                {/* Strong Points */}
                                                {selectedPhoto.ai_analysis.strong_points?.length > 0 && (
                                                    <div className="space-y-1">
                                                        <h4 className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">✅ Puntos Fuertes</h4>
                                                        {selectedPhoto.ai_analysis.strong_points.map((p, i) => (
                                                            <p key={i} className="text-zinc-300 text-xs pl-3">• {p}</p>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Areas to Improve */}
                                                {selectedPhoto.ai_analysis.areas_to_improve?.length > 0 && (
                                                    <div className="space-y-1">
                                                        <h4 className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">⚡ Áreas a Mejorar</h4>
                                                        {selectedPhoto.ai_analysis.areas_to_improve.map((a, i) => (
                                                            <p key={i} className="text-zinc-300 text-xs pl-3">• {a}</p>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Recommendations */}
                                                {selectedPhoto.ai_analysis.recommendations?.length > 0 && (
                                                    <div className="space-y-1">
                                                        <h4 className="text-[10px] text-blue-500 uppercase font-bold tracking-wider">💡 Recomendaciones</h4>
                                                        {selectedPhoto.ai_analysis.recommendations.map((r, i) => (
                                                            <p key={i} className="text-zinc-300 text-xs pl-3">{i + 1}. {r}</p>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Comparison */}
                                                {selectedPhoto.ai_analysis.comparison_with_previous && (
                                                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                                                        <h4 className="text-[10px] text-primary uppercase font-bold tracking-wider mb-1">📊 Comparación con Fotos Anteriores</h4>
                                                        <p className="text-zinc-300 text-xs">{selectedPhoto.ai_analysis.comparison_with_previous}</p>
                                                    </div>
                                                )}

                                                {/* Summary */}
                                                {selectedPhoto.ai_analysis.summary && (
                                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                                        <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Resumen General</h4>
                                                        <p className="text-zinc-300 text-sm leading-relaxed">{selectedPhoto.ai_analysis.summary}</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
                                                <Sparkles size={24} className="mx-auto mb-2 text-zinc-600" />
                                                <p className="text-zinc-500 text-sm">Sin análisis IA disponible para esta foto</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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

const PlanCard = ({ plan, type, isExpanded, onToggle, studentName, versionNumber, onDelete, foods = [], onUpdate }) => {
    const isNutrition = type === 'nutrition';
    const content = isNutrition
        ? (plan.nutrition_plan_text || plan.supplementation_plan_text)
        : plan.training_plan_text;
    const contentRef = useRef(null);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editedNutrition, setEditedNutrition] = useState(plan.nutrition_plan_text || '');
    const [editedSupplementation, setEditedSupplementation] = useState(plan.supplementation_plan_text || '');
    const [editedTraining, setEditedTraining] = useState(plan.training_plan_text || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Calculator State
    const [selectedFoodId, setSelectedFoodId] = useState('');
    const [grams, setGrams] = useState(100);
    const [calculatedMacros, setCalculatedMacros] = useState(null);

    // Calculator Logic
    const handleCalculate = () => {
        const food = foods.find(f => f.id.toString() === selectedFoodId);
        if (!food) return;

        const ratio = grams / 100;
        setCalculatedMacros({
            calories: Math.round(food.calories_per_100g * ratio),
            protein: Math.round(food.protein_per_100g * ratio),
            carbs: Math.round(food.carbs_per_100g * ratio),
            fat: Math.round(food.fat_per_100g * ratio),
            foodName: food.name
        });
    };

    const handleInsertFood = () => {
        if (!calculatedMacros) return;
        const textToInsert = `\n- **${grams}g ${calculatedMacros.foodName}** (${calculatedMacros.calories} kcal | P: ${calculatedMacros.protein}g | C: ${calculatedMacros.carbs}g | G: ${calculatedMacros.fat}g)`;
        setEditedNutrition(prev => prev + textToInsert);
        setCalculatedMacros(null);
        setGrams(100);
        setSelectedFoodId('');
    };

    useEffect(() => {
        if (selectedFoodId) handleCalculate();
    }, [selectedFoodId, grams]);

    const handleSave = async (overrideNutritionText = null) => {
        setIsSaving(true);
        const finalNutrition = overrideNutritionText !== null ? overrideNutritionText : editedNutrition;

        try {
            await updateStudentPlan(plan.id, {
                nutrition_plan_text: isNutrition ? finalNutrition : undefined,
                supplementation_plan_text: isNutrition ? editedSupplementation : undefined,
                training_plan_text: !isNutrition ? editedTraining : undefined,
                // Update Macros if they changed (simplified logic for now, relies on liveMacros or existing)
                // Note: VisualPlanEditor saves text, liveMacros might need recalc if we want accurate DB numbers.
                // For now, we trust the text update is primary.
            });
            setEditedNutrition(finalNutrition); // Sync state
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Error updating plan:", err);
            alert("Error al guardar cambios");
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportPDF = async (e) => {
        e.stopPropagation();
        const element = document.getElementById(`pdf-content-${plan.id}`);
        if (!element) return;

        setIsExporting(true);

        const opt = {
            margin: 10,
            filename: `Plan_${isNutrition ? 'Nutricion' : 'Entrenamiento'}_${studentName.replace(/\s+/g, '_')}_${new Date(plan.created_at).toLocaleDateString()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 1.5, backgroundColor: '#ffffff', useCORS: true, windowWidth: 1024 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'], avoid: '.pdf-section' }
        };

        try {
            console.log(`Generating PDF for plan ${plan.id}...`);
            await html2pdf().set(opt).from(element).save();
            console.log("PDF generated successfully");
        } catch (err) {
            console.error("Error exporting PDF from History:", err);
            alert(`No se pudo generar el PDF del historial. Error: ${err.message || 'Error desconocido'}`);
        } finally {
            setIsExporting(false);
        }
    };

    // Live Macros Calculation
    const [liveMacros, setLiveMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

    useEffect(() => {
        // Parse text to find macros patterns: (150 kcal ... P: 20g ... )
        // Regex to match: (123 kcal | P: 10g | C: 20g | G: 5g) OR (123 kcal, 10g prot...)
        // Simplified regex for the generated format: (\d+)\s*kcal
        // And we look for P: (\d+), C: (\d+), G: (\d+) inside the same parenthesis block preferably

        const textToCheck = (isNutrition ? (editedNutrition + ' ' + editedSupplementation) : editedTraining);

        let totalCals = 0;
        let totalP = 0;
        let totalC = 0;
        let totalF = 0;

        // Extract all lines
        const lines = textToCheck.split('\n');

        lines.forEach(line => {
            // Match standard format: (X kcal | P: Xg | C: Xg | G: Xg)
            // Also match simple numbers if possible, but let's stick to the generated format
            const kcalMatch = line.match(/(\d+)\s*kcal/i);
            const pMatch = line.match(/P:\s*(\d+)/i);
            const cMatch = line.match(/C:\s*(\d+)/i);
            const fMatch = line.match(/G:\s*(\d+)/i) || line.match(/F:\s*(\d+)/i);

            if (kcalMatch) totalCals += parseInt(kcalMatch[1]);
            if (pMatch) totalP += parseInt(pMatch[1]);
            if (cMatch) totalC += parseInt(cMatch[1]);
            if (fMatch) totalF += parseInt(fMatch[1]);
        });

        setLiveMacros({
            calories: totalCals,
            protein: totalP,
            carbs: totalC,
            fat: totalF
        });

    }, [editedNutrition, editedSupplementation, isNutrition]);

    // Use Live Macros if editing or if they differ from stored (optional, but for now just show stored or live if editing)
    const displayMacros = isEditing ? liveMacros : {
        calories: plan.calories,
        protein: plan.protein_g,
        carbs: plan.carbs_g,
        fat: plan.fat_g
    };


    return (
        <div className="bg-surface border border-zinc-900 rounded-xl overflow-hidden transition-all">
            <div
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-zinc-900/30 transition-colors cursor-pointer"
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
                            {isEditing && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-1.5 py-0.5 rounded font-black uppercase animate-pulse">EDITANDO</span>}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wider">
                            <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(plan.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {(displayMacros.calories > 0 || displayMacros.protein > 0 || displayMacros.fat > 0 || displayMacros.carbs > 0) && (
                                <span className={`${isEditing ? 'text-primary' : ''} transition-colors`}>
                                    {displayMacros.calories} kcal | P: {displayMacros.protein}g | G: {displayMacros.fat}g | C: {displayMacros.carbs}g
                                </span>
                            )}
                            <span className="capitalize px-1.5 py-0.5 bg-zinc-900 rounded text-[10px]">
                                {GOAL_LABELS[plan.goal] || plan.goal}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Force Edit Button Visibility */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            console.log("Edit clicked");
                            setIsEditing(!isEditing);
                        }}
                        className={`p-2 transition-colors z-10 ${isEditing ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white bg-zinc-800/50'}`}
                        title="Editar Plan"
                        style={{ pointerEvents: 'auto' }}
                    >
                        <Edit3 size={16} />
                    </button>

                    {content && (
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className={`p-2 transition-colors ${isExporting ? 'text-primary' : 'text-zinc-500 hover:text-white'}`}
                            title="Descargar PDF"
                        >
                            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                        title="Eliminar Plan"
                    >
                        <Trash2 size={18} />
                    </button>
                    {isExpanded ? <ChevronUp size={18} className="text-zinc-500" /> : <ChevronDown size={18} className="text-zinc-500" />}
                </div>
            </div >

            {/* Edit Mode Panel */}
            {isEditing && (
                <div className="h-[600px] border-t border-zinc-900" onClick={e => e.stopPropagation()}>
                    {isNutrition ? (
                        <VisualPlanEditor
                            initialText={editedNutrition}
                            foods={foods}
                            onSave={(newText) => {
                                setEditedNutrition(newText);
                                handleSave(newText); // Pass new text directly to save
                            }}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <div className="p-4 bg-zinc-900/50 space-y-4">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Plan de Entrenamiento (Modo Texto)</label>
                            <textarea
                                value={editedTraining}
                                onChange={e => setEditedTraining(e.target.value)}
                                className="w-full h-96 bg-black border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 font-mono focus:border-primary outline-none resize-y"
                            />
                            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-zinc-400 text-xs hover:text-white">Cancelar</button>
                                <button onClick={() => handleSave()} disabled={isSaving} className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-2">
                                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={14} />} Guardar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}



            {/* Read Mode Content */}
            {!isEditing && isExpanded && (plan.nutrition_plan_text || plan.supplementation_plan_text || plan.training_plan_text) && (
                <div className="border-t border-zinc-900 p-6 bg-black/30 animate-in slide-in-from-top-2 duration-300 space-y-6">

                    {/* Portion Reference Guide */}
                    {plan.nutrition_plan_text && <PortionReference />}
                    <div ref={contentRef} className="space-y-6">
                        {isNutrition && plan.nutrition_plan_text && (
                            <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed bg-black/20 p-4 rounded-lg border border-zinc-800/50">
                                <div className="flex items-center gap-2 mb-4 text-primary uppercase text-[10px] font-black tracking-widest border-b border-primary/20 pb-2">
                                    <Apple size={12} /> Plan de Alimentación
                                </div>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {plan.nutrition_plan_text
                                        .replace(/DISTRIBUCIÓN DIARIA \(ABSTRACTA Y FLEXIBLE\)/g, 'EJEMPLO DE COMIDA DIARIA')
                                        .replace(/PLAN DETALLADO \(SOLO CON ALIMENTOS PERMITIDOS\)/g, 'EJEMPLO DE COMIDA DIARIA')
                                    }
                                </ReactMarkdown>
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
            {isExpanded && !content && !isEditing && (
                <div className="border-t border-zinc-900 p-6 text-center text-zinc-600 text-sm">
                    Este plan fue guardado solo con macros (sin texto generado por IA).
                </div>
            )}
            {/* Contenido oculto para exportación PDF (Siempre en el DOM para handleExportPDF) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div id={`pdf-content-${plan.id}`} style={{
                    width: '800px',
                    backgroundColor: '#ffffff',
                    color: '#1a1a1a',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                }}>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        #pdf-content-${plan.id} * { color: #1a1a1a !important; border-color: #eeeeee !important; }
                        #pdf-content-${plan.id} .text-primary { color: #7c3aed !important; }
                        #pdf-content-${plan.id} .bg-primary { background-color: #7c3aed !important; }
                    `}} />

                    {/* Header Premium */}
                    <div style={{
                        backgroundColor: '#7c3aed', // Violet-600 (Morado Vibrante)
                        padding: '40px',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '40px'
                    }}>
                        <div>
                            <p style={{
                                textTransform: 'uppercase',
                                fontSize: '12px',
                                letterSpacing: '4px',
                                opacity: 0.9,
                                margin: 0,
                                fontWeight: 'bold'
                            }}>
                                Plan Personalizado
                            </p>
                            <h1 style={{
                                fontSize: '42px',
                                margin: '5px 0',
                                fontWeight: '900',
                                letterSpacing: '-1px'
                            }}>
                                {studentName}
                            </h1>
                            <div style={{
                                display: 'flex',
                                gap: '15px',
                                marginTop: '15px',
                                fontSize: '14px',
                                opacity: 0.9
                            }}>
                                <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '4px' }}>
                                    {isNutrition ? '🍎 Nutrición' : '💪 Entrenamiento'}
                                </span>
                                <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '4px' }}>
                                    v{versionNumber}
                                </span>
                                <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '4px', textTransform: 'capitalize' }}>
                                    {plan.goal === 'cut' ? 'Definición' : plan.goal === 'bulk' ? 'Volumen' : 'Mantenimiento'}
                                </span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', opacity: 0.8 }}>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>ALFREDO TERRAZA</p>
                            <p style={{ margin: 0, fontSize: '10px' }}>Asesor de Nutrición y Entrenamiento</p>
                            <div style={{ marginTop: '10px', fontSize: '12px' }}>
                                {new Date(plan.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Body Content */}
                    <div style={{ padding: '0 50px 50px 50px' }}>

                        {/* Title Section */}
                        <div style={{
                            borderBottom: '2px solid #7c3aed', // Violet-600
                            paddingBottom: '10px',
                            marginBottom: '30px'
                        }}>
                            <h2 style={{
                                margin: 0,
                                fontSize: '24px',
                                color: '#4c1d95', // Violet-900
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {isNutrition ? 'Protocolo Nutricional' : 'Sistema de Entrenamiento'}
                            </h2>
                        </div>

                        {/* Portion Reference Guide for PDF */}
                        {isNutrition && plan.nutrition_plan_text && (
                            <div className="pdf-section" style={{ marginBottom: '30px' }}>
                                <PortionReference forceOpen={true} />
                            </div>
                        )}

                        {/* Markdown Content con estilos forzados */}
                        <div className="pdf-content-body" style={{
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: '#374151'
                        }}>
                            <style>{`
                                .pdf-content-body h1, .pdf-content-body h2, .pdf-content-body h3, .pdf-content-body h4 { 
                                    color: #4c1d95 !important; 
                                    margin-top: 30px !important; 
                                    margin-bottom: 15px !important; 
                                    font-weight: 800 !important; 
                                    page-break-after: avoid !important;
                                    break-after: avoid !important;
                                }
                                .pdf-content-body h1 { fontSize: 22px !important; border-bottom: 2px solid #7c3aed; padding-bottom: 5px; }
                                .pdf-content-body h2 { fontSize: 20px !important; color: #6d28d9 !important; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
                                .pdf-content-body h3 { fontSize: 18px !important; color: #7c3aed !important; }
                                .pdf-content-body p { margin-bottom: 10px !important; orphans: 4; widows: 4; }
                                .pdf-content-body ul, .pdf-content-body ol { margin-bottom: 15px !important; padding-left: 20px !important; page-break-inside: avoid !important; break-inside: avoid !important; }
                                .pdf-content-body li { margin-bottom: 8px !important; }
                                .pdf-content-body strong { color: #000 !important; font-weight: bold !important; }
                                .pdf-content-body table { 
                                    width: 100% !important; 
                                    border-collapse: collapse !important; 
                                    margin: 20px 0 !important; 
                                    font-size: 11px !important; 
                                    page-break-inside: avoid !important;
                                    break-inside: avoid !important;
                                    table-layout: fixed !important;
                                }
                                .pdf-content-body th { background-color: #f3f4f6 !important; padding: 10px 5px !important; text-align: left !important; border: 1px solid #d1d5db !important; font-weight: 800 !important; text-transform: uppercase !important; font-size: 10px !important; }
                                .pdf-content-body td { padding: 8px 5px !important; border: 1px solid #e5e7eb !important; word-wrap: break-word !important; }
                                .pdf-content-body tr { 
                                    page-break-inside: avoid !important;
                                    break-inside: avoid !important;
                                }
                                .pdf-content-body table {
                                    page-break-inside: auto !important;
                                    break-inside: auto !important;
                                }
                                .pdf-section {
                                    page-break-inside: avoid !important;
                                    break-inside: avoid !important;
                                    margin-bottom: 25px !important;
                                    display: block !important;
                                }
                                .pdf-content-body blockquote { border-left: 4px solid #7c3aed !important; padding-left: 15px !important; color: #4b5563 !important; font-style: italic !important; margin: 20px 0 !important; }
                            `}</style>

                            {/* Custom Renderer to keep headers with tables */}
                            {(() => {
                                const fullText = isNutrition
                                    ? `${(plan.nutrition_plan_text || '')
                                        .replace(/DISTRIBUCIÓN DIARIA \(ABSTRACTA Y FLEXIBLE\)/g, 'EJEMPLO DE COMIDA DIARIA')
                                        .replace(/PLAN DETALLADO \(SOLO CON ALIMENTOS PERMITIDOS\)/g, 'EJEMPLO DE COMIDA DIARIA')
                                    }\n\n${plan.supplementation_plan_text ? `## Suplementación\n\n${plan.supplementation_plan_text}` : ''}`
                                    : (plan.training_plan_text || '');

                                // Split by H2 or H3, but keep the delimiter
                                const rawSections = fullText.split(/(?=^#{2,3}\s)/m);
                                const sections = [];

                                for (let i = 0; i < rawSections.length; i++) {
                                    let section = rawSections[i];
                                    if (!section.trim()) continue;

                                    const lines = section.trim().split('\n');
                                    if (lines.length === 1 && lines[0].startsWith('#') && i < rawSections.length - 1) {
                                        rawSections[i + 1] = section + rawSections[i + 1];
                                        continue;
                                    }
                                    sections.push(section);
                                }

                                return sections.map((section, idx) => {
                                    const isFirst = idx === 0;
                                    return (
                                        <div key={idx} className={isFirst ? "" : "pdf-section"} style={{
                                            pageBreakInside: isFirst ? 'auto' : 'avoid',
                                            breakInside: isFirst ? 'auto' : 'avoid',
                                            marginBottom: '25px',
                                            display: 'block'
                                        }}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {section}
                                            </ReactMarkdown>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        marginTop: '50px',
                        padding: '30px 50px',
                        backgroundColor: '#f9fafb',
                        borderTop: '1px solid #e5e7eb',
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '2px'
                    }}>
                        Alfredo Terraza • Asesor de Nutrición y Entrenamiento
                    </div>
                </div>
            </div>
        </div >
    );
};

export default StudentProfile;
