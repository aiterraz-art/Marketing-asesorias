-- Standardize Diet Plan Titles
-- Replaces old "Distrbución Diaria" titles with the new "Ejemplo de Comida Diaria" format.
UPDATE public.student_plans
SET nutrition_plan_text = REPLACE(
        nutrition_plan_text,
        'DISTRIBUCIÓN DIARIA (ABSTRACTA Y FLEXIBLE)',
        'EJEMPLO DE COMIDA DIARIA'
    );
UPDATE public.student_plans
SET nutrition_plan_text = REPLACE(
        nutrition_plan_text,
        'PLAN DETALLADO (SOLO CON ALIMENTOS PERMITIDOS)',
        'EJEMPLO DE COMIDA DIARIA'
    );
-- Case insensitive attempt (Postgres doesn't have ILIKE for replace, so we do specific variations if needed)
UPDATE public.student_plans
SET nutrition_plan_text = REPLACE(
        nutrition_plan_text,
        'DISTRIBUCION DIARIA',
        'EJEMPLO DE COMIDA DIARIA'
    );