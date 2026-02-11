import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Check, Mic, Volume2 } from 'lucide-react';
import { getBrandVoices, createBrandVoice, updateBrandVoice, deleteBrandVoice } from '../lib/supabase';

export default function BrandVoiceManager({ isOpen, onClose, onSelectVoice }) {
    const [voices, setVoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingVoice, setEditingVoice] = useState(null); // null = list mode, object = edit/create mode

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        tone_instructions: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadVoices();
        }
    }, [isOpen]);

    const loadVoices = async () => {
        setLoading(true);
        try {
            const data = await getBrandVoices();
            setVoices(data);
        } catch (error) {
            console.error("Error loading voices:", error);
            // Fallback for demo if table doesn't exist yet
            setVoices([
                { id: 1, name: 'Entrenador Estándar', description: 'Equilibrado y profesional', tone_instructions: 'Usa un tono profesional...' },
                { id: 2, name: 'Vendedor Agresivo', description: 'Urgencia y ventas', tone_instructions: 'Directo al grano...' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (voice) => {
        setFormData({
            name: voice.name,
            description: voice.description || '',
            tone_instructions: voice.tone_instructions
        });
        setEditingVoice(voice);
    };

    const handleCreate = () => {
        setFormData({
            name: '',
            description: '',
            tone_instructions: ''
        });
        setEditingVoice({ id: 'new' });
    };

    const handleSave = async () => {
        try {
            if (editingVoice.id === 'new') {
                await createBrandVoice(formData);
            } else {
                await updateBrandVoice(editingVoice.id, formData);
            }
            setEditingVoice(null);
            loadVoices();
        } catch (error) {
            console.error("Error saving voice:", error);
            alert("Error al guardar. Asegúrate de haber ejecutado el script SQL en Supabase.");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta voz?')) return;
        try {
            await deleteBrandVoice(id);
            loadVoices();
        } catch (error) {
            console.error("Error creating voice:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Mic className="text-primary" size={24} />
                            Gestor de Voces de Marca
                        </h2>
                        <p className="text-zinc-400 text-sm mt-1">Define la personalidad de tu IA.</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {editingVoice ? (
                        /* Edit/Create Configuration Form */
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Nombre de la Voz</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Amigo Fitness, Coach Duro..."
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Descripción Breve</label>
                                <input
                                    type="text"
                                    placeholder="Para qué sirve esta voz..."
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Instrucciones de Tono (Prompt)</label>
                                <textarea
                                    rows={6}
                                    placeholder="Describe cómo debe hablar. Ej: Usa emojis, sé muy directo, habla de 'tú', usa jerga chilena, evita palabras técnicas..."
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                    value={formData.tone_instructions}
                                    onChange={e => setFormData({ ...formData, tone_instructions: e.target.value })}
                                />
                                <p className="text-xs text-zinc-500 mt-2">
                                    💡 Tip: Sé lo más específico posible. Puedes pegar ejemplos de textos tuyos aquí también.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setEditingVoice(null)}
                                    className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <Check size={18} /> Guardar Voz
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* List of Voices */
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Create New Card */}
                                <button
                                    onClick={handleCreate}
                                    className="border-2 border-dashed border-zinc-800 hover:border-primary/50 hover:bg-zinc-800/50 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-500 hover:text-primary transition-all group h-full min-h-[160px]"
                                >
                                    <div className="p-3 bg-zinc-800 rounded-full group-hover:scale-110 transition-transform mb-3">
                                        <Plus size={24} />
                                    </div>
                                    <span className="font-medium">Crear Nueva Voz</span>
                                </button>

                                {/* Creating Cards for existing voices */}
                                {voices.map(voice => (
                                    <div key={voice.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5 hover:border-primary/30 transition-all group relative">
                                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(voice)} className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(voice.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg text-zinc-400 hover:text-red-400">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                                                <Volume2 size={20} />
                                            </div>
                                            <h3 className="font-bold text-white text-lg">{voice.name}</h3>
                                        </div>
                                        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{voice.description || "Sin descripción"}</p>

                                        {onSelectVoice && (
                                            <button
                                                onClick={() => onSelectVoice(voice)}
                                                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
                                            >
                                                Seleccionar
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
