import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env manually
const envPath = path.join(rootDir, '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        if (key && val && !key.startsWith('#')) {
            env[key] = val;
        }
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL or Key missing in .env');
    process.exit(1);
}

console.log(`🔌 Connecting to Supabase at ${supabaseUrl}...`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('🔍 Updating Generic Food Macros to High-Calorie Standard...');

    const updates = [
        { name: 'bloque proteina', cals: 150, p: 31, c: 0, f: 3 },
        { name: 'bloque carbohidrato', cals: 200, p: 6, c: 45, f: 1 },
        { name: 'bloque grasa', cals: 100, p: 0, c: 0, f: 11 }
    ];

    for (const item of updates) {
        const { error } = await supabase
            .from('foods')
            .update({
                calories_per_100g: item.cals,
                protein_per_100g: item.p,
                carbs_per_100g: item.c,
                fat_per_100g: item.f
            })
            .eq('name', item.name);

        if (error) {
            console.error(`❌ Failed to update ${item.name}:`, error.message);
        } else {
            console.log(`✅ Updated ${item.name} -> ${item.cals} kcal`);
        }
    }
}

migrate();
