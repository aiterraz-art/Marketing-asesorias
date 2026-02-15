import React, { useState, useEffect } from 'react';
import {
    User, Camera, Ruler, Activity, Target, Sparkles,
    ArrowRight, ArrowLeft, Check, X, Upload, Info,
    Zap, Moon, Brain, Clipboard, ChevronRight, Loader2
} from 'lucide-react';

const InitialMeetingAssistant = ({ isOpen, onClose, onCreateStudent }) => {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        age: '',
        sex: 'male',
        weight: '',
        height: '',
        body_fat_pct: '',
        activity_level: 1.2,
        goal: 'maintenance',
        sleep_hours: 7,
        stress_level: 'medium',
        experience: 'beginner',
        equipment: 'gym',
        injuries: '',
        main_motivation: '',
        photo_url: null,
        photoFile: null
    });

    const steps = [
        { id: 1, title: 'Identidad', icon: <User size={18} /> },
        { id: 2, title: 'Registro Visual', icon: <Camera size={18} /> },
        { id: 3, title: 'Antropometría', icon: <Ruler size={18} /> },
        { id: 4, title: 'Estilo de Vida', icon: <Activity size={18} /> },
        { id: 5, title: 'Visión de Éxito', icon: <Target size={18} /> },
        { id: 6, title: 'Estrategia', icon: <Sparkles size={18} /> }
    ];

    const nextStep = () => setStep(prev => Math.min(prev + 1, 6));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSave = async () => {
        if (!formData.full_name) {
            alert("El nombre es obligatorio");
            setStep(1);
            return;
        }
        setIsSaving(true);
        try {
            await onCreateStudent(formData);
            onClose();
        } catch (err) {
            console.error("Error creating student from wizard:", err);
            alert("Error al crear el alumno");
        } finally {
            setIsSaving(false);
        }
    };

    const calculateMacrosPreview = () => {
        const weight = parseFloat(formData.weight) || 75;
        const height = parseFloat(formData.height) || 175;
        const age = parseInt(formData.age) || 25;
        const activity = parseFloat(formData.activity_level) || 1.2;

        const tmb = formData.sex === 'male'
            ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
            : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);

        const tdee = tmb * activity;
        let targetCals = tdee;
        if (formData.goal === 'cut') targetCals = tdee * 0.8;
        else if (formData.goal === 'bulk') targetCals = tdee * 1.1;

        return {
            calories: Math.round(targetCals),
            protein: Math.round(weight * 2), // 2g/kg base
            fat: Math.round(weight * 0.8),    // 0.8g/kg base
        };
    };

    if (!isOpen) return null;

    const macros = calculateMacrosPreview();

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-surface border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header Wizards */}
                <div className="p-8 border-b border-zinc-800 bg-zinc-900/40 relative">
                    <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-primary/20 rounded-xl">
                            <Sparkles className="text-primary" size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white tracking-tight">Reunión Inicial</h3>
                            <p className="text-zinc-500 text-sm">Configurando el camino al éxito para {formData.full_name || 'nuevo alumno'}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex justify-between items-center gap-2">
                        {steps.map((s) => (
                            <div key={s.id} className="flex-1 space-y-2">
                                <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= s.id ? 'bg-primary shadow-[0_0_10px_rgba(124,58,237,0.4)]' : 'bg-zinc-800'}`} />
                                <div className={`flex items-center gap-1.5 justify-center md:justify-start ${step === s.id ? 'text-primary' : 'text-zinc-600'}`}>
                                    <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest">{s.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {/* STEP 1: IDENTITY */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-4">
                                <h4 className="text-lg font-bold text-white">¿Con quién estamos hoy?</h4>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nombre Completo</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="Ej: Juan Pérez"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-primary transition-all text-lg"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Edad</label>
                                        <input
                                            type="number"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            placeholder="25"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sexo Biológico</label>
                                        <div className="flex gap-2">
                                            {['male', 'female'].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setFormData({ ...formData, sex: s })}
                                                    className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all border ${formData.sex === s ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}
                                                >
                                                    {s === 'male' ? 'HOMBRE' : 'MUJER'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PHOTO */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="text-center space-y-4 py-4">
                                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-zinc-700">
                                    <Camera className="text-zinc-600" size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-white">Registro Visual Inicial</h4>
                                <p className="text-zinc-500 text-sm max-w-sm mx-auto">Sube una foto actual del alumno para estimar el % de grasa y marcar el punto de partida.</p>

                                <div className="relative group max-w-md mx-auto">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setFormData({
                                                    ...formData,
                                                    photo_url: URL.createObjectURL(file),
                                                    photoFile: file
                                                });
                                            }
                                        }}
                                    />
                                    <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-12 group-hover:border-primary transition-all bg-zinc-950 flex flex-col items-center gap-3">
                                        {formData.photo_url ? (
                                            <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-zinc-700">
                                                <img src={formData.photo_url} alt="Vista previa" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Upload size={20} className="text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload size={24} className="text-zinc-700 group-hover:text-primary transition-colors" />
                                                <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Arrastra o selecciona foto</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-center">
                                    <button
                                        onClick={nextStep}
                                        className="text-zinc-500 hover:text-white text-xs font-bold underline underline-offset-4 decoration-zinc-800"
                                    >
                                        Prefiero hacerlo más tarde
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: ANTHROPOMETRY */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <h4 className="text-lg font-bold text-white">Métricas Físicas</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Peso (kg)</label>
                                    <input
                                        type="number"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        placeholder="Ej: 75"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-primary transition-all text-xl font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Altura (cm)</label>
                                    <input
                                        type="number"
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                        placeholder="Ej: 175"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-primary transition-all text-xl font-bold"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">% de Grasa Estimado</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="3"
                                            max="45"
                                            value={formData.body_fat_pct || 15}
                                            onChange={(e) => setFormData({ ...formData, body_fat_pct: e.target.value })}
                                            className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="w-16 h-12 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center font-bold text-primary">
                                            {formData.body_fat_pct || '?'}%
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-zinc-600 italic">* Usa la foto del paso anterior para guiarte.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: LIFESTYLE */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <h4 className="text-lg font-bold text-white">Variables Ambientales</h4>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        <Activity size={12} /> Nivel de Actividad Diaria
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { v: 1.2, t: 'Sedentario', d: 'Oficina, poco movimiento' },
                                            { v: 1.375, t: 'Ligero', d: '1-3 entrenamientos/semana' },
                                            { v: 1.55, t: 'Moderado', d: '3-5 entrenamientos/semana' },
                                            { v: 1.725, t: 'Intenso', d: '6-7 entrenamientos/semana' }
                                        ].map(opt => (
                                            <button
                                                key={opt.v}
                                                onClick={() => setFormData({ ...formData, activity_level: opt.v })}
                                                className={`p-4 rounded-xl text-left border transition-all ${formData.activity_level === opt.v ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(124,58,237,0.1)]' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                                            >
                                                <p className={`font-bold text-sm ${formData.activity_level === opt.v ? 'text-primary' : 'text-white'}`}>{opt.t}</p>
                                                <p className="text-xs text-zinc-500">{opt.d}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                            <Moon size={12} /> Sueño (hrs)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.sleep_hours}
                                            onChange={(e) => setFormData({ ...formData, sleep_hours: e.target.value })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                            <Brain size={12} /> Estrés
                                        </label>
                                        <select
                                            value={formData.stress_level}
                                            onChange={(e) => setFormData({ ...formData, stress_level: e.target.value })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-primary"
                                        >
                                            <option value="low">Bajo</option>
                                            <option value="medium">Medio</option>
                                            <option value="high">Alto</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: GOALS */}
                    {step === 5 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <h4 className="text-lg font-bold text-white">Visión de Éxito</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Objetivo Principal</label>
                                    <div className="flex gap-2">
                                        {[
                                            { v: 'cut', t: 'DEFINICIÓN', i: <Zap size={14} /> },
                                            { v: 'maintenance', t: 'MANTENER', i: <Check size={14} /> },
                                            { v: 'bulk', t: 'VOLUMEN', i: <Activity size={14} /> }
                                        ].map(opt => (
                                            <button
                                                key={opt.v}
                                                onClick={() => setFormData({ ...formData, goal: opt.v })}
                                                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${formData.goal === opt.v ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                                            >
                                                {opt.i}
                                                <span className="text-[10px] font-black">{opt.t}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Lesiones o limitaciones</label>
                                    <textarea
                                        value={formData.injuries}
                                        onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                                        placeholder="Ej: Dolor lumbar, cirugía de rodilla..."
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-primary transition-all resize-none h-24"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Motivación principal</label>
                                    <input
                                        type="text"
                                        value={formData.main_motivation}
                                        onChange={(e) => setFormData({ ...formData, main_motivation: e.target.value })}
                                        placeholder="Ej: Salud, estética, competir..."
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 6: STRATEGY */}
                    {step === 6 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                    <Check className="text-emerald-500" size={32} />
                                </div>
                                <h4 className="text-2xl font-bold text-white">¡Estrategia Lista!</h4>
                                <p className="text-zinc-500 text-sm">Esto es lo que configuraremos para empezar</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2">Plan Nutricional Base</p>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-zinc-400 text-sm">Calorías Objetivo</span>
                                            <span className="text-2xl font-black text-white">{macros.calories} <span className="text-xs font-normal text-zinc-600">kcal</span></span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 pt-2">
                                            <div className="p-3 bg-zinc-900/50 rounded-xl text-center">
                                                <p className="text-[9px] font-bold text-zinc-600 uppercase">Prot</p>
                                                <p className="text-sm font-bold text-white">{macros.protein}g</p>
                                            </div>
                                            <div className="p-3 bg-zinc-900/50 rounded-xl text-center">
                                                <p className="text-[9px] font-bold text-zinc-600 uppercase">Gras</p>
                                                <p className="text-sm font-bold text-white">{macros.fat}g</p>
                                            </div>
                                            <div className="p-3 bg-zinc-900/50 rounded-xl text-center">
                                                <p className="text-[9px] font-bold text-zinc-600 uppercase">Carb</p>
                                                <p className="text-sm font-bold text-white">---g</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2">Resumen de Alumno</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Alumno</span>
                                            <span className="text-white font-medium">{formData.full_name}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Objetivo</span>
                                            <span className="text-primary font-bold uppercase">{formData.goal}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Punto Partida</span>
                                            <span className="text-white">{formData.weight}kg / {formData.body_fat_pct || '?'}% grasa</span>
                                        </div>
                                    </div>
                                    <div className="pt-2 flex items-center gap-2 text-[10px] text-zinc-600 italic">
                                        <Info size={12} /> Se creará la ficha y se agendará la primera sesión.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Buttons */}
                <div className="p-8 border-t border-zinc-800 bg-zinc-900/20 flex items-center justify-between">
                    <button
                        onClick={prevStep}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                    >
                        <ArrowLeft size={18} /> ATRÁS
                    </button>

                    <div className="flex gap-3">
                        {step < 6 ? (
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                CONTINUAR <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-black text-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} /> GUARDANDO...
                                    </>
                                ) : (
                                    <>
                                        CREAR FICHA <Zap size={18} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InitialMeetingAssistant;
