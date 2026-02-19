-- Add Generic / Abstract Portions for the Editor
-- These represent "1 Portion of X" as a standalone item
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
values -- We use 100g as base for "1 Portion" to make math easy (Multiplier 1.0 = 100g)
    -- So calories_per_100g here effectively means "Calories per Portion"
    (
        'bloque proteina',
        'protein',
        1,
        '1 porción',
        150,
        31,
        0,
        3
    ),
    (
        'bloque carbohidrato',
        'carb',
        1,
        '1 porción',
        200,
        6,
        45,
        1
    ),
    (
        'bloque grasa',
        'fat',
        1,
        '1 porción',
        100,
        0,
        0,
        11
    ),
    (
        'bloque fruta',
        'fruit',
        1,
        '1 porción',
        65,
        1,
        15,
        0
    ),
    (
        'bloque lacteo',
        'dairy',
        1,
        '1 porción',
        80,
        5,
        8,
        2
    ),
    (
        'bloque vegetal',
        'vegetable',
        1,
        '1 porción',
        30,
        2,
        5,
        0
    );