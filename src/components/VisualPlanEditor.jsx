import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Save, ArrowRight, RefreshCw, X } from 'lucide-react';

const VisualPlanEditor = ({ initialText, foods = [], onSave, onCancel }) => {

    // Helper: Normalize category strings
    const normalizeCategory = (cat) => {
        if (!cat) return 'other';
        const lower = cat.toLowerCase();
        if (lower.includes('carb')) return 'carb';
        if (lower.includes('prot')) return 'protein';
        if (lower.includes('gras') || lower.includes('fat') || lower.includes('lipid')) return 'fat';
        if (lower.includes('frut')) return 'fruit';
        if (lower.includes('veg')) return 'vegetable';
        if (lower.includes('lact') || lower.includes('dairy')) return 'dairy';
        return 'other';
    };

    // Parser: Text -> Blocks (No changes needed for parsing, it just reads text)
    // ...

    // ... (inside component)

    const handleFoodChange = (blockId, newFoodId) => {
        const food = foods.find(f => f.id.toString() === newFoodId);
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

                if (oldFood && oldFood.portion_grams && food.portion_grams) {
                    // Calculate how many portions the user currently has
                    const currentPortions = parseInt(b.quantity) / oldFood.portion_grams;
                    // Apply that portion count to the new food standard
                    newQuantity = Math.round(currentPortions * food.portion_grams);
                } else if (food.portion_grams) {
                    // If we can't find old food data, just default to 1 portion of the new food
                    newQuantity = food.portion_grams;
                }

                // Recalculate Macros for the new quantity
                const ratio = newQuantity / 100;
                const newKcal = Math.round(food.calories_per_100g * ratio);
                const newP = Math.round(food.protein_per_100g * ratio);
                const newC = Math.round(food.carbs_per_100g * ratio);
                const newF = Math.round(food.fat_per_100g * ratio);
                // Also get the household measure text
                const measureText = food.household_measure ? ` (${food.household_measure})` : '';

                // Assuming table structure: | Name | Qty | Visual | P | C | F | Kcal |
                const parts = b.original.split('|');
                if (parts.length >= 8) {
                    parts[1] = ` ${newName} `;
                    parts[2] = ` ${newQuantity} g `; // Update Quantity column
                    parts[3] = ` ${measureText || parts[3].trim()} `; // Update Visual Measure column if available
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
                unit: 'g' // Ensure unit is g
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
