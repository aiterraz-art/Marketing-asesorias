import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Key missing. Ensure .env is configured.')
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
)

// Brand Voices Helpers

export const getBrandVoices = async () => {
    const { data, error } = await supabase
        .from('brand_voices')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export const createBrandVoice = async (voice) => {
    const { data, error } = await supabase
        .from('brand_voices')
        .insert([voice])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export const updateBrandVoice = async (id, updates) => {
    const { data, error } = await supabase
        .from('brand_voices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export const deleteBrandVoice = async (id) => {
    const { error } = await supabase
        .from('brand_voices')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}
// Students Helpers

export const getStudents = async () => {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name', { ascending: true });

    if (error) throw error;
    return data;
}

export const getStudentPlan = async (studentId) => {
    const { data, error } = await supabase
        .from('student_plans')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export const saveStudentPlan = async (plan) => {
    const { data, error } = await supabase
        .from('student_plans')
        .insert([plan])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export const updateStudentData = async (id, updates) => {
    const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export const createStudent = async (student) => {
    const { data, error } = await supabase
        .from('students')
        .insert([student])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export const getStudentMeasurements = async (studentId) => {
    const { data, error } = await supabase
        .from('student_measurements')
        .select('*')
        .eq('student_id', studentId)
        .order('measured_at', { ascending: true });

    if (error) throw error;
    return data;
}

export const addStudentMeasurement = async (measurement) => {
    const { data, error } = await supabase
        .from('student_measurements')
        .insert([measurement])
        .select()
        .single();

    if (error) throw error;
    return data;
}
