import React, { useState, useEffect } from 'react';
import { RefreshCw, Save } from 'lucide-react';

const VisualPlanEditor = ({ initialText, foods = [], onSave, onCancel }) => {

    // Helper: Normalize category strings
    const normalizeCategory = (cat) => {
        if (!cat) return 'other';
        const lower = String(cat).toLowerCase(); // Force String
        if (lower.includes('carb')) return 'carb';
        if (lower.includes('prot')) return 'protein';
        if (lower.includes('gras') || lower.includes('fat') || lower.includes('lipid')) return 'fat';
        if (lower.includes('frut')) return 'fruit';
        if (lower.includes('veg')) return 'vegetable';
        if (lower.includes('lact') || lower.includes('dairy')) return 'dairy';
        return 'other';
    };

    // Parser: Text -> Blocks
    const parseTextToBlocks = (text) => {
        if (!text || typeof text !== 'string') return [];
        const lines = text.split('\n');
        const blocks = [];
        let currentCategory = 'other';

        lines.forEach((line, index) => {
            const id = `block-${index}-${Date.now()}`;
            const trimmed = String(line).trim();

            // 1. Detect Category Context from Headers
            if (trimmed.startsWith('#')) {
                const cat = normalizeCategory(trimmed);
                if (cat !== 'other') currentCategory = cat;
                blocks.push({ id, type: 'header', content: line.replace(/^#+\s*/, ''), original: line, level: (trimmed.match(/^#+/) || [''])[0].length });
                return;
            }

            // 2. Detect Table Header/Divider
            if (trimmed.startsWith('|') && (trimmed.toLowerCase().includes('alimento') || trimmed.includes('---'))) {
                blocks.push({ id, type: 'text', content: line, original: line, isTableStruct: true });
                return;
            }

            // 3. Detect Table Row (The Food!)
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
                    fullParts: line.split('|')
                });
                return;
            }

            // 4. Detect List Item Food
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

    const [blocks, setBlocks] = useState(() => parseTextToBlocks(initialText));

    // Live Stats
    const [stats, setStats] = useState({ kcal: 0 });

    useEffect(() => {
        let k = 0;
        blocks.forEach(b => {
            const line = b.original || '';
            const km = line.match(/\|.*?\|.*?\|.*?\|.*?\|.*?\|\s*(\d+)/) || line.match(/(\d+)\s*kcal/i);
            if (km && km[1]) k += parseInt(km[1]);
        });
        setStats({ kcal: k });
    }, [blocks]);


    const updateBlock = (id, field, value) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleFoodChange = (blockId, newFoodId) => {
        const food = foods.find(f => String(f.id) === String(newFoodId));
        if (!food) return;

        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;

            const newName = food.name;
            let newOriginal = b.original;
            let newQuantity = b.quantity; // Default to keeping it if we can't do math

            // PORTION LOGIC (Isocaloric Exchange)
            // If the block is a food row, we try to preserve the "Number of Portions"
            if (b.type === 'food-table-row') {
                // Find ONLY the old food to get its standard portion
                const oldFood = foods.find(f => f.name === b.name);
                const isNewGeneric = food.name && String(food.name).toLowerCase().startsWith('bloque');
                const isOldGeneric = oldFood?.name && String(oldFood.name).toLowerCase().startsWith('bloque');

                let currentPortions = 1;

                // Determine current portions
                if (oldFood) {
                    if (isOldGeneric) {
                        currentPortions = parseFloat(b.quantity);
                    } else if (oldFood.portion_grams) {
                        currentPortions = parseInt(b.quantity) / oldFood.portion_grams;
                    }
                }

                // Apply to new food
                if (isNewGeneric) {
                    // For generic, quantity IS the number of portions
                    newQuantity = parseFloat(currentPortions.toFixed(1)) || 1;
                } else if (food.portion_grams) {
                    // For specific, quantity is grams
                    newQuantity = Math.round(currentPortions * food.portion_grams);
                } else {
                    newQuantity = food.portion_grams || 100; // Fallback
                }

                // Recalculate Macros for the new quantity
                let newKcal = 0, newP = 0, newC = 0, newF = 0;

                if (isNewGeneric) {
                    // Generic math: Quantity is multiplier
                    newKcal = Math.round(food.calories_per_100g * newQuantity);
                    newP = Math.round(food.protein_per_100g * newQuantity);
                    newC = Math.round(food.carbs_per_100g * newQuantity);
                    newF = Math.round(food.fat_per_100g * newQuantity);
                } else {
                    // Specific math: Quantity is grams
                    const ratio = newQuantity / 100;
                    newKcal = Math.round(food.calories_per_100g * ratio);
                    newP = Math.round(food.protein_per_100g * ratio);
                    newC = Math.round(food.carbs_per_100g * ratio);
                    newF = Math.round(food.fat_per_100g * ratio);
                }

                // Also get the household measure text
                const measureText = food.household_measure ? ` (${food.household_measure})` : '';

                // Assuming table structure: | Name | Qty | Visual | P | C | F | Kcal |
                const parts = String(b.original).split('|');
                if (parts.length >= 8) {
                    parts[1] = ` ${isNewGeneric ? newName.replace('bloque ', 'Porción ') : newName} `;
                    parts[2] = ` ${newQuantity} ${isNewGeneric ? '' : 'g'} `; // Update Quantity column
                    parts[3] = isNewGeneric ? ' - ' : ` ${measureText || String(parts[3] || '').trim()} `; // Update Visual Measure column if available
                    parts[4] = ` ${newP.toFixed(1)} `;
                    parts[5] = ` ${newC.toFixed(1)} `;
                    parts[6] = ` ${newF.toFixed(1)} `;
                    parts[7] = ` ${newKcal} `;
                    newOriginal = parts.join('|');
                } else {
                    // Fallback for non-standard rows
                    newOriginal = b.original.replace(b.name, newName).replace(b.quantity, newQuantity);
                }
            } else {
                newOriginal = b.original.replace(b.name, newName);
            }

            return {
                ...b,
                name: newName,
                quantity: newQuantity,
                original: newOriginal,
                unit: 'g' // Ensure unit is g, or visual logic handles it
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
                        const safeFoods = Array.isArray(foods) ? foods : [];
                        const categoryFoods = safeFoods.filter(f => normalizeCategory(f.category) === block.category);
                        const availableFoods = categoryFoods.length > 0 ? categoryFoods : safeFoods;

                        // Calculate visuals
                        const currentFood = availableFoods.find(f => f.name === block.name) || safeFoods.find(f => f.name === block.name);

                        // Check if it's a Generic Block
                        const isGeneric = currentFood && currentFood.name && String(currentFood.name).toLowerCase().startsWith('bloque');

                        // Calculation Logic
                        let currentKcal = 0;
                        if (currentFood) {
                            if (isGeneric) {
                                // For generics, quantity IS the multiplier
                                currentKcal = Math.round((currentFood.calories_per_100g || 0) * (parseFloat(block.quantity) || 0));
                            } else {
                                // Standard food: grams
                                currentKcal = Math.round((currentFood.calories_per_100g || 0) * ((parseInt(block.quantity) || 0) / 100));
                            }
                        }

                        const householdMeasure = currentFood?.household_measure || '';

                        return (
                            <div key={block.id} className="flex items-center gap-2 p-2 bg-zinc-900/40 rounded border border-zinc-800/50 hover:border-primary/30 transition-colors group">
                                <div className="text-[10px] uppercase font-bold text-zinc-600 w-16 text-right shrink-0">
                                    {block.category === 'other' ? 'Alimento' : block.category}
                                </div>
                                <select
                                    className="flex-1 bg-black text-white text-sm rounded border border-zinc-800 focus:border-primary p-1.5 outline-none font-medium"
                                    value={currentFood?.id || ''}
                                    onChange={(e) => handleFoodChange(block.id, e.target.value)}
                                >
                                    <option value="" disabled>{block.name}</option>

                                    {/* Generic Blocks First - SAFEGUARDED */}
                                    <optgroup label="Bloques Genéricos">
                                        {availableFoods.filter(f => f && f.name && String(f.name).toLowerCase().startsWith('bloque')).map(f => (
                                            <option key={f.id} value={f.id}>{String(f.name).replace('bloque ', 'Porción ').toUpperCase()}</option>
                                        ))}
                                    </optgroup>

                                    {/* Specific Foods - SAFEGUARDED */}
                                    <optgroup label="Alimentos Específicos">
                                        {availableFoods.filter(f => f && f.name && !String(f.name).toLowerCase().startsWith('bloque')).map(f => (
                                            <option key={f.id} value={f.id}>{String(f.name)} {f.portion_grams ? `(${f.household_measure})` : ''}</option>
                                        ))}
                                    </optgroup>

                                    <optgroup label="Otros">
                                        {safeFoods.filter(f => !availableFoods.includes(f) && f && f.name).map(f => (
                                            <option key={f.id} value={f.id}>{String(f.name)}</option>
                                        ))}
                                    </optgroup>
                                </select>

                                {/* Calorie Badge */}
                                <div className="hidden sm:flex items-center justify-center w-24 bg-black/40 rounded border border-zinc-800/50 px-2 py-1 mr-2 flex-col leading-none">
                                    <span className={`text-xs font-mono font-bold ${currentKcal > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                        {currentKcal > 0 ? `${currentKcal} kcal` : '-'}
                                    </span>
                                    {!isGeneric && householdMeasure && <span className="text-[9px] text-zinc-500 max-w-full overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">{householdMeasure}</span>}
                                    {isGeneric && <span className="text-[9px] text-primary/70 mt-0.5 font-bold">GENÉRICO</span>}
                                </div>

                                <div className="flex items-center gap-1 bg-black rounded border border-zinc-800 px-2 py-1">
                                    <input
                                        type="number"
                                        step={isGeneric ? "0.5" : "1"}
                                        value={block.quantity}
                                        onChange={(e) => {
                                            updateBlock(block.id, 'quantity', e.target.value);
                                        }}
                                        className="w-12 bg-transparent text-right text-white text-sm outline-none"
                                    />
                                    <span className="text-xs text-zinc-500">{isGeneric ? 'x' : block.unit}</span>
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
