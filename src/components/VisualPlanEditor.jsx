import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Save, ArrowRight, RefreshCw, X } from 'lucide-react';

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

        lines.forEach((line, index) => {
            const id = `block-${index}-${Date.now()}`;
            const trimmed = line.trim();

            // 1. Detect Category Context from Headers
            // Example: "# 1 PORCIÓN DE CARBOHIDRATO = **200 kcal**"
            if (trimmed.startsWith('#')) {
                const cat = normalizeCategory(trimmed);
                if (cat !== 'other') currentCategory = cat;
                blocks.push({ id, type: 'header', content: line.replace(/^#+\s*/, ''), original: line, level: trimmed.match(/^#+/)[0].length });
                return;
            }

            // 2. Detect Table Header/Divider (Keep as text but flag context)
            if (trimmed.startsWith('|') && (trimmed.toLowerCase().includes('alimento') || trimmed.includes('---'))) {
                blocks.push({ id, type: 'text', content: line, original: line, isTableStruct: true });
                return;
            }

            // 3. Detect Table Row (The Food!)
            // Format: | Arroz cocido | 150 g | ... |
            // Regex: | Name | Qty g | ...
            const tableRowMatch = line.match(/^\|\s*(.+?)\s*\|\s*(\d+)\s*(g|ml|unidades)?\s*\|/i);
            if (tableRowMatch) {
                const name = tableRowMatch[1].trim();
                const qty = tableRowMatch[2];
                const unit = tableRowMatch[3] || 'g';

                blocks.push({
                    id,
                    type: 'food-table-row',
                    name,
                    quantity: qty,
                    unit,
                    category: currentCategory,
                    original: line,
                    fullParts: line.split('|') // Keep parts to reconstruct table row accurately
                });
                return;
            }

            // 4. Detect List Item Food (Legacy/Standard Parsing)
            const listFoodMatch = line.match(/^-\s*\*\*(\d+)(g|ml|unidades)?\s+(.+?)\*\*(.*)/);
            if (listFoodMatch) {
                blocks.push({
                    id,
                    type: 'food-list-item',
                    quantity: listFoodMatch[1],
                    unit: listFoodMatch[2] || 'g',
                    name: listFoodMatch[3],
                    extra: listFoodMatch[4],
                    category: currentCategory,
                    original: line
                });
                return;
            }

            // 5. Default Text
            blocks.push({ id, type: 'text', content: line, original: line });
        });
        return blocks;
    };

    const [blocks, setBlocks] = useState(parseTextToBlocks(initialText));

    // Live Stats
    const [stats, setStats] = useState({ kcal: 0, p: 0, c: 0, f: 0 });

    useEffect(() => {
        // Calculate stats from simple text matching in the "original" line of foods
        let k = 0, p = 0, c = 0, f = 0;
        blocks.forEach(b => {
            const line = b.original || '';
            const km = line.match(/(\d+)\s*kcal/i) || line.match(/\|.*?\|.*?\|.*?\|.*?\|.*?\|\s*(\d+)/); // Try to grab last col for table
            if (km) k += parseInt(km[1]);
        });
        setStats({ kcal: k, p, c, f });
    }, [blocks]);


    const updateBlock = (id, field, value) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleFoodChange = (blockId, newFoodId) => {
        const food = foods.find(f => f.id.toString() === newFoodId);
        if (!food) return;

        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;

            const newName = food.name;
            let newOriginal = b.original;

            if (b.type === 'food-table-row') {
                const ratio = parseInt(b.quantity) / 100;
                const newKcal = Math.round(food.calories_per_100g * ratio);
                const newP = Math.round(food.protein_per_100g * ratio);
                const newC = Math.round(food.carbs_per_100g * ratio);
                const newF = Math.round(food.fat_per_100g * ratio);

                // Assuming table structure: | Name | Qty | Visual | P | C | F | Kcal |
                const parts = b.original.split('|');
                // parts[0] is empty (before first |), parts[1] is Name, parts[2] is Qty...
                if (parts.length >= 8) {
                    parts[1] = ` ${newName} `;
                    // parts[2] is Qty, keep it
                    // parts[3] is visual, keep it
                    parts[4] = ` ${newP.toFixed(1)} `; // P
                    parts[5] = ` ${newC.toFixed(1)} `; // C
                    parts[6] = ` ${newF.toFixed(1)} `; // F
                    parts[7] = ` ${newKcal} `; // Kcal
                    newOriginal = parts.join('|');
                } else {
                    newOriginal = b.original.replace(b.name, newName);
                }
            } else {
                newOriginal = b.original.replace(b.name, newName);
            }

            return {
                ...b,
                name: newName,
                original: newOriginal,
            };
        }));
    };

    const compileBlocksToText = () => {
        return blocks.map(b => b.original).join('\n');
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 rounded-xl overflow-hidden border border-zinc-900">
            {/* Toolbar */}
            <div className="flex items-center gap-4 p-3 border-b border-zinc-900 bg-zinc-900/50">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <RefreshCw size={14} className={stats.kcal > 0 ? "animate-spin-slow" : ""} />
                    Modo Editor Inteligente
                </div>
                <div className="flex-1"></div>
                <div className="text-xs font-mono text-zinc-400 bg-black/40 px-3 py-1.5 rounded-full border border-zinc-800">
                    Calculado aprox: <span className="text-white font-bold">{stats.kcal} kcal</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {blocks.map((block) => {
                    // RENDER TABLE ROWS (Smart Dropdowns)
                    if (block.type === 'food-table-row') {
                        // Filter foods by category
                        const categoryFoods = foods.filter(f => normalizeCategory(f.category) === block.category);
                        const availableFoods = categoryFoods.length > 0 ? categoryFoods : foods;

                        // Calculate visuals
                        const currentFood = availableFoods.find(f => f.name === block.name) || foods.find(f => f.name === block.name);
                        const currentKcal = currentFood ? Math.round(currentFood.calories_per_100g * (parseInt(block.quantity) / 100)) : 0;

                        return (
                            <div key={block.id} className="flex items-center gap-2 p-2 bg-zinc-900/40 rounded border border-zinc-800/50 hover:border-primary/30 transition-colors group">
                                <div className="text-[10px] uppercase font-bold text-zinc-600 w-16 text-right shrink-0">
                                    {block.category === 'other' ? 'Alimento' : block.category}
                                </div>
                                <select
                                    className="flex-1 bg-black text-white text-sm rounded border border-zinc-800 focus:border-primary p-1.5 outline-none"
                                    value={availableFoods.find(f => f.name === block.name)?.id || ''}
                                    onChange={(e) => handleFoodChange(block.id, e.target.value)}
                                >
                                    <option value="" disabled>{block.name}</option>
                                    {availableFoods.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                    <optgroup label="Otros">
                                        {foods.filter(f => !availableFoods.includes(f)).map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </optgroup>
                                </select>

                                {/* Calorie Badge */}
                                <div className="hidden sm:flex items-center justify-center w-20 bg-black/40 rounded border border-zinc-800/50 px-2 py-1 mr-2">
                                    <span className={`text-xs font-mono font-bold ${currentKcal > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                        {currentKcal > 0 ? `${currentKcal}` : '-'}
                                    </span>
                                    <span className="text-[9px] text-zinc-600 ml-1">kcal</span>
                                </div>

                                <div className="flex items-center gap-1 bg-black rounded border border-zinc-800 px-2 py-1">
                                    <input
                                        type="number"
                                        value={block.quantity}
                                        onChange={(e) => {
                                            // Handling manual quantity edits would require complex recalculation
                                            // For now we allow text edit but ideally this triggers handleFoodChange logic
                                            updateBlock(block.id, 'quantity', e.target.value);
                                        }}
                                        className="w-12 bg-transparent text-right text-white text-sm outline-none"
                                    />
                                    <span className="text-xs text-zinc-500">{block.unit}</span>
                                </div>
                            </div>
                        );
                    }

                    // RENDER HEADERS
                    if (block.type === 'header') {
                        return (
                            <div key={block.id} className="mt-4 mb-2 pb-1 border-b border-primary/20">
                                <input
                                    value={block.content}
                                    readOnly
                                    className="bg-transparent text-primary font-bold text-sm w-full outline-none uppercase tracking-wider"
                                />
                            </div>
                        );
                    }

                    // RENDER TEXT (Notes, dividers, etc)
                    if (block.type === 'text') {
                        return (
                            <div key={block.id} className="pl-4 border-l-2 border-transparent hover:border-zinc-800 transition-colors">
                                <input
                                    value={block.content}
                                    onChange={e => {
                                        setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, content: e.target.value, original: e.target.value } : b));
                                    }}
                                    className="bg-transparent text-zinc-500 text-xs font-mono w-full outline-none"
                                />
                            </div>
                        );
                    }

                    return null;
                })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-zinc-900 flex justify-end gap-3 bg-zinc-950">
                <button onClick={onCancel} className="text-xs text-zinc-400 hover:text-white px-3 py-2">Cancelar</button>
                <button
                    onClick={() => onSave(compileBlocksToText())}
                    className="bg-primary hover:bg-primary/90 text-black text-xs font-bold px-4 py-2 rounded flex items-center gap-2"
                >
                    <Save size={14} /> Guardar Cambios
                </button>
            </div>
        </div>
    );
};

export default VisualPlanEditor;
