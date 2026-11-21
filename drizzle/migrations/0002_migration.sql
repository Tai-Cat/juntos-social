UPDATE public.plans p SET starts_at = (date_trunc('day', now() AT TIME ZONE 'Europe/Paris') + v.d * interval '1 day' + v.h * interval '1 hour') AT TIME ZONE 'Europe/Paris'
FROM (VALUES
 ('Wheel-throwing pottery at Atelier Terre', 1, 18.5),
 ('Ramen tasting crawl', 2, 19.5),
 ('Bouldering intro session', 3, 10),
 ('Dog walk, Bois de Vincennes', 1, 9),
 ('Marché d''Aligre wander', 2, 10),
 ('Sunset run along the Seine', 1, 17),
 ('Board-game night', 4, 20),
 ('Daytime co-working', 3, 10),
 ('Step-free museum visit', 3, 14.5),
 ('Natural wine bar dinner', 5, 20),
 ('Off-peak climbing, quiet gym', 3, 15),
 ('Pastel de nata baking class', 20, 15),
 ('Sunset at Miradouro da Graça', 22, 18),
 ('Port cellar tour', 25, 16),
 ('Trastevere evening walk', 30, 19),
 ('Beach volleyball', 18, 11),
 ('Tapas evening', 19, 21)
) AS v(title, d, h)
WHERE p.is_example AND p.title = v.title;