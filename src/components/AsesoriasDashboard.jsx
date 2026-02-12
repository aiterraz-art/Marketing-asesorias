import { getStudents, getStudentPlan, saveStudentPlan, updateStudentData } from '../lib/supabase';

const AsesoriasDashboard = ({ activeTab, setActiveTab, selectedStudent, setSelectedStudent }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStudents = async () => {
            try {
                const data = await getStudents();
                setStudents(data);
            } catch (err) {
                console.error("Error loading students:", err);
            } finally {
                setLoading(false);
            }
        };
        loadStudents();
    }, []);

    // Mapeamos las pestañas del sidebar a los sub-componentes internos
    const activeSubTab = activeTab === 'nutricion' ? 'calculadora' :
        activeTab === 'alumnos' ? 'alumnos' :
            activeTab === 'rutinas' ? 'rutinas' :
                activeTab === 'progreso' ? 'progreso' : 'alumnos';

    const setSubTab = (tab) => {
        // Al hacer clic internamente, también actualizamos el estado global (sidebar)
        const tabMap = { 'alumnos': 'alumnos', 'calculadora': 'nutricion', 'rutinas': 'rutinas', 'progreso': 'progreso' };
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
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                        <UserPlus size={18} />
                        Nuevo Alumno
                    </button>
                </div>
            </header>

            {/* Mini Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Alumnos Activos" value="12" icon={<Users className="text-primary" size={20} />} trend="+2 este mes" />
                <StatCard title="Planes Pendientes" value="3" icon={<Calculator className="text-amber-500" size={20} />} trend="Revisión urgente" />
                <StatCard title="Progreso Promedio" value="±4.2%" icon={<TrendingUp className="text-emerald-500" size={20} />} trend="Baja de grasa" />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-900">
                <SubTab label="Alumnos" isActive={activeSubTab === 'alumnos'} onClick={() => setSubTab('alumnos')} icon={<Users size={18} />} />
                <SubTab label="Calculadora" isActive={activeSubTab === 'calculadora'} onClick={() => setSubTab('calculadora')} icon={<Calculator size={18} />} />
                <SubTab label="Rutinas" isActive={activeSubTab === 'rutinas'} onClick={() => setSubTab('rutinas')} icon={<Dumbbell size={18} />} />
                <SubTab label="Progreso" isActive={activeSubTab === 'progreso'} onClick={() => setSubTab('progreso')} icon={<TrendingUp size={18} />} />
            </div>

            <main className="min-h-[400px]">
                {activeSubTab === 'alumnos' && (
                    <StudentList
                        students={students}
                        loading={loading}
                        selectedId={selectedStudent?.id}
                        onSelect={setSelectedStudent}
                    />
                )}
                {activeSubTab === 'calculadora' && (
                    <NutritionCalculator
                        selectedStudent={selectedStudent}
                        onSavePlan={async (plan) => {
                            try {
                                await saveStudentPlan(plan);
                                alert("¡Plan guardado con éxito!");
                            } catch (err) {
                                console.error("Error saving plan:", err);
                                alert("Error al guardar el plan.");
                            }
                        }}
                    />
                )}
                {activeSubTab === 'rutinas' && <RoutineDesigner selectedStudent={selectedStudent} />}
                {activeSubTab === 'progreso' && <ProgressTracker selectedStudent={selectedStudent} />}
            </main>
        </div>
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

const StudentList = ({ students, loading, onSelect, selectedId }) => (
    <div className="bg-surface border border-zinc-900 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                    type="text"
                    placeholder="Buscar alumno..."
                    className="w-full bg-black border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
                />
            </div>
        </div>
        <div className="divide-y divide-zinc-900">
            {loading ? (
                <div className="p-12 text-center text-zinc-500">Cargando alumnos...</div>
            ) : students.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">No hay alumnos registrados.</div>
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
                            <p className="text-zinc-500 text-xs">{s.goal === 'cut' ? 'Definición' : s.goal === 'bulk' ? 'Volumen' : 'Mantenimiento'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-zinc-400 text-sm font-medium">{s.weight}kg</span>
                            <span className="text-zinc-600 text-[10px] uppercase tracking-wider">{s.age} años</span>
                        </div>
                        <ChevronRight className={`transition-colors ${selectedId === s.id ? 'text-primary' : 'text-zinc-700 group-hover:text-primary'}`} size={20} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const NutritionCalculator = ({ selectedStudent, onSavePlan }) => {
    const [data, setData] = useState({
        weight: selectedStudent?.weight || 80,
        height: selectedStudent?.height || 180,
        age: selectedStudent?.age || 25,
        activity: selectedStudent?.activity_level || 1.2,
        goal: selectedStudent?.goal || 'maintenance',
        protein: 160,
        fat: 70
    });

    const [results, setResults] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Actualizar datos si cambia el alumno seleccionado
    useEffect(() => {
        if (selectedStudent) {
            setData(prev => ({
                ...prev,
                weight: selectedStudent.weight || prev.weight,
                height: selectedStudent.height || prev.height,
                age: selectedStudent.age || prev.age,
                activity: selectedStudent.activity_level || prev.activity,
                goal: selectedStudent.goal || prev.goal
            }));
        }
    }, [selectedStudent]);

    // Simulación de llamada a la función SQL de Supabase
    const calculate = () => {
        const tmb = (10 * data.weight) + (6.25 * data.height) - (5 * data.age) + 5;
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

    const handleSave = async () => {
        if (!selectedStudent) {
            alert("Por favor, selecciona un alumno primero.");
            return;
        }
        setIsSaving(true);
        try {
            await onSavePlan({
                student_id: selectedStudent.id,
                calories: results.calories,
                protein_g: data.protein,
                fat_g: data.fat,
                carbs_g: results.carbs,
                goal: data.goal
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {!selectedStudent && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-500 text-sm flex items-center gap-3">
                    <Users size={18} />
                    <span>Estás en modo libre. Selecciona un alumno en la lista para guardar su plan permanentemente.</span>
                </div>
            )}

            {selectedStudent && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                            {selectedStudent.full_name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-white font-medium text-sm">Editando plan para: {selectedStudent.full_name}</p>
                            <p className="text-zinc-500 text-[10px] uppercase">ID: #{selectedStudent.id}</p>
                        </div>
                    </div>
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

                        <button
                            disabled={isSaving}
                            onClick={handleSave}
                            className={`w-full py-4 mt-8 text-white border border-zinc-800 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-zinc-800 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'
                                }`}
                        >
                            {isSaving ? "Guardando..." : (
                                <>
                                    <TrendingUp size={20} />
                                    {selectedStudent ? `Guardar Plan para ${selectedStudent.full_name.split(' ')[0]}` : "Asignar Plan"}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
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

const ProgressTracker = () => (
    <div className="bg-surface border border-zinc-900 p-8 rounded-xl text-center">
        <TrendingUp className="mx-auto text-zinc-700 mb-4" size={48} />
        <h3 className="text-white font-medium text-lg">Seguimiento de Progreso</h3>
        <p className="text-zinc-500 max-w-sm mx-auto mt-2">
            Visualiza gráficamente la evolución de tus alumnos: peso, % de grasa y medidas antropométricas.
        </p>
    </div>
);

export default AsesoriasDashboard;
