import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Settings, Copy, Check, ChevronRight, Loader2, Mic, Download } from 'lucide-react';
import PromptBuilderModal from './PromptBuilderModal';
import BrandVoiceManager from './BrandVoiceManager';
import { generateContentIdeas, generateImage } from '../lib/openai';
import { supabase, getBrandVoices } from '../lib/supabase';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function ContentGeneratorPanel() {
    const [idea, setIdea] = useState('');
    const [contentType, setContentType] = useState('reel');
    const [mode, setMode] = useState('single'); // 'single' | 'weekly'
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [generatedImagePrompt, setGeneratedImagePrompt] = useState('');

    // ... (existing useEffects and handlers)

    const handleGenerateImage = async () => {
        if (!result) return;
        setIsGeneratingImage(true);
        try {
            // Create a visual prompt based on the content
            const visualPrompt = result.weeklyPlan
                ? `Fitness content related to ${result.weeklyPlan[0].title}`
                : `${result.title || idea}. ${result.script ? result.script.substring(0, 100) : ''}`;

            const { url, prompt } = await generateImage(visualPrompt);
            setGeneratedImage(url);
            setGeneratedImagePrompt(prompt);

            // If saving happens later, we need to merge this into the result for saving? 
            // Or just keep it in state and save it when "Save to Calendar" is clicked.
        } catch (error) {
            console.error("Image Gen Error", error);
            alert("Error generando imagen: " + error.message);
        } finally {
            setIsGeneratingImage(false);
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
                    scheduled_date: date.toISOString(),
                    image_url: index === 0 ? generatedImage : null // Associate image with first item for now if generated
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
                scheduled_date: today.toISOString(),
                image_url: generatedImage
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
            setGeneratedImage(null);
            setGeneratedImagePrompt('');
            setMode('single'); // Reset
        } catch (error) {
            console.error('Error saving content:', error);
            alert('Error al guardar el contenido.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyForInstagram = () => {
        if (!result) return;

        // Format for Instagram: Title + invisible separator + script + dots + hashtags/ads
        const separator = "\n.\n.\n";
        const content = `🔥 ${result.title || idea}\n\n${result.script}\n${separator}🚀 ${result.productionPlan ? "Tip de grabación: " + result.productionPlan : ""}`;

        navigator.clipboard.writeText(content);
        alert("¡Caption copiado! Listo para pegar en Instagram/TikTok.");
    };

    const handleDownloadPack = async () => {
        if (!result) return;

        const zip = new JSZip();

        // Add Text Content
        const textContent = `TÍTULO:\n${result.title || idea}\n\nGUION:\n${result.script}\n\nPLAN DE PRODUCCIÓN:\n${result.productionPlan}\n\nCOPY ADS:\n${result.adsCopy || 'N/A'}\n\nPROMPT IMAGEN:\n${generatedImagePrompt || 'N/A'}`;
        zip.file("contenido.txt", textContent);

        // Add Image if exists
        if (generatedImage) {
            try {
                // Fetch image as blob because we need the data, URL might be external
                // Note: CORS issues might happen with simple fetch if OpenAI doesn't allow it directly from browser to JSZip
                // DALL-E urls are signed but let's try. If it fails, we might need a proxy or backend.
                // For this demo, let's try direct fetch or fallback to url text file.

                const response = await fetch(generatedImage);
                const blob = await response.blob();
                zip.file("imagen_ai.png", blob);
            } catch (e) {
                console.error("Could not download image for zip", e);
                zip.file("imagen_url.txt", generatedImage); // Fallback
                alert("No pudimos descargar la imagen directamente (posible bloqueo CORS), pero guardamos el link en el ZIP.");
            }
        }

        zip.generateAsync({ type: "blob" }).then(function (content) {
            saveAs(content, `pack_contenido_${new Date().toISOString().slice(0, 10)}.zip`);
        });
    };

    // ... (return JSX)



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
                            <>
                                <Section title="Guion / Estructura" content={result.script} />
                                <Section title="Plan de Producción" content={result.productionPlan} />
                                <Section title="Copy para Meta Ads" content={result.adsCopy} />

                                {/* Image Generation Section */}
                                <div className="mt-8 pt-6 border-t border-zinc-800">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                                        <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-md">
                                            <Sparkles size={20} />
                                        </div>
                                        Generar Imagen AI
                                    </h3>

                                    {!generatedImage ? (
                                        <button
                                            onClick={handleGenerateImage}
                                            disabled={isGeneratingImage}
                                            className="w-full bg-zinc-900 border border-zinc-700 border-dashed hover:border-purple-500 hover:bg-zinc-800 transition-all rounded-xl p-8 flex flex-col items-center justify-center gap-3 group"
                                        >
                                            {isGeneratingImage ? (
                                                <Loader2 size={32} className="text-purple-500 animate-spin" />
                                            ) : (
                                                <div className="p-3 bg-zinc-800 rounded-full text-zinc-400 group-hover:text-purple-400 group-hover:scale-110 transition-all">
                                                    <Sparkles size={24} />
                                                </div>
                                            )}
                                            <span className="text-zinc-400 font-medium group-hover:text-white">
                                                {isGeneratingImage ? 'Creando imagen única...' : 'Generar Imagen para este Contenido'}
                                            </span>
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="relative group rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900">
                                                <img src={generatedImage} alt="AI Generated" className="w-full h-auto max-h-[400px] object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm p-4 flex justify-between items-center translate-y-full group-hover:translate-y-0 transition-transform">
                                                    <span className="text-white text-sm font-medium">Imagen DALL-E 3</span>
                                                    <a href={generatedImage} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:text-purple-300 underline">
                                                        Ver original
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Prompt Display */}
                                            {generatedImagePrompt && (
                                                <div className="bg-zinc-900 border border-zinc-700/50 rounded-lg p-3 relative group">
                                                    <p className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-wider">Prompt Utilizado:</p>
                                                    <p className="text-sm text-zinc-300 pr-8">{generatedImagePrompt}</p>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(generatedImagePrompt);
                                                            alert('Prompt copiado al portapapeles');
                                                        }}
                                                        className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
                                                        title="Copiar prompt"
                                                    >
                                                        <Copy size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="pt-8 flex flex-wrap justify-end gap-3 border-t border-zinc-800 mt-8">
                            <button
                                onClick={handleCopyForInstagram}
                                className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <Copy size={16} /> Copiar Caption
                            </button>

                            <button
                                onClick={handleDownloadPack}
                                className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <Download size={16} />
                                Descargar Pack
                            </button>

                            <div className="w-px h-8 bg-zinc-700 mx-2 hidden sm:block"></div>

                            <button
                                onClick={() => setResult(null)}
                                className="px-4 py-2 text-zinc-400 hover:text-red-400 transition-colors text-sm"
                            >
                                Descartar
                            </button>
                            <button
                                onClick={handleSaveToCalendar}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-3 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20 font-bold"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                {isSaving ? 'Guardando...' : result.weeklyPlan ? 'Agendar Semana' : 'Guardar'}
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
