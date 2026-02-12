/**
 * Base de datos de ejercicios para mapear nombres en español a imágenes del repositorio yuhonas/free-exercise-db
 * Repositorio: https://github.com/yuhonas/free-exercise-db
 */

const BASE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

// Mapeo de términos clave en español a carpetas/nombres de archivos en el repo
// El repo usa nombres en inglés con guiones, ej: "Barbell_Bench_Press/0.jpg"
const EXERCISE_MAP = {
    // Pecho
    "press de banca": "Barbell_Bench_Press_-_Medium_Grip/0.jpg",
    "press banca": "Barbell_Bench_Press_-_Medium_Grip/0.jpg",
    "press inclinado": "Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg",
    "aperturas": "Dumbbell_Flyes/0.jpg",
    "flexiones": "Push_Ups/0.jpg",
    "push ups": "Push_Ups/0.jpg",
    "fondos": "Dips/0.jpg",

    // Espalda
    "peso muerto": "Barbell_Deadlift/0.jpg",
    "remo con barra": "Barbell_Row/0.jpg",
    "remo con mancuerna": "Dumbbell_Row/0.jpg",
    "jalon al pecho": "Lat_Pulldown/0.jpg",
    "jalón al pecho": "Lat_Pulldown/0.jpg",
    "dominadas": "Pull_Ups/0.jpg",
    "pull ups": "Pull_Ups/0.jpg",
    "remo en polea": "Seated_Cable_Rows/0.jpg",

    // Piernas
    "sentadillas": "Barbell_Squat/0.jpg",
    "sentadilla": "Barbell_Squat/0.jpg",
    "prensa": "Leg_Press/0.jpg",
    "extensiones de cuadriceps": "Leg_Extensions/0.jpg",
    "extensiones de cuádriceps": "Leg_Extensions/0.jpg",
    "curl femoral": "Lying_Leg_Curls/0.jpg",
    "zancadas": "Dumbbell_Lunges/0.jpg",
    "estocadas": "Dumbbell_Lunges/0.jpg",
    "elevacion de talones": "Calf_Raises/0.jpg",
    "elevación de talones": "Calf_Raises/0.jpg",

    // Hombros
    "press militar": "Standing_Military_Press/0.jpg",
    "press de hombros": "Dumbbell_Shoulder_Press/0.jpg",
    "elevaciones laterales": "Side_Lateral_Raise/0.jpg",
    "pajaros": "Dumbbell_Rear_Delt_Row/0.jpg",
    "pájaros": "Dumbbell_Rear_Delt_Row/0.jpg",

    // Brazos
    "curl de biceps": "Barbell_Curl/0.jpg",
    "curl de bíceps": "Barbell_Curl/0.jpg",
    "curl con mancuernas": "Dumbbell_Bicep_Curl/0.jpg",
    "press frances": "Barbell_Guillotine_Bench_Press/0.jpg",
    "press francés": "Barbell_Guillotine_Bench_Press/0.jpg",
    "extension de triceps": "Triceps_Pushdown/0.jpg",
    "extensión de tríceps": "Triceps_Pushdown/0.jpg",

    // Core
    "plancha": "Plank/0.jpg",
    "crunch": "Ab_Crunch_Machine/0.jpg",
    "elevacion de piernas": "Hanging_Leg_Raise/0.jpg",
    "elevación de piernas": "Hanging_Leg_Raise/0.jpg"
};

/**
 * Busca una imagen para un nombre de ejercicio dado
 * @param {string} exerciseName 
 * @returns {string|null} URL de la imagen o null si no se encuentra
 */
export const getExerciseImageUrl = (exerciseName) => {
    if (!exerciseName) return null;

    const normalized = exerciseName.toLowerCase().trim();

    // Búsqueda exacta primero
    if (EXERCISE_MAP[normalized]) {
        return `${BASE_URL}${EXERCISE_MAP[normalized]}`;
    }

    // Intento de búsqueda parcial (ej: si el nombre es "Sentadillas con barra" -> busca "sentadillas")
    for (const [key, path] of Object.entries(EXERCISE_MAP)) {
        if (normalized.includes(key)) {
            return `${BASE_URL}${path}`;
        }
    }

    return null;
};
