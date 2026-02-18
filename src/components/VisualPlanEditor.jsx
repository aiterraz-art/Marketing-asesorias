import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, ChefHat, Save, ArrowRight, RefreshCw, X } from 'lucide-react';

const VisualPlanEditor = ({ initialText, foods = [], onSave, onCancel }) => {

    // Helper: Normalize category strings
    const normalizeCategory = (cat) => {
        if (!cat) return 'other';
        const lower = cat.toLowerCase();
        if (lower.includes('carb')) return 'carb';
        if (lower.includes('prot')) return 'protein';
        if (lower.includes('gras') || lower.includes('fat')) return 'fat';
        if (lower.includes('frut')) return 'fruit';
        if (lower.includes('veg')) return 'vegetable';
        return 'other';
    };

    // Parser: Text -> Blocks
    const parseTextToBlocks = (text) => {
        if (!text) return [];
        const lines = text.split('\n');
        const blocks = [];
        let currentCategory = 'other';
        let tableHeaderDetected = false; // Not strictly used for parsing, but good for context

        lines.forEach((line, index) => {
            const id = `block-${index}-${Date.now()}`;
            return { id, type: 'header', content: line.replace(/###\s*/, ''), original: line };
        }

            // 2. Detect Food Items (- **100g Rice** ...)
            // Regex: - \*\*(QUANTITY) (FOODNAME)\*\*
            const foodMatch = line.match(/^-\s*\*\*(\d+)(g|ml|unidades)?\s+(.+?)\*\*(.*)/);
        if (foodMatch) {
            return {
                id,
                type: 'food',
                quantity: foodMatch[1],
                unit: foodMatch[2] || 'g',
                name: foodMatch[3],
                extra: foodMatch[4], // Macros info usually
                original: line
            };
        }

        // 3. Regular Text / Notes
        return { id, type: 'text', content: line, original: line };
    });
};

const [blocks, setBlocks] = useState(parseTextToBlocks(initialText));
const [selectedFoodId, setSelectedFoodId] = useState('');

// Compiler Logic: Convert Array of Blocks -> Markdown String
const compileBlocksToText = () => {
    return blocks.map(block => {
        if (block.type === 'header') return `### ${block.content}`;
        if (block.type === 'food') return `- **${block.quantity}${block.unit} ${block.name}**${block.extra}`;
        return block.content;
    }).join('\n');
};

// Live Macos Recalculation (Simplified for this view)
const [totalStats, setTotalStats] = useState({ kcal: 0 });

useEffect(() => {
    // Simple recalculation based on text regex in "extra" field or re-calculating from DB if needed
    // For now, relies on the 'extra' text (X kcal) existing
    let k = 0;
    blocks.forEach(b => {
        if (b.type === 'food' && b.extra) {
            const m = b.extra.match(/(\d+)\s*kcal/);
            if (m) k += parseInt(m[1]);
        }
    });
    setTotalStats({ kcal: k });
}, [blocks]);

const updateBlock = (id, field, value) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
};

const deleteBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
};

const addBlock = (type) => {
    const newBlock = { id: `new-${Date.now()}`, type, content: '', quantity: '100', unit: 'g', name: 'Alimento', extra: '' };
    setBlocks(prev => [...prev, newBlock]);
};

// Handler when user selects a food from dropdown to ADD
const handleAddFoodFromDB = () => {
    const food = foods.find(f => f.id.toString() === selectedFoodId);
    if (!food) return;

    // Add typical food block
    const newBlock = {
        id: `food-${Date.now()}`,
        type: 'food',
        quantity: '100',
        unit: 'g',
        name: food.name,
        extra: ` (${food.calories_per_100g} kcal | P: ${food.protein_per_100g} | C: ${food.carbs_per_100g} | F: ${food.fat_per_100g})`
    };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedFoodId('');
};

return (
    <div className="flex flex-col h-full bg-black/50 rounded-xl overflow-hidden animate-in fade-in duration-300">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-2 border-b border-zinc-800 bg-zinc-900/50">
            <select
                value={selectedFoodId}
                onChange={e => setSelectedFoodId(e.target.value)}
                className="bg-zinc-800 text-xs text-white rounded p-1.5 outline-none border border-zinc-700 w-48"
            >
                <option value="">+ Añadir Alimento</option>
                {foods.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <button
                onClick={handleAddFoodFromDB}
                disabled={!selectedFoodId}
                className="bg-primary text-black text-xs font-bold px-3 py-1.5 rounded disabled:opacity-50"
            >
                Añadir
            </button>
            <div className="w-px h-6 bg-zinc-700 mx-2"></div>
            <button onClick={() => addBlock('header')} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">+ Título</button>
            <button onClick={() => addBlock('text')} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">+ Nota</button>

            <div className="flex-1"></div>

            <div className="text-xs font-mono text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/50">
                Total: {totalStats.kcal} kcal
            </div>
        </div>

        {/* Blocks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {blocks.map((block, idx) => (
                <div key={block.id} className="group flex items-start gap-2 p-2 hover:bg-zinc-800/30 rounded border border-transparent hover:border-zinc-800/50 transition-all">
                    <div className="mt-2 text-zinc-600 cursor-move"><GripVertical size={12} /></div>

                    {/* Render based on Type */}
                    {block.type === 'header' && (
                        <input
                            className="flex-1 bg-transparent text-primary font-bold text-lg outline-none placeholder-zinc-600"
                            value={block.content}
                            onChange={e => updateBlock(block.id, 'content', e.target.value)}
                            placeholder="Nombre de la Comida (Ej: Desayuno)"
                        />
                    )}

                    {block.type === 'food' && (
                        <div className="flex-1 flex flex-wrap items-center gap-2">
                            <input
                                className="w-16 bg-zinc-900 text-white text-sm text-center rounded border border-zinc-800 focus:border-primary outline-none"
                                value={block.quantity}
                                onChange={e => updateBlock(block.id, 'quantity', e.target.value)}
                            />
                            <span className="text-xs text-zinc-500">{block.unit}</span>
                            <input
                                className="flex-1 bg-transparent text-white font-medium outline-none border-b border-transparent focus:border-zinc-700"
                                value={block.name}
                                onChange={e => updateBlock(block.id, 'name', e.target.value)}
                            />
                            <input
                                className="w-full sm:w-auto min-w-[200px] bg-transparent text-xs text-zinc-500 outline-none"
                                value={block.extra}
                                onChange={e => updateBlock(block.id, 'extra', e.target.value)}
                            />
                        </div>
                    )}

                    {block.type === 'text' && (
                        <textarea
                            className="flex-1 text-zinc-400 text-sm outline-none resize-none h-auto overflow-hidden bg-black/20 rounded p-1"
                            value={block.content}
                            onChange={e => updateBlock(block.id, 'content', e.target.value)}
                            rows={1}
                            onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                        />
                    )}

                    <button onClick={() => deleteBlock(block.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/80 backdrop-blur">
            <button onClick={onCancel} className="text-xs text-zinc-400 hover:text-white px-3 py-2">Cancelar</button>
            <button
                onClick={() => onSave(compileBlocksToText())}
                className="bg-primary hover:bg-primary/90 text-black text-xs font-bold px-4 py-2 rounded flex items-center gap-2 shadow-lg shadow-primary/20"
            >
                <Save size={14} /> Guardar Plan Interactivos
            </button>
        </div>
    </div>
);
};

export default VisualPlanEditor;
