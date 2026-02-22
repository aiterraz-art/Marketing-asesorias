import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';
import {
    Users,
    Calculator,
    Dumbbell,
    TrendingUp,
    Plus,
    Search,
    ChevronRight,
    UserPlus,
    Loader2,
    Sparkles,
    Send,
    MessageCircle,
    Download,
    History,
    X,
    Check,
    Trash2,
    Calendar as CalendarIcon,
    Activity
} from 'lucide-react';
import { getStudents, getStudentPlan, getStudentPlans, saveStudentPlan, updateStudentData, createStudent, getStudentMeasurements, addStudentMeasurement, deleteStudent, addStudentSession, uploadPhoto } from '../lib/supabase';
import { MOCK_STUDENT } from '../lib/mockData';
import { generateFitnessPlan, analyzeStudentProgress, chatDietAssistant, chatTrainingAssistant } from '../lib/openai';
import PlanGenerator from './PlanGenerator';
import StudentHistory from './StudentHistory';
import StudentProfile from './StudentProfile';
import MasterCalendar from './MasterCalendar';
import InitialMeetingAssistant from './InitialMeetingAssistant';
import { getExerciseImageUrl } from '../lib/exerciseDatabase';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

const AsesoriasDashboard = ({ activeTab, setActiveTab, selectedStudent, setSelectedStudent }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [currentMacros, setCurrentMacros] = useState({
        calories: 2000,
        protein: 150,
        fat: 60,
        carbs: 215,
        goal: 'maintenance'
    });
    const [latestPlan, setLatestPlan] = useState(null);
    const [historyStudent, setHistoryStudent] = useState(null);
    const [isInitialMeetingOpen, setIsInitialMeetingOpen] = useState(false);
    const [historicalPlans, setHistoricalPlans] = useState([]);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await getStudents();
            setStudents(data);

            // Sincronizar el alumno seleccionado con los nuevos datos de la DB
            if (selectedStudent) {
                const updated = data.find(s => s.id === selectedStudent.id);
                if (updated) setSelectedStudent(updated);
            }
        } catch (err) {
            console.error("Error loading students:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateStudent = async (studentData) => {
        try {
            const student = await createStudent(studentData);

            // Registrar peso inicial en el historial si está presente
            if (studentData.weight) {
                await addStudentMeasurement({
                    student_id: student.id,
                    weight: parseFloat(studentData.weight),
                    body_fat_pct: studentData.body_fat_pct ? parseFloat(studentData.body_fat_pct) : null
                });
            }

            await loadStudents();
            setIsStudentModalOpen(false);
        } catch (err) {
            console.error("Error creating student:", err);
            alert("Error al crear el alumno.");
        }
    };

    const handleCreateFromWizard = async (wizardData) => {
        try {
            // 0. Subir foto si existe
            let uploadedPhotoUrl = null;
            if (wizardData.photoFile) {
                try {
                    uploadedPhotoUrl = await uploadPhoto(wizardData.photoFile);
                } catch (uploadErr) {
                    console.error("Error uploading photo:", uploadErr);
                    // Silently fail or alert? Let's proceed with student creation anyway
                }
            }

            // Parse numeric values 
            const age = wizardData.age ? parseInt(wizardData.age) : null;
            const weight = wizardData.weight ? parseFloat(wizardData.weight) : null;
            const height = wizardData.height ? parseFloat(wizardData.height) : null;
            const body_fat_pct = wizardData.body_fat_pct ? parseFloat(wizardData.body_fat_pct) : null;
            const activity_level = wizardData.activity_level ? parseFloat(wizardData.activity_level) : 1.2;
            const sleep_hours = wizardData.sleep_hours ? parseFloat(wizardData.sleep_hours) : null;

            // 1. Crear el alumno
            const student = await createStudent({
                full_name: wizardData.full_name,
                age,
                sex: wizardData.sex,
                weight,
                height,
                body_fat_pct,
                activity_level,
                goal: wizardData.goal,
                sleep_hours,
                stress_level: wizardData.stress_level,
                experience: wizardData.experience,
                equipment: wizardData.equipment,
                injuries: wizardData.injuries,
                main_motivation: wizardData.main_motivation
            });

            // 2. Crear sesión inicial
            await addStudentSession({
                student_id: student.id,
                session_date: new Date().toISOString(),
                session_type: 'initial',
                notes: 'Reunión inicial realizada con el Asistente.'
            });

            // 3. Crear primera medición si hay peso
            if (weight) {
                await addStudentMeasurement({
                    student_id: student.id,
                    weight,
                    body_fat_pct,
                    photo_url: uploadedPhotoUrl
                });
            }

            await loadStudents();
            setIsInitialMeetingOpen(false);
            setSelectedStudent(student);
            alert("¡Alumno creado con éxito! Ya puedes ver su perfil completo.");
        } catch (err) {
            console.error("Error in intake wizard flow:", err);
            alert(`Error al procesar la reunión inicial: ${err.message || JSON.stringify(err)}`);
        }
    };

    const handleDeleteStudent = async (id, name) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${name}? Esta acción no se puede deshacer y borrará todos sus planes y registros.`)) {
            return;
        }

        try {
            await deleteStudent(id);
            await loadStudents();
            if (selectedStudent?.id === id) {
                setSelectedStudent(null);
            }
        } catch (err) {
            console.error("Error deleting student:", err);
            alert("Error al eliminar el alumno.");
        }
    };

    const handleMarkVideoComplete = async (studentId, e) => {
        e.stopPropagation();
        if (!confirm("¿Marcar la reunión por video como realizada?")) return;

        try {
            await updateStudentData(studentId, { next_videocall_date: null });
            await loadStudents();
            alert("Reunión marcada como realizada.");
        } catch (err) {
            console.error("Error updating video status:", err);
            alert("Error al actualizar el estado.");
        }
    };

    // Cargar último plan del alumno seleccionado
    useEffect(() => {
        const loadPlan = async () => {
            if (selectedStudent) {
                try {
                    const allPlans = await getStudentPlans(selectedStudent.id);
                    setHistoricalPlans(allPlans);

                    const plan = allPlans[0]; // El más reciente
                    setLatestPlan(plan);
                    if (plan) {
                        setCurrentMacros({
                            calories: plan.calories,
                            protein: plan.protein_g,
                            fat: plan.fat_g,
                            carbs: plan.carbs_g,
                            goal: plan.goal
                        });
                    }
                } catch (err) {
                    console.error("Error loading plans:", err);
                }
            } else {
                setLatestPlan(null);
                setHistoricalPlans([]);
            }
        };
        loadPlan();
    }, [selectedStudent]);

    // Mapeamos las pestañas del sidebar a los sub-componentes internos
    const activeSubTab = activeTab === 'nutricion' ? 'calculadora' :
        activeTab === 'alumnos' ? 'alumnos' :
            activeTab === 'rutinas' ? 'rutinas' :
                activeTab === 'progreso' ? 'progreso' :
                    activeTab === 'calendario' ? 'calendario' : 'alumnos';

    const setSubTab = (tab) => {
        // Al hacer clic internamente, también actualizamos el estado global (sidebar)
        const tabMap = {
            'alumnos': 'alumnos',
            'calculadora': 'nutricion',
            'rutinas': 'rutinas',
            'progreso': 'progreso',
            'calendario': 'calendario'
        };
        setActiveTab(tabMap[tab] || 'alumnos');
    };

    return (
        <div className="p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Asesorías OS</h1>
                    <p className="text-zinc-500 mt-1">Gestión integral de alumnos y protocolos de entrenamiento.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsInitialMeetingOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white border border-zinc-700 rounded-lg font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-950/20"
                    >
                        <Sparkles size={18} className="text-primary" />
                        Reunión Inicial
                    </button>
                    <button
                        onClick={() => setIsStudentModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-opacity whitespace-nowrap shadow-lg shadow-primary/20"
                    >
                        <UserPlus size={18} />
                        Rápido
                    </button>
                </div>
            </header>

            {/* Mini Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Alumnos Activos" value={students?.length || 0} icon={<Users className="text-primary" size={20} />} trend="Global" />
                <StatCard title="Promedio Edad" value={Math.round((students || []).reduce((acc, s) => acc + (s.age || 0), 0) / (students?.length || 1))} icon={<Calculator className="text-amber-500" size={20} />} trend="Años" />
                <StatCard title="Último Registro" value={selectedStudent?.full_name ? selectedStudent.full_name.split(' ')[0] : '---'} icon={<TrendingUp className="text-emerald-500" size={20} />} trend="Contexto" />
            </div>

            {/* Alertas Administrativas */}
            {(students || []).filter(s => {
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                const isPayDue = s.next_payment_date && s.next_payment_date <= todayStr;
                const isCheckDue = s.next_checkin_date && s.next_checkin_date <= todayStr;
                const nextVideoStr = s.next_videocall_date ? s.next_videocall_date.split('T')[0] : null;
                const isVideoDue = nextVideoStr && nextVideoStr <= todayStr;

                return isPayDue || isCheckDue || isVideoDue;
            }).length > 0 && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 animate-in slide-in-from-left-4 duration-500">
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <Activity size={20} className="animate-pulse" />
                            <h3 className="font-bold">Alertas Prioritarias</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(students || []).filter(s => {
                                const now = new Date();
                                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                const isPayDue = s.next_payment_date && s.next_payment_date <= todayStr;
                                const isCheckDue = s.next_checkin_date && s.next_checkin_date <= todayStr;
                                const nextVideoStr = s.next_videocall_date ? s.next_videocall_date.split('T')[0] : null;
                                const isVideoDue = nextVideoStr && nextVideoStr <= todayStr;
                                return isPayDue || isCheckDue || isVideoDue;
                            }).map(s => {
                                const now = new Date();
                                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                const isPayOverdue = s.next_payment_date && s.next_payment_date <= todayStr;
                                const isCheckOverdue = s.next_checkin_date && s.next_checkin_date <= todayStr;
                                const nextVideoStr = s.next_videocall_date ? s.next_videocall_date.split('T')[0] : null;
                                const isVideoOverdue = nextVideoStr && nextVideoStr <= todayStr;

                                return (
                                    <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-black/40 border border-zinc-800 p-3 rounded-xl flex items-center justify-between hover:border-red-500/40 cursor-pointer transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                                {s.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">{s.full_name}</p>
                                                <div className="flex gap-2 mt-0.5">
                                                    {isPayOverdue && <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter bg-emerald-400/10 px-1.5 py-0.5 rounded">Pago</span>}
                                                    {isCheckOverdue && <span className="text-[9px] font-bold text-amber-400 uppercase tracking-tighter bg-amber-400/10 px-1.5 py-0.5 rounded">Control</span>}
                                                    {isVideoOverdue && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter bg-blue-400/10 px-1.5 py-0.5 rounded">Video</span>
                                                            <button
                                                                onClick={(e) => handleMarkVideoComplete(s.id, e)}
                                                                className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors"
                                                                title="Marcar como realizada"
                                                            >
                                                                <Check size={10} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-zinc-700" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            {/* Tabs */}
            <div className="flex border-b border-zinc-900">
                <SubTab label="Alumnos" isActive={activeSubTab === 'alumnos'} onClick={() => setSubTab('alumnos')} icon={<Users size={18} />} />
                <SubTab label="Calculadora" isActive={activeSubTab === 'calculadora'} onClick={() => setSubTab('calculadora')} icon={<Calculator size={18} />} />
                <SubTab label="Rutinas" isActive={activeSubTab === 'rutinas'} onClick={() => setSubTab('rutinas')} icon={<Dumbbell size={18} />} />
                <SubTab label="Progreso" isActive={activeSubTab === 'progreso'} onClick={() => setSubTab('progreso')} icon={<TrendingUp size={18} />} />
                <SubTab label="Calendario" isActive={activeSubTab === 'calendario'} onClick={() => setSubTab('calendario')} icon={<CalendarIcon size={18} />} />
            </div>

            <main className="min-h-[400px]">
                {activeSubTab === 'alumnos' && (
                    selectedStudent ? (
                        <StudentProfile
                            student={selectedStudent}
                            onBack={() => setSelectedStudent(null)}
                            onStudentUpdated={loadStudents}
                        />
                    ) : (
                        <StudentList
                            students={filteredStudents}
                            loading={loading}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            selectedId={selectedStudent?.id}
                            onSelect={setSelectedStudent}
                            onHistory={setHistoryStudent}
                            onDelete={handleDeleteStudent}
                        />
                    )
                )}
                {/* ... rest of tabs ... */}
                {activeSubTab === 'calculadora' && (
                    <NutritionCalculator
                        selectedStudent={selectedStudent}
                        students={students}
                        onSelectStudent={setSelectedStudent}
                        latestPlan={latestPlan}
                        historicalPlans={historicalPlans}
                        onMacrosUpdate={setCurrentMacros}
                        onSavePlan={async (plan) => {
                            try {
                                await saveStudentPlan(plan);
                                // Recargar plan después de guardar
                                const updatedPlan = await getStudentPlan(selectedStudent.id);
                                const updatedAll = await getStudentPlans(selectedStudent.id);
                                setLatestPlan(updatedPlan);
                                setHistoricalPlans(updatedAll);
                                alert("¡Plan guardado con éxito!");
                            } catch (err) {
                                console.error("Error saving plan:", err);
                                // Intento de fallback: Si falla por la columna de suplementación, intentar guardar sin ella
                                if (err.message && (err.message.includes('supplementation_plan_text') || err.message.includes('column'))) {
                                    try {
                                        const { supplementation_plan_text, ...planWithoutSupps } = plan;
                                        await saveStudentPlan(planWithoutSupps);
                                        const updatedPlan = await getStudentPlan(selectedStudent.id);
                                        const updatedAll = await getStudentPlans(selectedStudent.id);
                                        setLatestPlan(updatedPlan);
                                        setHistoricalPlans(updatedAll);
                                        alert("⚠️ Plan guardado PARCIALMENTE.\n\nLa suplementación no se guardó porque falta actualizar la base de datos.\nEjecuta el comando SQL en Supabase.");
                                    } catch (retryErr) {
                                        alert("Error crítico al guardar: " + (retryErr.message || "Desconocido"));
                                    }
                                } else {
                                    alert("Error al guardar el plan: " + (err.message || "Desconocido"));
                                }
                            }
                        }}
                    />
                )}
                {activeSubTab === 'rutinas' && (
                    <TrainingGenerator
                        selectedStudent={selectedStudent}
                        students={students}
                        onSelectStudent={setSelectedStudent}
                        latestPlan={latestPlan}
                        historicalPlans={historicalPlans}
                        onSavePlan={async (plan) => {
                            try {
                                await saveStudentPlan(plan);
                                const updatedPlan = await getStudentPlan(selectedStudent.id);
                                const updatedAll = await getStudentPlans(selectedStudent.id);
                                setLatestPlan(updatedPlan);
                                setHistoricalPlans(updatedAll);
                                alert("¡Rutina guardada con éxito!");
                            } catch (err) {
                                console.error("Error saving routine:", err);
                                alert("Error al guardar la rutina.");
                            }
                        }}
                    />
                )}
                {activeSubTab === 'progreso' && <ProgressTracker selectedStudent={selectedStudent} />}
                {activeSubTab === 'calendario' && (
                    <MasterCalendar
                        students={students}
                        loading={loading}
                        onUpdate={loadStudents}
                        onSelectStudent={(s) => {
                            setSelectedStudent(s);
                            setSubTab('alumnos');
                        }}
                    />
                )}
            </main>

            <StudentModal
                isOpen={isStudentModalOpen}
                onClose={() => setIsStudentModalOpen(false)}
                onCreate={handleCreateStudent}
            />
            <StudentHistory
                student={historyStudent}
                isOpen={!!historyStudent}
                onClose={() => setHistoryStudent(null)}
            />
            <InitialMeetingAssistant
                isOpen={isInitialMeetingOpen}
                onClose={() => setIsInitialMeetingOpen(false)}
                onCreateStudent={handleCreateFromWizard}
            />
        </div >
    );
};

const StatCard = ({ title, value, icon, trend }) => (
    <div className="bg-surface border border-zinc-900 p-5 rounded-xl">
        <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-500 text-sm font-medium">{title}</span>
            <div className="p-2 bg-zinc-900/50 rounded-lg">{icon}</div>
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{value}</span>
            <span className="text-xs text-zinc-500">{trend}</span>
        </div>
    </div>
);

const SubTab = ({ label, isActive, onClick, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${isActive ? 'text-primary' : 'text-zinc-500 hover:text-white'
            }`}
    >
        {icon}
        {label}
        {isActive && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
        )}
    </button>
);

const StudentList = ({ students, loading, searchTerm, onSearchChange, onSelect, selectedId, onHistory, onDelete }) => (
    <div className="bg-surface border border-zinc-900 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar alumno..."
                    className="w-full bg-black border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                />
            </div>
        </div>
        <div className="divide-y divide-zinc-900">
            {loading ? (
                <div className="p-12 text-center text-zinc-500 flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-primary" size={24} />
                    <span>Cargando alumnos...</span>
                </div>
            ) : students.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">
                    {searchTerm ? "No se encontraron alumnos con ese nombre." : "No hay alumnos registrados."}
                </div>
            ) : students.map((s) => (
                <div
                    key={s.id}
                    onClick={() => onSelect(s)}
                    className={`p-4 flex items-center justify-between hover:bg-zinc-900/30 cursor-pointer transition-colors group ${selectedId === s.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${selectedId === s.id ? 'bg-primary text-white border-primary' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                            {s.full_name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-white font-medium">{s.full_name}</h3>
                            <p className="text-zinc-500 text-xs capitalize">{s.goal === 'cut' ? 'Definición' : s.goal === 'bulk' ? 'Volumen' : 'Mantenimiento'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-zinc-400 text-sm font-medium">{s.weight}kg</span>
                            <span className="text-zinc-600 text-[10px] uppercase tracking-wider">{s.age} años</span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onHistory(s); }}
                            className="p-2 rounded-lg text-zinc-600 hover:text-amber-400 hover:bg-amber-400/10 transition-all"
                            title="Ver historial"
                        >
                            <History size={18} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(s.id, s.full_name); }}
                            className="p-2 rounded-lg text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all"
                            title="Eliminar Alumno"
                        >
                            <Trash2 size={18} />
                        </button>
                        <ChevronRight className={`transition-colors ${selectedId === s.id ? 'text-primary' : 'text-zinc-700 group-hover:text-primary'}`} size={20} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const StudentModal = ({ isOpen, onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        age: 25,
        height: 175,
        weight: 75,
        activity_level: 1.2,
        goal: 'maintenance'
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-surface border border-zinc-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Nuevo Alumno</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <Plus size={24} className="rotate-45" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-500 uppercase">Nombre Completo</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Edad</label>
                            <input
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Altura (cm)</label>
                            <input
                                type="number"
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Peso (kg)</label>
                            <input
                                type="number"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Meta</label>
                            <select
                                value={formData.goal}
                                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-primary transition-colors"
                            >
                                <option value="cut">Definición</option>
                                <option value="maintenance">Mantenimiento</option>
                                <option value="bulk">Volumen</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-zinc-900/20 border-t border-zinc-900 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-zinc-400 font-medium hover:text-white transition-colors">Cancelar</button>
                    <button
                        onClick={() => onCreate(formData)}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
                    >
                        Crear Alumno
                    </button>
                </div>
            </div>
        </div>
    );
};

const NutritionCalculator = ({ selectedStudent, students, onSelectStudent, latestPlan, historicalPlans = [], onMacrosUpdate, onSavePlan }) => {
    const [data, setData] = useState({
        weight: selectedStudent?.weight || 80,
        height: selectedStudent?.height || 180,
        age: selectedStudent?.age || 25,
        sex: selectedStudent?.sex || 'male',
        activity: selectedStudent?.activity_level || 1.2,
        goal: selectedStudent?.goal || 'maintenance',
        protein: 160,
        fat: 70
    });

    const [results, setResults] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Chat IA states
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [useWhey, setUseWhey] = useState(false);
    const chatEndRef = useRef(null);
    const dietContentRef = useRef(null);

    // Actualizar datos si cambia el alumno seleccionado o si se carga un plan previo
    useEffect(() => {
        if (selectedStudent) {
            setData(prev => ({
                ...prev,
                weight: selectedStudent.weight || prev.weight,
                height: selectedStudent.height || prev.height,
                age: selectedStudent.age || prev.age,
                sex: selectedStudent.sex || prev.sex,
                activity: selectedStudent.activity_level || prev.activity,
                goal: latestPlan?.goal || selectedStudent.goal || prev.goal,
                protein: latestPlan?.protein_g || 160,
                fat: latestPlan?.fat_g || 70
            }));

            // Solo resetear el chat si el ID del alumno cambió realmente
            // Esto evita que al guardar (que actualiza latestPlan) se borre el chat
        }
    }, [selectedStudent?.id, latestPlan?.id]);

    // Resetear chat solo cuando cambia el alumno
    const prevStudentId = useRef(selectedStudent?.id);
    useEffect(() => {
        if (selectedStudent?.id !== prevStudentId.current) {
            if (latestPlan?.nutrition_plan_text) {
                setChatMessages([{ role: 'assistant', content: latestPlan.nutrition_plan_text }]);
                setShowChat(true);
            } else {
                setChatMessages([]);
                setShowChat(false);
            }
            prevStudentId.current = selectedStudent?.id;
        }
    }, [selectedStudent?.id, latestPlan]); // También depender de latestPlan para la carga inicial

    // Cálculo con Harris-Benedict Revisada
    const calculate = () => {
        const tmb = data.sex === 'male'
            ? 88.362 + (13.397 * data.weight) + (4.799 * data.height) - (5.677 * data.age)
            : 447.593 + (9.247 * data.weight) + (3.098 * data.height) - (4.330 * data.age);
        const tdee = tmb * data.activity;
        let targetCals = tdee;

        if (data.goal === 'cut') targetCals = tdee * 0.8;
        else if (data.goal === 'bulk') targetCals = tdee * 1.1;

        const proteinCals = data.protein * 4;
        const fatCals = data.fat * 9;
        const carbCals = targetCals - proteinCals - fatCals;
        const carbs = Math.max(0, Math.round(carbCals / 4));

        setResults({
            bmr: Math.round(tmb),
            tdee: Math.round(tdee),
            calories: Math.round(targetCals),
            carbs: carbs
        });
    };

    useEffect(() => {
        calculate();
    }, [data]);

    useEffect(() => {
        if (results && onMacrosUpdate) {
            onMacrosUpdate({
                ...results,
                protein: data.protein,
                fat: data.fat,
                goal: data.goal
            });
        }
    }, [results]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSave = async () => {
        if (!selectedStudent) {
            alert("Por favor, selecciona un alumno primero.");
            return;
        }
        setIsSaving(true);
        const lastAIDiet = [...chatMessages].reverse().find(m => m.role === 'assistant')?.content;

        try {
            await onSavePlan({
                student_id: selectedStudent.id,
                calories: results.calories,
                protein_g: data.protein,
                fat_g: data.fat,
                carbs_g: results.carbs,
                goal: data.goal,
                nutrition_plan_text: lastAIDiet || null,
                training_plan_text: latestPlan?.training_plan_text || null,
                supplementation_plan_text: latestPlan?.supplementation_plan_text || null
            });
        } finally {
            setIsSaving(false);
        }
    };

    const isDemoMode = !selectedStudent;
    const activeStudent = selectedStudent || MOCK_STUDENT;

    // Generar dieta inicial con IA
    const handleGenerateDiet = async () => {
        setShowChat(true);
        setIsChatLoading(true);

        const initialMessage = {
            role: 'user',
            content: `Genera un plan de alimentación para ${activeStudent.full_name}.
            Objetivo: ${activeStudent.goal}
            Calorías: ${results.calories} kcal
            Proteína: ${data.protein} g
            Grasas: ${data.fat} g
            Carbohidratos: ${results.carbs} g`
        };
        setChatMessages([initialMessage]);

        try {
            const macros = { calories: results.calories, protein: data.protein, fat: data.fat, carbs: results.carbs, useWhey };
            const response = await chatDietAssistant([initialMessage], activeStudent, macros);
            setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (err) {
            console.error("Error generating diet:", err);
            setChatMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${err.message || 'Error desconocido'}. Inténtalo de nuevo.` }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // Enviar mensaje al chat
    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg = { role: 'user', content: chatInput };
        const updatedHistory = [...chatMessages, userMsg];
        setChatMessages(updatedHistory);
        setChatInput('');
        setIsChatLoading(true);

        try {
            const macros = { calories: results.calories, protein: data.protein, fat: data.fat, carbs: results.carbs, useWhey };
            const response = await chatDietAssistant(updatedHistory, selectedStudent, macros);
            setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (err) {
            console.error("Error in diet chat:", err);
            setChatMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${err.message || 'Error desconocido'}. Inténtalo de nuevo.` }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // Exportar última respuesta de la IA a PDF
    const handleExportDietPDF = async () => {
        const lastAssistantMsg = [...chatMessages].reverse().find(m => m.role === 'assistant');
        if (!lastAssistantMsg) return;

        const element = document.getElementById('pdf-diet-content');
        if (!element) {
            console.error("PDF element not found: pdf-diet-content");
            alert("Error interno: No se encontró el contenido para el PDF.");
            return;
        }

        setIsExporting(true);

        const opt = {
            margin: 10,
            filename: `Dieta_${selectedStudent.full_name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 1.5,
                backgroundColor: '#ffffff',
                useCORS: true,
                windowWidth: 720
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'], avoid: '.pdf-section' }
        };

        try {
            console.log("Generating Diet PDF...");
            await html2pdf().set(opt).from(element).save();
            console.log("Diet PDF generated successfully");
        } catch (err) {
            console.error("Error exporting Diet PDF:", err);
            alert(`No se pudo generar el PDF de la dieta. Error: ${err.message || 'Error desconocido'}`);
        } finally {
            setIsExporting(false);
        }
    };

    // Obtener la última respuesta de la IA para el render oculto del PDF
    const lastAIResponse = [...chatMessages].reverse().find(m => m.role === 'assistant');

    return (
        <div className="space-y-6">
            {(selectedStudent || (students && students.length > 0)) && (
                <div className={`${selectedStudent ? 'bg-primary/10 border-primary/20' : 'bg-surface border-zinc-900'} p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all`}>
                    <div className="flex items-center gap-3">
                        {selectedStudent ? (
                            <>
                                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/20">
                                    {selectedStudent?.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-sm">Editando plan para: {selectedStudent?.full_name}</p>
                                    <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Perfil Activo • ID: #{selectedStudent?.id?.toString().substring(0, 8)}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-zinc-400 font-medium text-sm">Modo Libre</p>
                                    <p className="text-zinc-600 text-[10px] uppercase tracking-wider">Selecciona un alumno para guardar</p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <select
                                value={selectedStudent?.id || ""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) return;
                                    const student = students.find(s => String(s.id) === String(val));
                                    if (student) {
                                        onSelectStudent(student);
                                    }
                                }}
                                className="appearance-none bg-black border border-zinc-800 rounded-lg px-4 py-2 pr-10 text-sm text-white focus:outline-none focus:border-primary transition-all cursor-pointer hover:border-zinc-700 w-full md:w-64"
                            >
                                <option value="" disabled>Seleccionar Alumno...</option>
                                {students && students.map(s => (
                                    <option key={s.id} value={s.id}>{s.full_name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                <ChevronRight size={16} className="rotate-90" />
                            </div>
                        </div>
                        {selectedStudent && (
                            <button
                                onClick={() => onSelectStudent(null)}
                                className="p-2 text-zinc-500 hover:text-white transition-colors"
                                title="Desvincular Alumno"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {!selectedStudent && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-500 text-sm flex items-center gap-3">
                    <Sparkles size={18} className="animate-pulse" />
                    <span>Selecciona un alumno para guardar su plan permanentemente y sincronizar sus datos biométricos.</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface border border-zinc-900 p-6 rounded-xl space-y-6">
                    <h2 className="text-lg font-semibold text-white">Datos Biométricos</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Peso (kg)" value={data.weight} onChange={(v) => setData({ ...data, weight: v })} />
                        <InputGroup label="Altura (cm)" value={data.height} onChange={(v) => setData({ ...data, height: v })} />
                        <InputGroup label="Edad" value={data.age} onChange={(v) => setData({ ...data, age: v })} />
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sexo</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['male', 'female'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setData({ ...data, sex: s })}
                                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${data.sex === s
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-black border-zinc-800 text-zinc-500'
                                            }`}
                                    >
                                        {s === 'male' ? '♂ Hombre' : '♀ Mujer'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actividad</label>
                            <select
                                value={data.activity}
                                onChange={(e) => setData({ ...data, activity: parseFloat(e.target.value) })}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white focus:border-primary outline-none"
                            >
                                <option value="1.2">Sedentario</option>
                                <option value="1.375">Ligero</option>
                                <option value="1.55">Moderado</option>
                                <option value="1.725">Intenso</option>
                                <option value="1.9">Muy Intenso</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Objetivo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['cut', 'maintenance', 'bulk'].map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setData({ ...data, goal: g })}
                                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${data.goal === g
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-black border-zinc-800 text-zinc-500'
                                        }`}
                                >
                                    {g === 'cut' ? 'Definición' : g === 'bulk' ? 'Volumen' : 'Mantenimiento'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-900 space-y-4">
                        <h2 className="text-lg font-semibold text-white">Configuración de Macros</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Proteína (g)" value={data.protein} onChange={(v) => setData({ ...data, protein: v })} />
                            <InputGroup label="Grasas (g)" value={data.fat} onChange={(v) => setData({ ...data, fat: v })} />
                        </div>
                    </div>
                </div>

                {results && (
                    <div className="bg-surface border border-zinc-900 p-6 rounded-xl space-y-8 flex flex-col justify-center">
                        <div className="text-center space-y-2">
                            <p className="text-zinc-500 text-sm">Objetivo Diario</p>
                            <h3 className="text-5xl font-black text-white italic">
                                {results.calories} <span className="text-lg font-normal not-italic text-zinc-500">kcal</span>
                            </h3>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <MacroBox label="Proteína" value={data.protein} unit="g" color="bg-primary" pct={Math.round((data.protein * 4 / results.calories) * 100)} />
                            <MacroBox label="Grasas" value={data.fat} unit="g" color="bg-amber-500" pct={Math.round((data.fat * 9 / results.calories) * 100)} />
                            <MacroBox label="Carbs" value={results.carbs} unit="g" color="bg-blue-500" pct={Math.round((results.carbs * 4 / results.calories) * 100)} />
                        </div>

                        <div className="space-y-4 pt-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Tasa Metabólica Basal (BMR)</span>
                                <span className="text-white font-mono">{results.bmr} kcal</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Gasto Total Diario (TDEE)</span>
                                <span className="text-white font-mono">{results.tdee} kcal</span>
                            </div>
                        </div>

                        {/* Toggle Whey */}
                        <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl mt-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white font-medium">Incluir Proteína Whey</span>
                                <span className="text-[10px] text-zinc-600 uppercase">en la dieta</span>
                            </div>
                            <button
                                onClick={() => setUseWhey(!useWhey)}
                                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${useWhey ? 'bg-primary' : 'bg-zinc-700'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${useWhey ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isDemoMode}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all shadow-lg ${isDemoMode ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-primary text-white hover:opacity-90 shadow-primary/20'}`}
                                title={isDemoMode ? "Selecciona un alumno para guardar" : ""}
                            >
                                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <TrendingUp size={20} />}
                                {isSaving ? "Guardando..." : "Asignar Plan"}
                            </button>
                            <button
                                onClick={handleGenerateDiet}
                                disabled={isChatLoading}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20"
                            >
                                {isChatLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                                {isDemoMode ? "Probar Generar Dieta IA" : "Generar Dieta IA"}
                            </button>
                        </div>

                        {/* History Selector */}
                        {historicalPlans.length > 1 && (
                            <div className="pt-4 border-t border-zinc-800 mt-4">
                                <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest block mb-2">Cargar Versión Anterior</label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-primary"
                                        onChange={(e) => {
                                            const selected = historicalPlans.find(p => p.id === parseInt(e.target.value));
                                            if (selected && selected.nutrition_plan_text) {
                                                setChatMessages([{ role: 'assistant', content: selected.nutrition_plan_text }]);
                                                setShowChat(true);
                                                setData(prev => ({
                                                    ...prev,
                                                    goal: selected.goal,
                                                    protein: selected.protein_g,
                                                    fat: selected.fat_g
                                                }));
                                            }
                                        }}
                                        defaultValue={latestPlan?.id}
                                    >
                                        {historicalPlans.map((p, i) => (
                                            <option key={p.id} value={p.id}>
                                                Plan del {new Date(p.created_at).toLocaleDateString()} - v{historicalPlans.length - i}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Chat IA de Dieta */}
            {showChat && (
                <div className="bg-surface border border-zinc-900 rounded-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="p-4 border-b border-zinc-900 bg-zinc-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageCircle size={18} className="text-amber-400" />
                            <h3 className="text-white font-bold text-sm">Chat con Nutricionista IA</h3>
                            <span className="text-zinc-600 text-xs">• Pide modificaciones hasta que quede perfecto</span>
                        </div>
                        {lastAIResponse && (
                            <button
                                onClick={handleExportDietPDF}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                {isExporting ? 'Generando...' : 'Exportar a PDF'}
                            </button>
                        )}
                    </div>

                    {/* Messages */}
                    <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-primary/20 text-white rounded-br-md'
                                    : 'bg-zinc-900 text-zinc-300 rounded-bl-md border border-zinc-800'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p>{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl rounded-bl-md">
                                    <Loader2 className="animate-spin text-primary" size={20} />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-zinc-900 bg-black/50">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ej: Cambia el desayuno por algo sin lácteos..."
                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-primary placeholder:text-zinc-600"
                                disabled={isChatLoading}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isChatLoading || !chatInput.trim()}
                                className="px-4 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden element for PDF export */}
            {lastAIResponse && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <div id="pdf-diet-content" style={{
                        width: '720px',
                        padding: '40px 35px',
                        color: '#1a1a1a',
                        backgroundColor: '#ffffff',
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        fontSize: '12px',
                        lineHeight: '1.6',
                        boxSizing: 'border-box'
                    }}>
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            #pdf-diet-content * { color: #1a1a1a !important; border-color: #eeeeee !important; }
                            #pdf-diet-content .text-primary { color: #7c3aed !important; }
                            #pdf-diet-content h1, #pdf-diet-content h2 { color: #7c3aed !important; }
                        `}} />


                        {/* Content */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .pdf-diet-content h1, .pdf-diet-content h2, .pdf-diet-content h3 {
                                color: #1a1a1a;
                                margin-top: 18px;
                                margin-bottom: 8px;
                                font-weight: 700;
                            }
                            .pdf-diet-content h2 { font-size: 15px; color: #7c3aed; border-bottom: 1px solid #eee; padding-bottom: 4px; }
                            .pdf-diet-content h3 { font-size: 13px; }
                            .pdf-diet-content p { margin: 6px 0; font-size: 11px; }
                            .pdf-diet-content ul, .pdf-diet-content ol { padding-left: 18px; margin: 6px 0; }
                            .pdf-diet-content li { margin: 3px 0; font-size: 11px; }
                            .pdf-diet-content table {
                                width: 100%;
                                border-collapse: collapse;
                                margin: 10px 0;
                                font-size: 10px;
                                table-layout: fixed;
                                word-wrap: break-word;
                                page-break-inside: auto;
                            }
                            .pdf-diet-content tr { page-break-inside: avoid; break-inside: avoid; }
                            .pdf-diet-content th {
                                background-color: #7c3aed;
                                color: white;
                                padding: 6px 8px;
                                text-align: left;
                                font-weight: 600;
                                font-size: 9px;
                                text-transform: uppercase;
                            }
                            .pdf-diet-content td {
                                padding: 5px 8px;
                                border-bottom: 1px solid #eee;
                                font-size: 10px;
                                vertical-align: top;
                            }
                            .pdf-diet-content tr:nth-child(even) { background-color: #faf9fd; }
                            .pdf-diet-content tr:hover { background-color: #f3f0ff; }
                            .pdf-diet-content strong { font-weight: 700; }
                            .pdf-diet-content hr { border: none; border-top: 1px solid #ddd; margin: 15px 0; }
                        `}} />
                        <div className="pdf-diet-content">
                            {/* Header & Macros Summary - No .pdf-section class to allow it to share space with the tables */}
                            <div className="pdf-intro-block" style={{ pageBreakInside: 'auto', marginBottom: '10px' }}>
                                {/* Header */}
                                <div style={{ textAlign: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '2px solid #7c3aed' }}>
                                    <h1 style={{ color: '#7c3aed', fontSize: '20px', margin: '0 0 8px 0', fontWeight: '700' }}>Plan Nutricional Personalizado</h1>
                                    <p style={{ color: '#666', fontSize: '12px', margin: '0' }}>
                                        {selectedStudent?.full_name} • {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>

                                {/* Macros Summary */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-around',
                                    backgroundColor: '#f8f7ff',
                                    border: '1px solid #e8e5f0',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '20px',
                                    fontSize: '11px'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: '700', fontSize: '16px', color: '#7c3aed' }}>{results?.calories}</div>
                                        <div style={{ color: '#888', fontSize: '9px', textTransform: 'uppercase' }}>Calorías</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: '700', fontSize: '16px', color: '#7c3aed' }}>{data.protein}g</div>
                                        <div style={{ color: '#888', fontSize: '9px', textTransform: 'uppercase' }}>Proteína</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: '700', fontSize: '16px', color: '#f59e0b' }}>{data.fat}g</div>
                                        <div style={{ color: '#888', fontSize: '9px', textTransform: 'uppercase' }}>Grasas</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: '700', fontSize: '16px', color: '#3b82f6' }}>{results?.carbs}g</div>
                                        <div style={{ color: '#888', fontSize: '9px', textTransform: 'uppercase' }}>Carbohidratos</div>
                                    </div>
                                </div>
                            </div>

                            {(() => {
                                const text = lastAIResponse.content || '';
                                const rawSections = text.split(/(?=^#{2,3}\s)/m);
                                const sections = [];

                                for (let i = 0; i < rawSections.length; i++) {
                                    let section = rawSections[i];
                                    if (!section.trim()) continue;

                                    // If section is just a heading, merge with next
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
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{section}</ReactMarkdown>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InputGroup = ({ label, value, onChange }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white focus:border-primary outline-none transition-colors"
        />
    </div>
);

const MacroBox = ({ label, value, unit, color, pct }) => (
    <div className="p-4 bg-black/50 border border-zinc-900 rounded-xl text-center space-y-1">
        <div className={`w-full h-1 ${color} rounded-full mb-2 opacity-50`} />
        <p className="text-zinc-500 text-xs font-bold uppercase">{label}</p>
        <p className="text-xl font-bold text-white">{value}{unit}</p>
        <p className="text-[10px] text-zinc-600">{pct}% kcal</p>
    </div>
);

const RoutineDesigner = () => (
    <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-zinc-900 rounded-xl bg-zinc-900/10">
        <Dumbbell className="text-zinc-700 mb-4" size={48} />
        <h3 className="text-white font-medium">Planificador de Rutinas</h3>
        <p className="text-zinc-500 text-sm mt-1">Próximamente: Generador de rutinas con IA.</p>
    </div>
);

const ProgressTracker = ({ selectedStudent }) => {
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(null);

    useEffect(() => {
        if (selectedStudent) {
            loadMeasurements();
        }
    }, [selectedStudent]);

    const loadMeasurements = async () => {
        setLoading(true);
        try {
            const data = await getStudentMeasurements(selectedStudent.id);
            setMeasurements(data.map(m => ({
                date: new Date(m.measured_at).toLocaleDateString(),
                weight: m.weight,
                fat: m.body_fat_pct
            })));
        } catch (err) {
            console.error("Error loading measurements:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMeasurement = async () => {
        if (!newWeight) return;
        try {
            await addStudentMeasurement({
                student_id: selectedStudent.id,
                weight: parseFloat(newWeight)
            });
            setNewWeight('');
            setShowAddModal(false);
            loadMeasurements();
        } catch (err) {
            console.error("Error adding measurement:", err);
            alert("Error al guardar la medida.");
        }
    };

    const handleAnalyzeProgress = async () => {
        if (measurements.length < 2) {
            alert("Se necesitan al menos 2 registros para analizar el progreso.");
            return;
        }
        setAnalyzing(true);
        try {
            const analysis = await analyzeStudentProgress(selectedStudent, measurements);
            setAiAnalysis(analysis);
        } catch (err) {
            console.error("Error analyzing progress:", err);
            alert("Error al analizar el progreso.");
        } finally {
            setAnalyzing(false);
        }
    };

    if (!selectedStudent) {
        return (
            <div className="bg-surface border border-zinc-900 p-12 rounded-xl text-center">
                <Users className="mx-auto text-zinc-800 mb-4" size={48} />
                <h3 className="text-white font-medium text-lg">Selecciona un Alumno</h3>
                <p className="text-zinc-500 max-w-sm mx-auto mt-2">
                    Para visualizar el progreso, primero debes seleccionar un alumno de la lista.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="text-emerald-500" />
                    Evolución de {selectedStudent.full_name.split(' ')[0]}
                </h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                    <Plus size={16} />
                    Registrar Peso
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface border border-zinc-900 p-6 rounded-xl aspect-[16/9]">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Historial de Peso (kg)</span>
                    </div>
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="animate-spin text-primary" />
                        </div>
                    ) : measurements.length > 0 ? (
                        <ResponsiveContainer width="100%" height="80%">
                            <AreaChart data={measurements}>
                                <defs>
                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#52525b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={['dataMin - 2', 'dataMax + 2']}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #18181b', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#7c3aed"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorWeight)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                            <TrendingUp size={32} />
                            <p className="text-sm">Sin datos suficientes para graficar.</p>
                        </div>
                    )}
                </div>

            </div>

            <div className="space-y-6">
                <div className="bg-surface border border-zinc-900 p-6 rounded-xl">
                    <h4 className="text-sm font-semibold text-zinc-500 uppercase mb-4">Métricas Críticas</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-black rounded-lg border border-zinc-900">
                            <span className="text-zinc-400 text-sm">Peso Actual</span>
                            <span className="text-white font-bold">{measurements[measurements.length - 1]?.weight || selectedStudent?.weight || '--'} kg</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-black rounded-lg border border-zinc-900">
                            <span className="text-zinc-400 text-sm">Cambio Total</span>
                            <span className={`font-bold ${measurements.length > 1 && measurements[measurements.length - 1].weight < measurements[0].weight ? 'text-emerald-500' : 'text-zinc-500'
                                }`}>
                                {measurements.length > 1 ? (measurements[measurements.length - 1].weight - measurements[0].weight).toFixed(1) : '0'} kg
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleAnalyzeProgress}
                        disabled={analyzing || measurements.length < 2}
                        className="w-full mt-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {analyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className="text-amber-400" />}
                        {analyzing ? "Analizando..." : "Analizar Evolución con IA"}
                    </button>
                </div>

                {aiAnalysis && (
                    <div className="bg-primary/10 border border-primary/20 p-6 rounded-xl animate-in slide-in-from-bottom-5 fade-in duration-500">
                        <h4 className="text-sm font-bold text-primary uppercase mb-3 flex items-center gap-2">
                            <Sparkles size={16} /> Reporte de Inteligencia Artificial
                        </h4>
                        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {aiAnalysis}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal Simple para añadir peso */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                    <div className="bg-surface border border-zinc-900 p-6 rounded-2xl w-full max-w-xs space-y-4">
                        <h3 className="text-white font-bold">Nuevo Registro</h3>
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500">Peso en kg (Ej: 82.5)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={newWeight}
                                onChange={(e) => setNewWeight(e.target.value)}
                                autoFocus
                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-primary"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 text-zinc-500 text-sm">Cerrar</button>
                            <button onClick={handleAddMeasurement} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-bold">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TrainingGenerator = ({ selectedStudent, students, onSelectStudent, latestPlan, historicalPlans = [], onSavePlan }) => {
    const [data, setData] = useState({
        split: 'PPL (Push/Pull/Legs)',
        daysPerWeek: 4,
        experience: 'Intermedio',
        volume: 'Medio (6-7)',
        extraSport: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const chatEndRef = useRef(null);
    const trainingContentRef = useRef(null);

    const isDemoMode = !selectedStudent;
    const activeStudent = selectedStudent || MOCK_STUDENT;

    const prevStudentId = useRef(selectedStudent?.id);
    useEffect(() => {
        if (selectedStudent?.id !== prevStudentId.current) {
            if (latestPlan?.training_plan_text) {
                setChatMessages([{ role: 'assistant', content: latestPlan.training_plan_text }]);
                setShowChat(true);
            } else {
                setChatMessages([]);
                setShowChat(false);
            }
            prevStudentId.current = selectedStudent?.id;
        }
    }, [selectedStudent?.id, latestPlan]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleGenerateRoutine = async () => {
        setIsChatLoading(true);
        setShowChat(true);

        const initialUserMsg = `Genera una rutina ${data.split} de ${data.daysPerWeek} días para un nivel ${data.experience}. El volumen de entrenamiento debe ser: **${data.volume} ejercicios por sesión**. ${data.extraSport ? `Enfoque extra: mejorar en ${data.extraSport}.` : ''}`;

        setChatMessages([{ role: 'user', content: initialUserMsg }]);

        try {
            const response = await chatTrainingAssistant([], activeStudent, data);
            setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (err) {
            console.error("Error in training chat:", err);
            setChatMessages(prev => [...prev, { role: 'assistant', content: '❌ Error al generar la rutina. Inténtalo de nuevo.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg = chatInput;
        setChatInput('');

        const updatedHistory = [...chatMessages, { role: 'user', content: userMsg }];
        setChatMessages(updatedHistory);
        setIsChatLoading(true);

        try {
            const response = await chatTrainingAssistant(updatedHistory, activeStudent, data);
            setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (err) {
            console.error("Error in training chat:", err);
            setChatMessages(prev => [...prev, { role: 'assistant', content: '❌ Error en la respuesta. Inténtalo de nuevo.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedStudent) {
            alert("Selecciona un alumno primero.");
            return;
        }
        setIsSaving(true);
        const lastAIRoutined = [...chatMessages].reverse().find(m => m.role === 'assistant')?.content;

        try {
            await onSavePlan({
                student_id: selectedStudent.id,
                training_plan_text: lastAIRoutined || null,
                nutrition_plan_text: latestPlan?.nutrition_plan_text || null,
                supplementation_plan_text: latestPlan?.supplementation_plan_text || null,
                calories: latestPlan?.calories || 0,
                protein_g: latestPlan?.protein_g || 0,
                fat_g: latestPlan?.fat_g || 0,
                carbs_g: latestPlan?.carbs_g || 0,
                goal: latestPlan?.goal || selectedStudent.goal || 'maintenance'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportPDF = async () => {
        const lastAssistantMsg = [...chatMessages].reverse().find(m => m.role === 'assistant');
        if (!lastAssistantMsg) return;

        const element = document.getElementById('pdf-training-content');
        if (!element) {
            console.error("PDF element not found: pdf-training-content");
            alert("Error interno: No se encontró el contenido para el PDF.");
            return;
        }

        setIsExporting(true);

        const opt = {
            margin: 10,
            filename: `Rutina_${activeStudent.full_name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 1.5,
                backgroundColor: '#ffffff',
                useCORS: true,
                windowWidth: 720
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'], avoid: '.pdf-section' }
        };

        try {
            console.log("Generating Training PDF...");
            await html2pdf().set(opt).from(element).save();
            console.log("Training PDF generated successfully");
        } catch (err) {
            console.error("Error exporting Training PDF:", err);
            alert(`No se pudo generar el PDF de la rutina. Error: ${err.message || 'Error desconocido'}`);
        } finally {
            setIsExporting(false);
        }
    };

    const lastAIResponse = [...chatMessages].reverse().find(m => m.role === 'assistant');

    const MarkdownComponents = {
        td: ({ children }) => {
            const cellText = Array.isArray(children) ? children.join('') : String(children);
            const imageUrl = getExerciseImageUrl(cellText);
            const [hasError, setHasError] = useState(false);

            return (
                <td className="relative group">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">{children}</div>
                        {imageUrl && !hasError && (
                            <div className="w-12 h-12 flex-shrink-0 relative">
                                <img
                                    src={imageUrl}
                                    alt={cellText}
                                    onError={() => setHasError(true)}
                                    className="w-full h-full object-cover rounded border border-zinc-800 bg-black/40"
                                    loading="lazy"
                                />
                                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 h-32 z-50 pointer-events-none animate-in fade-in zoom-in duration-200">
                                    <img
                                        src={imageUrl}
                                        alt={cellText}
                                        className="w-full h-full object-cover rounded-lg border-2 border-primary shadow-2xl bg-black"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </td>
            );
        }
    };

    const PDFMarkdownComponents = {
        td: ({ children }) => {
            const cellText = Array.isArray(children) ? children.join('') : String(children);
            const imageUrl = getExerciseImageUrl(cellText);

            return (
                <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1 }}>{children}</div>
                        {imageUrl && (
                            <img
                                src={imageUrl}
                                alt={cellText}
                                style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        )}
                    </div>
                </td>
            );
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Vinculación de Alumno */}
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {selectedStudent ? (
                        <>
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {selectedStudent.full_name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-white font-medium">{selectedStudent.full_name}</p>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-wider">{selectedStudent.email}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-zinc-400 font-medium text-sm">Modo Libre</p>
                                <p className="text-zinc-600 text-[10px] uppercase tracking-wider">Selecciona un alumno para guardar</p>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <select
                            value={selectedStudent?.id || ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                const student = students.find(s => String(s.id) === String(val));
                                if (student) {
                                    onSelectStudent(student);
                                }
                            }}
                            className="appearance-none bg-black border border-zinc-800 rounded-lg px-4 py-2 pr-10 text-sm text-white focus:outline-none focus:border-primary transition-all cursor-pointer hover:border-zinc-700 w-full md:w-64"
                        >
                            <option value="" disabled>Seleccionar Alumno...</option>
                            {students && students.map(s => (
                                <option key={s.id} value={s.id}>{s.full_name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                            <ChevronRight size={16} className="rotate-90" />
                        </div>
                    </div>
                    {selectedStudent && (
                        <button
                            onClick={() => onSelectStudent(null)}
                            className="p-2 text-zinc-500 hover:text-white transition-colors"
                            title="Desvincular Alumno"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {!selectedStudent && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-500 text-sm flex items-center gap-3">
                    <Sparkles size={18} className="animate-pulse" />
                    <span>Selecciona un alumno para guardar su rutina permanentemente en su ficha.</span>
                </div>
            )}

            {/* Split Selector & Config */}
            <div className="bg-surface border border-zinc-900 p-6 rounded-xl space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <Dumbbell size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Configuración de Rutina</h3>
                            <p className="text-zinc-500 text-xs">Define el enfoque del entrenamiento</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isDemoMode ? (
                            <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1 text-blue-400 rounded-full border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                                <Sparkles size={10} />
                                Modo Prueba
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                                <Users size={14} className="text-zinc-500" />
                                <span className="text-xs text-white font-medium">{selectedStudent.full_name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo de Split</label>
                            <select
                                value={data.split}
                                onChange={(e) => setData({ ...data, split: e.target.value })}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
                            >
                                <option value="PPL (Push/Pull/Legs)">PPL (Push/Pull/Legs)</option>
                                <option value="Arnold Split">Arnold Split</option>
                                <option value="Upper/Lower">Upper / Lower</option>
                                <option value="Full Body">Full Body</option>
                                <option value="Bro Split (Músculo por día)">Bro Split</option>
                                <option value="Personalizado / Mixto">Personalizado</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Días por Semana</label>
                            <div className="flex gap-2">
                                {[2, 3, 4, 5, 6].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setData({ ...data, daysPerWeek: d })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${data.daysPerWeek === d
                                            ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                            : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                    >
                                        {d}d
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nivel de Experiencia</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Principiante', 'Intermedio', 'Avanzado'].map(exp => (
                                    <button
                                        key={exp}
                                        onClick={() => setData({ ...data, experience: exp })}
                                        className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${data.experience === exp
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                    >
                                        {exp}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Enfoque Deporte Extra (Opcional)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.extraSport}
                                    onChange={(e) => setData({ ...data, extraSport: e.target.value })}
                                    placeholder="Ej: Tenis, Boxeo, Fútbol..."
                                    className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 pl-9 text-sm text-white focus:border-primary outline-none placeholder:text-zinc-700"
                                />
                                <TrendingUp size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                            </div>
                        </div>

                        <div className="space-y-1.5 mt-4">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Volumen (Ejercicios/Día)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Bajo (4-5)', 'Medio (6-7)', 'Alto (8+)'].map(vol => (
                                    <button
                                        key={vol}
                                        onClick={() => setData({ ...data, volume: vol })}
                                        className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${data.volume === vol
                                            ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                                            : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                    >
                                        {vol}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button
                        onClick={handleGenerateRoutine}
                        disabled={isChatLoading}
                        className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles size={20} />
                        {isDemoMode ? "Probar Generador con IA" : "Generar Rutina con IA"}
                    </button>
                    {lastAIResponse && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isDemoMode}
                            className={`px-6 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold rounded-xl hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center gap-2 ${isDemoMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isDemoMode ? "Selecciona un alumno para guardar" : ""}
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            {isSaving ? "Guardando..." : "Guardar en Ficha"}
                        </button>
                    )}
                </div>

                {/* Training History Selector */}
                {historicalPlans.length > 1 && (
                    <div className="pt-4 border-t border-zinc-900 mt-4">
                        <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2 text-center underline italic decoration-blue-500/50">Historial de Rutinas Guardadas</label>
                        <select
                            className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 transition-all text-center"
                            onChange={(e) => {
                                const selected = historicalPlans.find(p => p.id === parseInt(e.target.value));
                                if (selected && selected.training_plan_text) {
                                    setChatMessages([{ role: 'assistant', content: selected.training_plan_text }]);
                                    setShowChat(true);
                                }
                            }}
                            defaultValue={latestPlan?.id}
                        >
                            {historicalPlans.map((p, i) => (
                                <option key={p.id} value={p.id}>
                                    Versión {historicalPlans.length - i} — {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Chat Assistant */}
            {showChat && (
                <div className="bg-surface border border-zinc-900 rounded-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="p-4 border-b border-zinc-900 bg-zinc-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageCircle size={18} className="text-blue-400" />
                            <h3 className="text-white font-bold text-sm">Entrenador Personal IA</h3>
                            <span className="text-zinc-600 text-xs">• Ajusta ejercicios o volumen por chat</span>
                        </div>
                        {lastAIResponse && (
                            <button
                                onClick={handleExportPDF}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                {isExporting ? 'Generando...' : 'Exportar a PDF'}
                            </button>
                        )}
                    </div>

                    <div className="max-h-[600px] overflow-y-auto p-4 space-y-4">
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-blue-500/10 text-white border border-blue-500/20 rounded-br-md'
                                    : 'bg-zinc-900 text-zinc-300 rounded-bl-md border border-zinc-800'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={MarkdownComponents}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p>{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl rounded-bl-md">
                                    <Loader2 className="animate-spin text-blue-400" size={20} />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-zinc-900 bg-black/50">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ej: Cambia las sentadillas por prensa, me duele la espalda..."
                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-blue-500 placeholder:text-zinc-600"
                                disabled={isChatLoading}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isChatLoading || !chatInput.trim()}
                                className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden PDF element */}
            {lastAIResponse && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <div id="pdf-training-content" style={{
                        width: '720px',
                        padding: '40px 35px',
                        color: '#1a1a1a',
                        backgroundColor: '#ffffff',
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        fontSize: '12px',
                        lineHeight: '1.6',
                        boxSizing: 'border-box'
                    }}>
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            #pdf-training-content * { color: #1a1a1a !important; border-color: #eeeeee !important; }
                            #pdf-training-content .text-primary { color: #7c3aed !important; }
                            #pdf-training-content h1, #pdf-training-content h2 { color: #3b82f6 !important; }
                        `}} />
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '2px solid #3b82f6' }}>
                            <h1 style={{ color: '#3b82f6', fontSize: '20px', margin: '0 0 8px 0', fontWeight: '700' }}>Plan de Entrenamiento Personalizado</h1>
                            <p style={{ color: '#666', fontSize: '12px', margin: '0' }}>
                                {selectedStudent?.full_name} • {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                            <p style={{ color: '#888', fontSize: '10px', marginTop: '4px' }}>
                                Split: {data.split} • {data.daysPerWeek} días • Nivel: {data.experience}
                            </p>
                        </div>

                        {/* Content */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .pdf-training-content h1, .pdf-training-content h2, .pdf-training-content h3 {
                                color: #1a1a1a;
                                margin-top: 18px;
                                margin-bottom: 8px;
                                font-weight: 700;
                            }
                            .pdf-training-content h2 { font-size: 15px; color: #3b82f6; border-bottom: 1px solid #eee; padding-bottom: 4px; }
                            .pdf-training-content h3 { font-size: 13px; }
                            .pdf-training-content p { margin: 6px 0; font-size: 11px; }
                            .pdf-training-content ul, .pdf-training-content ol { padding-left: 18px; margin: 6px 0; }
                            .pdf-training-content li { margin: 3px 0; font-size: 11px; }
                            .pdf-training-content table {
                                width: 100%;
                                border-collapse: collapse;
                                margin: 10px 0;
                                font-size: 10px;
                                table-layout: fixed;
                                word-wrap: break-word;
                            }
                            .pdf-training-content th {
                                background-color: #3b82f6;
                                color: white;
                                padding: 6px 8px;
                                text-align: left;
                                font-weight: 600;
                                font-size: 9px;
                                text-transform: uppercase;
                            }
                            .pdf-training-content td {
                                padding: 5px 8px;
                                border-bottom: 1px solid #eee;
                                font-size: 10px;
                                vertical-align: top;
                            }
                            .pdf-training-content tr:nth-child(even) { background-color: #f8fafc; }
                            .pdf-training-content tr:hover { background-color: #f1f5f9; }
                            .pdf-training-content strong { font-weight: 700; }
                            .pdf-training-content hr { border: none; border-top: 1px solid #ddd; margin: 15px 0; }
                        `}} />
                        <div className="pdf-training-content">
                            {(() => {
                                const text = lastAIResponse.content || '';
                                const rawSections = text.split(/(?=^#{2,3}\s)/m);
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
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={PDFMarkdownComponents}
                                            >
                                                {section}
                                            </ReactMarkdown>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AsesoriasDashboard;
