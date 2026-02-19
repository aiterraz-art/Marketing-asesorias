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
        const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
        if (key && val && !key.startsWith('#')) {
            env[key] = val;
        }
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
// Prefer Service Role Key if available (bypasses RLS), otherwise Anon Key
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL or Key missing in .env');
    process.exit(1);
}

console.log(`🔌 Connecting to Supabase at ${supabaseUrl}...`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('🔍 Fetching all student plans...');

    // Fetch generic everything - we can filter in memory or DB
    // Since we need to replace text, doing it in memory is safer for specific complex logic
    // But basic replace can be done in DB if using raw SQL, which we can't easily do here without rpc.
    // So we fetch, modify, update.

    const { data: plans, error } = await supabase
        .from('student_plans')
        .select('id, nutrition_plan_text');

    if (error) {
        console.error('❌ Error fetching plans:', error);
        return;
    }

    console.log(`📦 Found ${plans.length} plans. Checking for old titles...`);

    let updatedCount = 0;

    for (const plan of plans) {
        if (!plan.nutrition_plan_text) continue;

        let newText = plan.nutrition_plan_text;
        let modified = false;

        // Pattern 1: DISTRIBUCIÓN DIARIA (ABSTRACTA Y FLEXIBLE)
        if (newText.includes('DISTRIBUCIÓN DIARIA (ABSTRACTA Y FLEXIBLE)')) {
            newText = newText.replace(/DISTRIBUCIÓN DIARIA \(ABSTRACTA Y FLEXIBLE\)/g, 'EJEMPLO DE COMIDA DIARIA');
            modified = true;
        }

        // Pattern 2: DISTRIBUCION DIARIA
        if (newText.includes('DISTRIBUCION DIARIA')) {
            newText = newText.replace(/DISTRIBUCION DIARIA/g, 'EJEMPLO DE COMIDA DIARIA');
            modified = true;
        }

        // Pattern 3: DISTRIBUCIÓN DIARIA (Simple)
        if (newText.includes('DISTRIBUCIÓN DIARIA') && !newText.includes('EJEMPLO DE COMIDA DIARIA')) { // Avoid double replacement if already correct context
            newText = newText.replace(/DISTRIBUCIÓN DIARIA/g, 'EJEMPLO DE COMIDA DIARIA');
            modified = true;
        }

        // Pattern 4: PLAN DETALLADO (SOLO CON ALIMENTOS PERMITIDOS)
        if (newText.includes('PLAN DETALLADO (SOLO CON ALIMENTOS PERMITIDOS)')) {
            newText = newText.replace(/PLAN DETALLADO \(SOLO CON ALIMENTOS PERMITIDOS\)/g, 'EJEMPLO DE COMIDA DIARIA');
            modified = true;
        }

        if (modified) {
            console.log(`   📝 Updating Plan ID: ${plan.id}...`);
            const { error: updateError } = await supabase
                .from('student_plans')
                .update({ nutrition_plan_text: newText })
                .eq('id', plan.id);

            if (updateError) {
                console.error(`      ❌ Failed to update Plan ${plan.id}:`, updateError.message);
            } else {
                console.log(`      ✅ Updated.`);
                updatedCount++;
            }
        }
    }

    console.log(`\n✨ Migration Complete. Updated ${updatedCount} plans.`);
}

migrate();
