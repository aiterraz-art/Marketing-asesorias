import React, { useEffect, useState } from 'react';
import { getFoods } from '../lib/supabase';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

const PortionReference = ({ forceOpen = false }) => {
    const [foods, setFoods] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // If forceOpen is true, we always show content. 
    // Effect to sync forceOpen with internal state if needed, or just use condition.
    useEffect(() => {
        if (forceOpen) setIsOpen(true);
    }, [forceOpen]);

    // ...

    const showContent = isOpen || forceOpen;

    useEffect(() => {
        const loadFoods = async () => {
            // We can pass foods as prop too, but safe to fetch
            const data = await getFoods();
            setFoods(data);
            setLoading(false);
        };
        loadFoods();
    }, []);

    const groups = {
        'protein': { title: 'Proteínas y Lácteos', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', note: '~150 kcal | 31g Proteína' },
        'carb': { title: 'Carbohidratos y Frutas', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', note: '~200 kcal | 45g Carbohidratos' },
        'fat': { title: 'Grasas', color: 'text-yellow-600', bg: 'bg-yellow-600/10', border: 'border-yellow-600/20', note: '~100 kcal | 11g Grasa' },
        'vegetable': { title: 'Vegetales (Libre Consumo)', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', note: 'Bajos en calorías' },
    };

    if (loading) return null;

    return (
        <div className="mb-8 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Info size={20} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg text-white">Guía de Porciones</h3>
                        <p className="text-sm text-zinc-400">Consulta los alimentos equivalentes por grupo</p>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
            </button>

            {showContent && (
                <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                    {Object.entries(groups).map(([key, config]) => {
                        const groupFoods = foods.filter(f => {
                            // Normalize check
                            const cat = (f.category || '').toLowerCase();
                            if (key === 'fat') return cat.includes('fat') || cat.includes('gras') || cat.includes('lipid');
                            if (key === 'dairy') return cat.includes('lact') || cat.includes('dairy');
                            return cat.includes(key);
                        });

                        if (groupFoods.length === 0) return null;

                        return (
                            <div key={key} className={`rounded-xl border ${config.border} overflow-hidden flex flex-col`}>
                                <div className={`p-3 ${config.bg} border-b ${config.border}`}>
                                    <h4 className={`font-bold ${config.color} text-sm uppercase flex justify-between items-center`}>
                                        {config.title}
                                        <span className="text-[10px] opacity-70 bg-black/20 px-2 py-0.5 rounded">{config.note}</span>
                                    </h4>
                                </div>
                                <div className="p-0 bg-black/20 flex-1">
                                    <table className="w-full text-xs text-left">
                                        <thead className="text-zinc-500 font-medium bg-black/40">
                                            <tr>
                                                <th className="p-2 pl-3">Alimento</th>
                                                <th className="p-2 text-right">Gramos</th>
                                                <th className="p-2 text-right pr-3">Medida</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/50">
                                            {groupFoods.map(food => (
                                                <tr key={food.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-2 pl-3 text-zinc-300 font-medium">{food.name}</td>
                                                    <td className="p-2 text-right text-zinc-400">{food.portion_grams ? `${food.portion_grams}g` : '-'}</td>
                                                    <td className="p-2 text-right pr-3 text-zinc-500">{food.household_measure || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PortionReference;
