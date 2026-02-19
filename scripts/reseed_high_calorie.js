import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env
const envPath = path.join(rootDir, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

console.log('🌱 Reseeding Foods with High-Calorie Standard (200/150/100)...');

const foods = [
    // PROTEIN (Target: 150 kcal)
    { name: 'Pollo (pechuga, cocido)', category: 'protein', grams: 100, measure: '1 palma', cals: 150, p: 31, c: 0, f: 3.6 },
    { name: 'Vacuno magro (cocido)', category: 'protein', grams: 85, measure: '1 palma chica', cals: 176, p: 22, c: 0, f: 8 }, // Image says 85g
    { name: 'Huevos enteros', category: 'protein', grams: 110, measure: '2 un', cals: 140, p: 12.6, c: 1.1, f: 10 },
    { name: 'Leche descremada', category: 'protein', grams: 395, measure: '1½ vasos', cals: 38, p: 13, c: 19, f: 0.4 }, // Image: 395ml
    { name: 'Yogurt descremado', category: 'protein', grams: 405, measure: '2 potes grandes', cals: 37, p: 16.2, c: 24.3, f: 0.8 }, // Image: 405g
    { name: 'Queso fresco', category: 'protein', grams: 115, measure: '1 trozo grande (2 dedos)', cals: 130, p: 13.8, c: 3.5, f: 9.2 }, // Image: 115g

    // CARBOHYDRATE (Target: 200 kcal)
    { name: 'Arroz cocido', category: 'carb', grams: 220, measure: '1 taza bien llena', cals: 91, p: 6, c: 61.6, f: 0.7 }, // Image: 220g
    { name: 'Fideos cocidos', category: 'carb', grams: 235, measure: '1½ tazas aprox.', cals: 85, p: 6.8, c: 72.9, f: 1.5 }, // Image: 235g
    { name: 'Papas cocidas', category: 'carb', grams: 265, measure: '2 papas medianas', cals: 75, p: 5.3, c: 53, f: 0.3 }, // Image: 265g
    { name: 'Avena', category: 'carb', grams: 55, measure: '6 cucharadas soperas', cals: 364, p: 9.3, c: 36.4, f: 3.8 }, // Image: 55g
    { name: 'Pan integral', category: 'carb', grams: 85, measure: '3 rebanadas', cals: 235, p: 10.2, c: 35.7, f: 3.4 }, // Image: 85g
    { name: 'Plátano', category: 'carb', grams: 230, measure: '2 plátanos chicos', cals: 87, p: 2.5, c: 52.9, f: 0.7 }, // Image: 230g
    { name: 'Manzana', category: 'carb', grams: 385, measure: '2 manzanas medianas', cals: 52, p: 1, c: 53.9, f: 0.8 }, // Image: 385g
    { name: 'Naranja', category: 'carb', grams: 405, measure: '3 naranjas medianas', cals: 49, p: 3.6, c: 48.6, f: 0.4 }, // Image: 405g

    // FAT (Target: 100 kcal)
    { name: 'Aceite de oliva', category: 'fat', grams: 11, measure: '1 cucharada sopera', cals: 884, p: 0, c: 0, f: 100 }, // Image: 11g
    { name: 'Palta', category: 'fat', grams: 65, measure: '½ palta chica', cals: 160, p: 1.3, c: 5.9, f: 9.8 }, // Image: 65g
];

async function run() {
    // 1. Clear Foods
    const { error: delError } = await supabase.from('foods').delete().neq('id', 0); // Delete all
    if (delError) console.error('Delete Error:', delError);

    // 2. Insert Generic Blocks (Important for AI)
    const blocks = [
        { name: 'bloque proteina', category: 'protein', portion_grams: 1, household_measure: '1 porción', calories_per_100g: 150, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3 },
        { name: 'bloque carbohidrato', category: 'carb', portion_grams: 1, household_measure: '1 porción', calories_per_100g: 200, protein_per_100g: 6, carbs_per_100g: 45, fat_per_100g: 1 },
        { name: 'bloque grasa', category: 'fat', portion_grams: 1, household_measure: '1 porción', calories_per_100g: 100, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 11 },
    ];
    await supabase.from('foods').insert(blocks);

    // 3. Insert Real Foods
    const toInsert = foods.map(f => ({
        name: f.name,
        category: f.category,
        portion_grams: f.grams,
        household_measure: f.measure,
        calories_per_100g: f.cals,
        protein_per_100g: f.p,
        carbs_per_100g: f.c,
        fat_per_100g: f.f
    }));

    const { error } = await supabase.from('foods').insert(toInsert);
    if (error) console.error('Insert Error:', error);
    else console.log('✅ Successfully reseeded foods!');
}

run();
