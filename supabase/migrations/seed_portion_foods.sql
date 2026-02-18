-- Add columns for Portion System
alter table public.foods
add column if not exists portion_grams integer default 100,
    add column if not exists household_measure text default '';
-- Clear existing data to re-seed cleanly
truncate table public.foods restart identity;
-- Seed Data (Portion System)
insert into public.foods (
        name,
        category,
        portion_grams,
        household_measure,
        calories_per_100g,
        protein_per_100g,
        carbs_per_100g,
        fat_per_100g
    )
values -- PROTEINS (Target: ~65kcal, 11g P per portion)
    (
        'Carne roja magra',
        'protein',
        50,
        '1/2 palma',
        130,
        22,
        0,
        4
    ),
    (
        'Carne molida (<5% grasa)',
        'protein',
        50,
        '1/4 taza',
        130,
        22,
        0,
        4
    ),
    (
        'Pechuga de Pollo',
        'protein',
        50,
        '1/2 palma',
        130,
        22,
        0,
        3
    ),
    (
        'Pechuga de Pavo',
        'protein',
        50,
        '1/2 palma',
        130,
        22,
        0,
        3
    ),
    (
        'Trutro de Pollo (sin piel)',
        'protein',
        50,
        '1/2 palma',
        130,
        22,
        0,
        4
    ),
    (
        'Jamón de Pavo/Pollo',
        'protein',
        55,
        '2 rebanadas',
        118,
        20,
        1,
        3
    ),
    (
        'Reineta / Merluza / Trucha',
        'protein',
        70,
        '3/4 palma',
        92,
        15.7,
        0,
        2
    ),
    -- 65kcal / 0.7 = ~92kcal/100g
    (
        'Atún en agua',
        'protein',
        60,
        '1/2 lata',
        108,
        18,
        0,
        1
    ),
    (
        'Jurel al agua',
        'protein',
        70,
        '3/4 palma',
        93,
        15,
        0,
        2
    ),
    (
        'Camarones',
        'protein',
        60,
        '1/2 taza',
        108,
        18,
        0,
        1
    ),
    (
        'Choritos en agua',
        'protein',
        60,
        '1/2 lata',
        108,
        18,
        0,
        2
    ),
    (
        'Claras de huevo',
        'protein',
        100,
        '3 claras',
        52,
        11,
        0,
        0
    ),
    (
        'Huevo entero',
        'protein',
        60,
        '1 unidad',
        143,
        12,
        1,
        10
    ),
    -- A bit higher fat, listed in images
    -- LEGUMES/VEGAN (Protein Source)
    (
        'Carne vegetal (soya) cocida',
        'protein',
        50,
        '3/4 taza',
        130,
        22,
        5,
        1
    ),
    ('Tofu', 'protein', 50, '1 trozo', 130, 15, 2, 6),
    (
        'Lenteja cocida',
        'protein',
        150,
        '3/4 taza',
        116,
        9,
        20,
        0.4
    ),
    -- Mixed macro basically
    (
        'Poroto cocido',
        'protein',
        100,
        '3/4 taza',
        127,
        9,
        22,
        0.5
    ),
    (
        'Garbanzo cocido',
        'protein',
        130,
        '3/4 taza',
        164,
        9,
        27,
        2.6
    ),
    -- CARBOHYDRATES (Target: ~140kcal, 30g C per portion)
    (
        'Arroz cocido',
        'carb',
        100,
        '3/4 taza',
        140,
        2.5,
        30,
        0.5
    ),
    -- Based on 140kcal/portion target
    (
        'Fideos / Pastas cocidas',
        'carb',
        100,
        '3/4 taza',
        140,
        4,
        30,
        0.5
    ),
    (
        'Papas cocidas',
        'carb',
        150,
        '1 unidad regular',
        93,
        2,
        20,
        0.1
    ),
    -- 140/1.5 = 93
    ('Avena', 'carb', 40, '1/2 taza', 350, 13, 60, 6),
    -- 140/0.4 = 350
    (
        'Pan Marraqueta / Hallulla',
        'carb',
        50,
        '1/2 unidad',
        280,
        8,
        55,
        3
    ),
    -- 140/0.5 = 280
    (
        'Pan Molde',
        'carb',
        60,
        '2 rebanadas',
        233,
        8,
        45,
        3
    ),
    -- 140/0.6 = 233
    (
        'Galletas de Arroz',
        'carb',
        37,
        '5 unidades',
        378,
        8,
        80,
        2
    ),
    -- 140/0.37 = 378
    (
        'Choclo cocido',
        'carb',
        160,
        '1 taza',
        87,
        3,
        19,
        1
    ),
    -- 140/1.6 = 87
    (
        'Quinoa cocida',
        'carb',
        100,
        '3/4 taza',
        140,
        4,
        25,
        2
    ),
    (
        'Cuscús cocido',
        'carb',
        100,
        '1 taza',
        140,
        4,
        28,
        0.5
    ),
    -- FATS (Target: ~175kcal, 15g F per portion)
    (
        'Aceite de Oliva/Canola',
        'fat',
        20,
        '4 cucharaditas',
        875,
        0,
        0,
        100
    ),
    (
        'Aceitunas',
        'fat',
        115,
        '11 unidades',
        152,
        1,
        4,
        13
    ),
    -- 175/1.15 = 152
    (
        'Nueces',
        'fat',
        25,
        '5 unidades',
        700,
        15,
        14,
        65
    ),
    -- 175/0.25 = 700
    (
        'Almendras',
        'fat',
        25,
        '26-30 unidades',
        700,
        21,
        22,
        50
    ),
    (
        'Palta',
        'fat',
        90,
        '3 cucharadas',
        194,
        2,
        9,
        16
    ),
    -- 175/0.9 = 194
    (
        'Mantequilla de maní',
        'fat',
        32,
        '2 cucharaditas',
        546,
        25,
        20,
        50
    ),
    -- 175/0.32 = 546
    (
        'Semillas (Chia/Linaza)',
        'fat',
        30,
        '3 cucharadas',
        583,
        18,
        30,
        40
    ),
    -- FRUITS (Target: ~65kcal, 15g C per portion)
    (
        'Manzana',
        'fruit',
        100,
        '1 unidad',
        65,
        0.3,
        15,
        0.2
    ),
    (
        'Plátano',
        'fruit',
        60,
        '1/2 unidad',
        108,
        1,
        25,
        0.3
    ),
    -- 65/0.6 = 108
    (
        'Naranja',
        'fruit',
        100,
        '1 unidad',
        65,
        1,
        15,
        0.1
    ),
    (
        'Frutillas',
        'fruit',
        200,
        '1 taza',
        32,
        0.7,
        7.5,
        0.3
    ),
    -- 65/2 = 32.5
    (
        'Arándanos',
        'fruit',
        120,
        '1 taza',
        54,
        0.7,
        14,
        0.3
    ),
    (
        'Kiwi',
        'fruit',
        100,
        '2 unidades',
        65,
        1,
        15,
        0.5
    ),
    -- DAIRY (Target: ~70-90kcal)
    (
        'Leche descremada',
        'dairy',
        200,
        '1 taza',
        40,
        3,
        5,
        0.1
    ),
    -- 80/2 = 40
    (
        'Yogurt descremado',
        'dairy',
        150,
        '1 unidad',
        53,
        4,
        6,
        0.1
    ),
    (
        'Yogurt proteico',
        'dairy',
        150,
        '1 unidad',
        60,
        10,
        5,
        0.2
    ),
    (
        'Quesillo',
        'dairy',
        90,
        'Rodela 3cm',
        100,
        12,
        3,
        4
    );
-- Reset sequence if needed (but identity handles it)