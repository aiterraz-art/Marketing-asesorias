import React from 'react';
import { X, Settings, Sliders } from 'lucide-react';

export default function PromptBuilderModal({ isOpen, onClose, check, setCheck, mood, setMood }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-2 text-white">
                        <Sliders size={20} className="text-primary" />
                        <h3 className="text-lg font-semibold">Configuración Avanzada del Prompt</h3>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* Tone Selector */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-3">Tono de Voz</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Inspirador', 'Educativo', 'Energético'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMood(m)}
                                    className={`px-4 py-2 rounded-lg text-sm border transition-all ${mood === m
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Additional Constraints */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-3">Restricciones</label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:border-zinc-700">
                                <input
                                    type="checkbox"
                                    checked={check.verifyHooks}
                                    onChange={(e) => setCheck({ ...check, verifyHooks: e.target.checked })}
                                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-primary focus:ring-primary/20"
                                />
                                <span className="text-sm text-zinc-300">Incluir 3 variantes de Hook</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:border-zinc-700">
                                <input
                                    type="checkbox"
                                    checked={check.includeCta}
                                    onChange={(e) => setCheck({ ...check, includeCta: e.target.checked })}
                                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-primary focus:ring-primary/20"
                                />
                                <span className="text-sm text-zinc-300">Optimizar CTA para conversión</span>
                            </label>
                        </div>
                    </div>

                </div>

                <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white font-medium shadow-lg hover:shadow-primary/20 transition-all"
                    >
                        Guardar Configuración
                    </button>
                </div>
            </div>
        </div>
    );
}
