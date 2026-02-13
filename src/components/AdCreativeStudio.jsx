import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { generateAdCopy } from '../lib/openai';
import {
    Upload,
    Download,
    Sparkles,
    Layout,
    ChevronRight,
    Image as ImageIcon,
    Type,
    Palette,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { toPng } from 'html-to-image';

export default function AdCreativeStudio() {
    const [beforeImage, setBeforeImage] = useState(null);
    const [afterImage, setAfterImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [context, setContext] = useState('');
    const [adCopy, setAdCopy] = useState(null);
    const [themeColor, setThemeColor] = useState('#ff5722'); // Primary orange
    const [layout, setLayout] = useState('vertical'); // 'vertical' or 'horizontal'

    const creativeRef = useRef(null);

    const handleImageUpload = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'before') setBeforeImage(reader.result);
                else setAfterImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateCopy = async () => {
        if (!context.trim()) return;
        setIsGenerating(true);
        try {
            const copy = await generateAdCopy(context);
            setAdCopy(copy);
        } catch (error) {
            console.error("Error generating copy", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExport = async () => {
        if (!creativeRef.current) return;
        setIsExporting(true);
        try {
            const dataUrl = await toPng(creativeRef.current, { cacheBust: true, quality: 1 });
            const link = document.createElement('a');
            link.download = `ad-creative-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Error exporting image", error);
        } finally {
            setIsExporting(false);
        }
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copiado al portapapeles!`);
    };

    return (
        <div className="p-6 h-auto lg:h-[calc(100vh-100px)] overflow-y-auto max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Controls Panel */}
                <div className="lg:w-1/2 space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6 text-primary">
                            <Sparkles size={24} />
                            <h2 className="text-xl font-bold text-white">Ad Creative Studio</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Image Uploads */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Imagen Antes</label>
                                    <label className="relative flex flex-col items-center justify-center h-40 border-2 border-dashed border-zinc-800 rounded-xl hover:border-primary/50 cursor-pointer transition-all bg-zinc-950 overflow-hidden group">
                                        {beforeImage ? (
                                            <img src={beforeImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <Upload className="text-zinc-600 group-hover:text-primary transition-colors" />
                                        )}
                                        <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'before')} accept="image/*" />
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Imagen Después</label>
                                    <label className="relative flex flex-col items-center justify-center h-40 border-2 border-dashed border-zinc-800 rounded-xl hover:border-primary/50 cursor-pointer transition-all bg-zinc-950 overflow-hidden group">
                                        {afterImage ? (
                                            <img src={afterImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <Upload className="text-zinc-600 group-hover:text-primary transition-colors" />
                                        )}
                                        <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'after')} accept="image/*" />
                                    </label>
                                </div>
                            </div>

                            {/* Context for AI */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Contexto de la Transformación</label>
                                <textarea
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    placeholder="Ej: Alumno bajó 12kg en 3 meses con mi método híbrido..."
                                    className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-primary transition-all resize-none"
                                />
                                <button
                                    onClick={handleGenerateCopy}
                                    disabled={isGenerating || !context.trim()}
                                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Type size={18} />}
                                    Generar Copy Persuasivo
                                </button>
                            </div>

                            {/* Theme Control */}
                            <div className="space-y-3 pt-4 border-t border-zinc-800">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <Palette size={16} /> Color de Tema
                                </label>
                                <div className="flex gap-2">
                                    {['#ff5722', '#3b82f6', '#10b981', '#ffffff', '#000000'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setThemeColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${themeColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Layout Selection */}
                            <div className="space-y-3 pt-4 border-t border-zinc-800">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <Layout size={16} /> Estilo de Diseño
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setLayout('vertical')}
                                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${layout === 'vertical' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                    >
                                        Vertical (Story)
                                    </button>
                                    <button
                                        onClick={() => setLayout('horizontal')}
                                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${layout === 'horizontal' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                    >
                                        Lado a Lado
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {adCopy && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <Sparkles size={18} />
                                    <span>Kit de Copy para Canva Pro</span>
                                </div>
                                <a
                                    href="https://www.canva.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded-md transition-all"
                                >
                                    Abrir Canva ↗
                                </a>
                            </div>

                            <div className="space-y-3">
                                <div className="group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] text-zinc-500 uppercase font-black">Headline (Gancho)</span>
                                        <button
                                            onClick={() => copyToClipboard(adCopy.headline, 'Headline')}
                                            className="text-[10px] text-primary hover:underline"
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                    <p className="text-sm text-white font-medium bg-zinc-950 p-2 rounded border border-zinc-800">{adCopy.headline}</p>
                                </div>

                                <div className="group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] text-zinc-500 uppercase font-black">Subheadline</span>
                                        <button
                                            onClick={() => copyToClipboard(adCopy.subheadline, 'Subheadline')}
                                            className="text-[10px] text-primary hover:underline"
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                    <p className="text-sm text-white bg-zinc-950 p-2 rounded border border-zinc-800">{adCopy.subheadline}</p>
                                </div>

                                <div className="group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] text-zinc-500 uppercase font-black">Beneficios (Bullet Points)</span>
                                        <button
                                            onClick={() => copyToClipboard(adCopy.benefits.join('\n'), 'Beneficios')}
                                            className="text-[10px] text-primary hover:underline"
                                        >
                                            Copiar todos
                                        </button>
                                    </div>
                                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800 space-y-1">
                                        {adCopy.benefits.map((b, i) => (
                                            <p key={i} className="text-xs text-zinc-300">• {b}</p>
                                        ))}
                                    </div>
                                </div>

                                {adCopy.canva_image_prompt && (
                                    <div className="pt-2 border-t border-zinc-800">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-1">
                                                <Sparkles size={10} className="text-primary" />
                                                <span className="text-[10px] text-zinc-500 uppercase font-black">Prompt para IA de Canva</span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(adCopy.canva_image_prompt, 'Prompt de IA')}
                                                className="text-[10px] text-primary hover:underline"
                                            >
                                                Copiar Prompt
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-zinc-400 bg-zinc-950/50 p-2 rounded border border-dashed border-zinc-800 leading-relaxed">
                                            {adCopy.canva_image_prompt}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <p className="text-[10px] text-zinc-600 italic">
                                Sugerencia: Usa fuentes como 'Inter Bold' o 'Anton' en Canva para este copy.
                            </p>
                        </div>
                    )}
                </div>

                {/* Preview Panel */}
                <div className="lg:w-1/2 flex flex-col items-center">
                    <div className="sticky top-0 w-full max-w-[400px]">
                        <div className="text-center mb-4">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-2">
                                <Layout size={12} /> Vista Previa (9:16)
                            </span>
                        </div>

                        {/* Story Container */}
                        <div
                            ref={creativeRef}
                            className="aspect-[9/16] w-full bg-zinc-900 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
                            style={{
                                background: `linear-gradient(to bottom, #18181b, #09090b)`,
                                border: adCopy ? `1px solid ${themeColor}44` : '1px solid #27272a'
                            }}
                        >
                            {/* Design Backdrop */}
                            <div className="absolute top-0 right-0 w-64 h-64 opacity-20 blur-3xl rounded-full" style={{ backgroundColor: themeColor }}></div>

                            {/* Header Section */}
                            <div className="relative z-10 p-8 pt-12 text-center">
                                {adCopy ? (
                                    <>
                                        <h1 className="text-3xl font-black text-white leading-tight mb-2 uppercase italic" style={{ textShadow: `2px 2px 0px ${themeColor}` }}>
                                            {adCopy.headline}
                                        </h1>
                                        <p className="text-sm font-medium opacity-80" style={{ color: themeColor }}>
                                            {adCopy.subheadline}
                                        </p>
                                    </>
                                ) : (
                                    <div className="space-y-2 py-4">
                                        <div className="h-8 w-3/4 bg-zinc-800 mx-auto rounded-md animate-pulse"></div>
                                        <div className="h-4 w-1/2 bg-zinc-800 mx-auto rounded-md animate-pulse"></div>
                                    </div>
                                )}
                            </div>

                            {/* Images Container */}
                            <div className="flex-1 px-4 relative z-10 min-h-0">
                                <div className={`h-full w-full grid gap-2 ${layout === 'vertical' ? 'grid-rows-2' : 'grid-cols-2'}`}>
                                    <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-lg min-h-0">
                                        {beforeImage ? (
                                            <>
                                                <img src={beforeImage} className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 z-20">
                                                    <span className="text-[10px] font-black text-white uppercase italic">ANTES</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon size={48} className="text-zinc-800" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative rounded-xl overflow-hidden border-2 bg-zinc-950 shadow-2xl min-h-0" style={{ borderColor: themeColor }}>
                                        {afterImage ? (
                                            <>
                                                <img src={afterImage} className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute top-2 left-2 bg-primary px-3 py-1 rounded-md shadow-lg z-20" style={{ backgroundColor: themeColor }}>
                                                    <span className="text-[10px] font-black text-white uppercase italic">DESPUÉS</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon size={48} className="text-zinc-800" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Benefits Footer */}
                            <div className="relative z-10 p-8 pb-12">
                                {adCopy ? (
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            {adCopy.benefits.map((benefit, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }}></div>
                                                    <span className="text-xs font-bold text-white uppercase tracking-tight">{benefit}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-4">
                                            <div className="w-full py-3 rounded-lg text-center font-black text-sm uppercase tracking-widest shadow-lg" style={{ backgroundColor: themeColor, color: themeColor === '#ffffff' ? '#000000' : '#ffffff' }}>
                                                {adCopy.cta}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 py-4">
                                        <div className="h-4 w-full bg-zinc-800 rounded-md animate-pulse"></div>
                                        <div className="h-4 w-3/4 bg-zinc-800 rounded-md animate-pulse"></div>
                                        <div className="h-10 w-full bg-zinc-800 rounded-lg mt-4 animate-pulse"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={handleExport}
                            disabled={isExporting || (!beforeImage && !afterImage)}
                            className="w-full mt-6 py-4 bg-white text-black hover:bg-zinc-200 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50"
                        >
                            {isExporting ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                            Descargar para mi Story
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
