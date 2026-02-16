import React, { useState } from 'react';
import { Apple, ArrowRightLeft, Sparkles, Loader2, Pill, Clipboard, CheckCircle2 } from 'lucide-react';
import { calculateFoodSubstitution, generateSupplementsProtocol } from '../lib/openai';
import { saveStudentPlan } from '../lib/supabase';

export default function NutritionAssistant({ selectedStudent, latestPlan, onPlanSaved }) {
    const [isSavingStack, setIsSavingStack] = useState(false);
    const [targetFood, setTargetFood] = useState('');
    const [originalFood, setOriginalFood] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    const [substitutionResult, setSubstitutionResult] = useState(null);
    const [isGeneratingSupps, setIsGeneratingSupps] = useState(false);
    const [suppsResult, setSuppsResult] = useState(null);

    const handleCalculateSubstitution = async () => {
        if (!originalFood || !targetFood) return;
        setIsCalculating(true);
        try {
            const result = await calculateFoodSubstitution(originalFood, targetFood);
            setSubstitutionResult(result);
        } catch (error) {
            console.error("Error calculating substitution:", error);
        } finally {
            setIsCalculating(false);
        }
    };

    const handleGenerateSupps = async () => {
        if (!selectedStudent) return;
        setIsGeneratingSupps(true);
        try {
            const result = await generateSupplementsProtocol(selectedStudent, selectedStudent.goal);
            setSuppsResult(result);
        } catch (error) {
            console.error("Error generating supplements:", error);
        } finally {
            setIsGeneratingSupps(false);
        }
    };

    const handleSaveStack = async () => {
        if (!suppsResult || !selectedStudent) return;
        setIsSavingStack(true);
        try {
            await saveStudentPlan({
                student_id: selectedStudent.id,
                supplementation_plan_text: suppsResult.protocol,
                // Mantener datos anteriores si existen
                nutrition_plan_text: latestPlan?.nutrition_plan_text || null,
                training_plan_text: latestPlan?.training_plan_text || null,
                calories: latestPlan?.calories || 0,
                protein_g: latestPlan?.protein_g || 0,
                fat_g: latestPlan?.fat_g || 0,
                carbs_g: latestPlan?.carbs_g || 0,
                goal: latestPlan?.goal || selectedStudent.goal || 'maintenance'
            });
            alert("Protocolo de suplementación guardado en la ficha del alumno.");
            if (onPlanSaved) onPlanSaved();
        } catch (error) {
            console.error("Error saving stack:", error);
            alert("Error al guardar el stack.");
        } finally {
            setIsSavingStack(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Copiado al portapapeles!");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Food Substitution Motor */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6 text-primary">
                    <ArrowRightLeft size={24} />
                    <h2 className="text-xl font-bold text-white">Motor de Sustitución</h2>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400 font-black uppercase italic tracking-widest flex items-center gap-2">
                            <Apple size={14} className="text-zinc-600" /> Alimento Actual
                        </label>
                        <input
                            type="text"
                            value={originalFood}
                            onChange={(e) => setOriginalFood(e.target.value)}
                            placeholder="Ej: 100g de Arroz Blanco"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-700 focus:border-primary transition-all font-medium"
                        />
                    </div>

                    <div className="flex justify-center py-2">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-lg">
                            <ArrowRightLeft size={16} className="text-zinc-400" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400 font-black uppercase italic tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="text-zinc-600" /> Sustituto Deseado
                        </label>
                        <input
                            type="text"
                            value={targetFood}
                            onChange={(e) => setTargetFood(e.target.value)}
                            placeholder="Ej: Papa Cocida"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-700 focus:border-primary transition-all font-medium"
                        />
                    </div>

                    <button
                        onClick={handleCalculateSubstitution}
                        disabled={isCalculating || !originalFood || !targetFood}
                        className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                        {isCalculating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                        Calcular Equivalencia IA
                    </button>
                </div>

                {substitutionResult && (
                    <div className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-xl p-6 lg:p-8 space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between">
                            <span className="text-primary font-black uppercase italic tracking-tighter text-lg leading-none">Resultado</span>
                            <button onClick={() => copyToClipboard(`${substitutionResult.original_qty} de ${originalFood} = ${substitutionResult.substituted_qty} de ${targetFood}`)} className="text-zinc-500 hover:text-white transition-colors">
                                <Clipboard size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Nueva Cantidad</span>
                                <p className="text-3xl font-black text-white italic leading-none">{substitutionResult.substituted_qty}</p>
                            </div>

                            <p className="text-sm text-zinc-300 italic p-3 bg-zinc-900/50 rounded-lg border-l-2 border-primary">
                                "{substitutionResult.explanation}"
                            </p>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                    <span className="text-[8px] text-zinc-500 uppercase font-black block mb-1">Delta Calórico</span>
                                    <p className="text-xs font-bold text-emerald-400 leading-none">{substitutionResult.macros_difference}</p>
                                </div>
                                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                    <span className="text-[8px] text-zinc-500 uppercase font-black block mb-1">Status</span>
                                    <p className="text-xs font-bold text-primary leading-none">EQUIVALENTE</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Supplements Generator */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6 text-primary">
                    <Pill size={24} />
                    <h2 className="text-xl font-bold text-white">Protocolos de Suplementación</h2>
                </div>

                {!selectedStudent ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30">
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                            <Pill className="text-zinc-700" size={32} />
                        </div>
                        <p className="text-zinc-500 font-medium">Selecciona un alumno para generar un protocolo personalizado de clase mundial.</p>
                    </div>
                ) : (
                    <div className="space-y-6 flex-1 flex flex-col">
                        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white leading-none mb-1">{selectedStudent.full_name}</h3>
                                    <p className="text-xs text-zinc-500 font-medium italic">Objetivo: {selectedStudent.goal === 'cut' ? 'Definición' : selectedStudent.goal === 'bulk' ? 'Volumen' : 'Mantenimiento'}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-primary italic leading-none">{selectedStudent.weight}kg</span>
                                    <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Peso Actual</p>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateSupps}
                                disabled={isGeneratingSupps}
                                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 border border-zinc-700"
                            >
                                {isGeneratingSupps ? <Loader2 className="animate-spin" size={20} /> : <Sparkles className="text-primary" size={20} />}
                                Generar Stack Pro
                            </button>
                        </div>

                        {suppsResult && (
                            <div className="flex-1 bg-zinc-950 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>

                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Validado Científicamente</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleSaveStack}
                                                disabled={isSavingStack}
                                                className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase hover:bg-primary/20 transition-all disabled:opacity-50"
                                            >
                                                {isSavingStack ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                Guardar en Ficha
                                            </button>
                                            <button onClick={() => copyToClipboard(suppsResult.protocol)} className="text-zinc-600 hover:text-white transition-colors">
                                                <Clipboard size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="prose prose-invert prose-xs max-w-none text-zinc-400 font-medium leading-relaxed max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {suppsResult.protocol.split('\n').map((line, i) => (
                                            <p key={i} className="mb-2">{line}</p>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                                        <div className="space-y-1">
                                            <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest block">Beneficio Clave</span>
                                            <p className="text-[10px] font-bold text-primary italic leading-tight">{suppsResult.key_benefit}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest block">Inversión Estimada</span>
                                            <p className="text-[10px] font-bold text-white leading-tight">{suppsResult.total_cost_estimate}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
