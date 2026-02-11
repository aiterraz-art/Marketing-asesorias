import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Settings, Copy, Check, ChevronRight, Loader2, Mic } from 'lucide-react';
import PromptBuilderModal from './PromptBuilderModal';
import BrandVoiceManager from './BrandVoiceManager';
import { generateContentIdeas } from '../lib/openai';
import { supabase, getBrandVoices } from '../lib/supabase';

export default function ContentGeneratorPanel() {
    const [idea, setIdea] = useState('');
    const [contentType, setContentType] = useState('reel');
    const [mode, setMode] = useState('single'); // 'single' | 'weekly'
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Prompt Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [mood, setMood] = useState('Inspirador');
    const [check, setCheck] = useState({ verifyHooks: true, includeCta: true });

    // Brand Voice State
    const [showVoiceManager, setShowVoiceManager] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);

    useEffect(() => {
        loadVoices();
    }, [showVoiceManager]); // Reload when manager closes in case of changes

    async function loadVoices() {
        try {
            const data = await getBrandVoices();
            setVoices(data);
            if (data.length > 0 && !selectedVoice) {
                // Auto-select default or first
                const def = data.find(v => v.is_default) || data[0];
                setSelectedVoice(def);
            }
        } catch (e) {
            console.error("Error loading voices", e);
        }
    }

    const handleGenerate = async () => {
        if (!idea.trim()) return;

        setIsGenerating(true);
        setResult(null);

        try {
            // Construct payload 
            const payload = {
                idea,
                type: contentType,
                settings: {
                    mood,
                    check,
                    brandVoice: selectedVoice // Pass selected voice
                },
                mode // Pass mode to API
            };

            const data = await generateContentIdeas(payload);
            setResult(data);
        } catch (error) {
            console.error("Failed to generate content", error);
            alert("Error al generar contenido: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveToCalendar = async () => {
        if (!result) return;
        setIsSaving(true);

        const itemsToSave = [];
        const today = new Date();

        if (result.weeklyPlan) {
            // Weekly Plan Saving
            result.weeklyPlan.forEach((item, index) => {
                const date = new Date(today);
                date.setDate(today.getDate() + index); // +0, +1, +2...

                itemsToSave.push({
                    title: item.title,
                    type: item.type || contentType,
                    status: 'idea',
                    script_content: item.script,
                    production_plan: item.productionPlan,
                    ads_copy: item.adsCopy, // Can be null if not ad
                    idea_prompt: idea,
                    scheduled_date: date.toISOString()
                });
            });
        } else {
            // Single Item Saving
            itemsToSave.push({
                title: `Generado: ${idea.substring(0, 30)}...`,
                type: contentType,
                status: 'idea',
                script_content: result.script,
                production_plan: result.productionPlan,
                ads_copy: result.adsCopy,
                idea_prompt: idea,
                scheduled_date: today.toISOString()
            });
        }

        try {
            const { error } = await supabase
                .from('content_items')
                .insert(itemsToSave);

            if (error) throw error;
            alert(result.weeklyPlan ? '¡Plan Semanal agendado!' : '¡Contenido guardado!');
            setIdea('');
            setResult(null);
            setMode('single'); // Reset
        } catch (error) {
            console.error('Error saving content:', error);
            alert('Error al guardar el contenido.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[calc(100vh-100px)] p-6 lg:p-0">

            {/* Input Panel */}
            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-xl flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-6 text-primary">
                        <Sparkles size={24} />
                        <h2 className="text-xl font-bold text-white">Generador IA</h2>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Mode Selector */}
                        <div className="bg-zinc-900 p-1 rounded-lg flex border border-zinc-800">
                            <button
                                onClick={() => setMode('single')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'single' ? 'bg-zinc-800 text-white shadow ring-1 ring-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Una Idea
                            </button>
                            <button
                                onClick={() => setMode('weekly')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'weekly' ? 'bg-primary text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Plan Semanal (7)
                            </button>
                        </div>

                        {/* Brand Voice Selector */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-zinc-400">Voz de Marca</label>
                                <button
                                    onClick={() => setShowVoiceManager(true)}
                                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                                >
                                    <Settings size={12} /> Gestionar
                                </button>
                            </div>
                            <button
                                onClick={() => setShowVoiceManager(true)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-zinc-700 transition-colors group text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-md">
                                        <Mic size={16} />
                                    </div>
                                    <div>
                                        <span className="block text-white text-sm font-medium truncate">
                                            {selectedVoice ? selectedVoice.name : 'Seleccionar Voz...'}
                                        </span>
                                        <span className="block text-zinc-500 text-xs truncate max-w-[200px]">
                                            {selectedVoice ? selectedVoice.description : 'Define el tono de tu IA'}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Tipo de Contenido</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['reel', 'story', 'post'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setContentType(type)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all capitalize ${contentType === type
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Tu Idea o Tema</label>
                            <textarea
                                value={idea}
                                onChange={(e) => setIdea(e.target.value)}
                                placeholder="Ej: 3 errores comunes al hacer sentadillas..."
                                className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-all"
                            />
                        </div>

                        <button
                            onClick={() => setShowSettings(true)}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors w-max"
                        >
                            <Settings size={16} />
                            Configuración Avanzada
                        </button>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !idea.trim()}
                        className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold text-white transition-all mt-6 ${isGenerating || !idea.trim()
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/25'
                            }`}
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                        {isGenerating ? 'Generando...' : 'Generar Contenido'}
                    </button>
                </div>
            </div>

            {/* Output Panel */}
            <div className="lg:col-span-8 bg-surface border border-zinc-800 rounded-xl p-8 lg:overflow-y-auto shadow-xl relative min-h-[500px]">
                {!result ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 opacity-50">
                        <Sparkles size={48} className="mb-4 text-zinc-700" />
                        <p className="text-lg">El contenido generado aparecerá aquí</p>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Weekly Plan View */}
                        {result.weeklyPlan ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white">Plan Semanal Generado 🗓️</h3>
                                    <span className="text-sm text-zinc-400">7 Días de Contenido</span>
                                </div>

                                {result.weeklyPlan.map((item, index) => (
                                    <div key={index} className={`border rounded-lg p-5 transition-all ${item.isAdCandidate ? 'bg-indigo-900/20 border-indigo-500/50 hover:bg-indigo-900/30' : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-primary font-bold text-sm uppercase tracking-wider">Día {item.day}</span>
                                                <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400 capitalize">{item.type}</span>
                                                {item.isAdCandidate && (
                                                    <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded font-bold animate-pulse flex items-center gap-1">
                                                        📢 Ad Sugerido
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <h4 className="text-white font-bold text-lg mb-2">{item.title}</h4>

                                        {item.isAdCandidate && (
                                            <p className="text-xs text-indigo-300 mb-3 italic border-l-2 border-indigo-500 pl-2">
                                                💡 {item.reasoning}
                                            </p>
                                        )}

                                        <p className="text-zinc-400 text-sm line-clamp-3 mb-3">{item.script}</p>

                                        {item.isAdCandidate && item.adsCopy && (
                                            <div className="bg-black/30 p-3 rounded border border-indigo-500/30 text-xs text-zinc-300 mt-2">
                                                <span className="font-bold text-indigo-400 block mb-1">Copy para Ad:</span>
                                                {item.adsCopy}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Single Content View */
                            <>
                                <Section title="Guion / Estructura" content={result.script} />
                                <Section title="Plan de Producción" content={result.productionPlan} />
                                <Section title="Copy para Meta Ads" content={result.adsCopy} />
                            </>
                        )}

                        <div className="pt-8 flex justify-end gap-3">
                            <button
                                onClick={() => setResult(null)}
                                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                            >
                                Descartar
                            </button>
                            <button
                                onClick={handleSaveToCalendar}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} className="text-emerald-500" />}
                                {isSaving ? 'Guardando...' : result.weeklyPlan ? 'Agendar Semana Completa' : 'Añadir al Calendario'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <PromptBuilderModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                check={check}
                setCheck={setCheck}
                mood={mood}
                setMood={setMood}
            />

            <BrandVoiceManager
                isOpen={showVoiceManager}
                onClose={() => setShowVoiceManager(false)}
                onSelectVoice={(voice) => {
                    setSelectedVoice(voice);
                    setShowVoiceManager(false);
                }}
            />
        </div>
    );
}

const Section = ({ title, content }) => (
    <div className="group">
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ChevronRight size={20} className="text-primary" />
                {title}
            </h3>
            <button className="text-zinc-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                <Copy size={16} />
            </button>
        </div>
        <div className="bg-zinc-900/50 rounded-lg p-6 text-zinc-300 leading-relaxed border border-zinc-800 whitespace-pre-line">
            {content}
        </div>
    </div>
);
