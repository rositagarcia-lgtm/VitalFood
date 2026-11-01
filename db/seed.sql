-- Datos iniciales. Solo inserta lo que no existe (por nombre o título), así que se puede
-- ejecutar más de una vez sin duplicar ni pisar lo que se editó en el panel.
-- Los valores nutricionales son referenciales por porción; el equipo los ajusta en el panel.
-- Las fotos se suben desde el panel.

INSERT INTO categorias (nombre, descripcion, orden) VALUES
  ('Desayunos', 'Opciones frescas para empezar el día', 1),
  ('Bowls', 'Bowls con proteína, granos y vegetales frescos', 2),
  ('Almuerzos', 'Platos completos y balanceados', 3),
  ('Ensaladas', 'Ensaladas frescas con aliños de la casa', 4),
  ('Snacks', 'Opciones ligeras para cualquier momento', 5),
  ('Bebidas', 'Jugos naturales, batidos y refrescos', 6),
  ('Postres', 'Postres ligeros para cerrar la comida', 7)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO platillos (categoria_id, nombre, slug, descripcion, precio, precio_oferta, destacado, personalizable,
                       orden, porcion_g, proteinas, carbohidratos, grasas, fibra, etiquetas, objetivos,
                       ingredientes, alergenos, conservacion)
SELECT c.id, v.nombre, v.slug, v.descripcion, v.precio, v.oferta, v.destacado, v.personalizable,
       v.orden, v.porcion, v.p, v.c, v.g, v.f, v.etiquetas, v.objetivos, v.ingredientes, v.alergenos, v.conservacion
FROM (VALUES
  -- Desayunos
  ('Desayunos', 'Tostadas de palta y huevo', 'tostadas-de-palta-y-huevo',
   'Pan integral tostado con palta, huevo pochado, tomate cherry y semillas.', 15.90, NULL::numeric, FALSE, FALSE, 1,
   320, 18, 38, 20, 8, ARRAY['Vegetariano'], ARRAY['energia'],
   'Pan integral, palta, huevo, tomate cherry, semillas de chía y ajonjolí, limón.',
   'Contiene gluten, huevo y ajonjolí.', 'Se prepara al momento. Consumir de inmediato.'),
  ('Desayunos', 'Bowl de avena y frutos rojos', 'bowl-de-avena-y-frutos-rojos',
   'Avena cocida en bebida de almendras con fresas, arándanos, plátano y granola.', 13.90, NULL, FALSE, FALSE, 2,
   350, 12, 62, 9, 9, ARRAY['Vegetariano'], ARRAY['energia'],
   'Avena, bebida de almendras, fresas, arándanos, plátano, granola, miel.',
   'Contiene gluten y frutos secos.', 'Mantener refrigerado entre 0 °C y 5 °C. Consumir dentro de 24 horas.'),
  ('Desayunos', 'Omelette de claras con espinaca', 'omelette-de-claras-con-espinaca',
   'Omelette de claras con espinaca, champiñones y queso fresco, con fruta picada.', 16.90, NULL, FALSE, FALSE, 3,
   280, 26, 14, 9, 4, ARRAY['Alto en proteína', 'Sin gluten'], ARRAY['proteina', 'bajo'],
   'Claras de huevo, espinaca, champiñones, queso fresco, fruta de estación.',
   'Contiene huevo y lácteos.', 'Se prepara al momento. Consumir de inmediato.'),
  -- Bowls
  ('Bowls', 'Bowl Vital', 'bowl-vital',
   'Pollo grillado, quinua, palta, mix de hojas y vegetales frescos con aliño cítrico.', 24.90, NULL, TRUE, TRUE, 1,
   450, 38, 46, 18, 9, ARRAY['Alto en proteína', 'Sin gluten'], ARRAY['proteina'],
   'Pechuga de pollo, quinua, palta, mix de hojas, tomate, pepino, choclo, aliño de limón y aceite de oliva.',
   'Sin alérgenos principales declarados.', 'Mantener refrigerado entre 0 °C y 5 °C. Consumir dentro de 48 horas.'),
  ('Bowls', 'Bowl teriyaki de pollo', 'bowl-teriyaki-de-pollo',
   'Pollo salteado en salsa teriyaki ligera, arroz integral, brócoli, zanahoria y ajonjolí.', 25.90, NULL, FALSE, FALSE, 2,
   460, 36, 58, 14, 6, ARRAY['Alto en proteína'], ARRAY['proteina', 'energia'],
   'Pechuga de pollo, arroz integral, brócoli, zanahoria, cebollita china, salsa teriyaki baja en azúcar, ajonjolí.',
   'Contiene soya, gluten y ajonjolí.', 'Mantener refrigerado entre 0 °C y 5 °C. Calentar 2 a 3 minutos.'),
  ('Bowls', 'Poke de atún', 'poke-de-atun',
   'Atún marinado, arroz de sushi, edamame, mango, palta y salsa de soya ligera.', 29.90, 26.90, FALSE, FALSE, 3,
   420, 32, 52, 15, 6, ARRAY['Alto en proteína'], ARRAY['proteina'],
   'Atún, arroz, edamame, mango, palta, pepino, cebolla morada, salsa de soya, ajonjolí.',
   'Contiene pescado, soya y ajonjolí.', 'Mantener refrigerado entre 0 °C y 5 °C. Consumir el mismo día.'),
  ('Bowls', 'Bowl veggie de garbanzos', 'bowl-veggie-de-garbanzos',
   'Garbanzos especiados, camote asado, quinua, hojas verdes y salsa de tahini.', 22.90, NULL, FALSE, FALSE, 4,
   430, 17, 55, 16, 13, ARRAY['Vegano', 'Sin gluten'], ARRAY['vegano'],
   'Garbanzos, camote, quinua, espinaca, col morada, tahini, limón, comino.',
   'Contiene ajonjolí (tahini).', 'Mantener refrigerado entre 0 °C y 5 °C. Consumir dentro de 48 horas.'),
  -- Almuerzos
  ('Almuerzos', 'Pollo garden', 'pollo-garden',
   'Pechuga grillada con vegetales salteados, palta y cereales integrales.', 26.90, NULL, TRUE, TRUE, 1,
   480, 42, 40, 15, 8, ARRAY['Alto en proteína', 'Sin gluten'], ARRAY['proteina'],
   'Pechuga de pollo, arroz integral y quinua, zapallito, brócoli, pimiento, palta.',
   'Sin alérgenos principales declarados.', 'Mantener refrigerado entre 0 °C y 5 °C. Calentar 2 a 3 minutos.'),
  ('Almuerzos', 'Lomo saltado fit', 'lomo-saltado-fit',
   'Lomo fino salteado con cebolla, tomate y ají amarillo, con arroz integral y papas al horno.', 28.90, NULL, FALSE, FALSE, 2,
   450, 35, 45, 16, 5, ARRAY['Alto en proteína'], ARRAY['proteina'],
   'Lomo de res, cebolla, tomate, ají amarillo, sillao, arroz integral, papa al horno.',
   'Contiene soya y gluten (sillao).', 'Mantener refrigerado entre 0 °C y 5 °C. Calentar 2 a 3 minutos.'),
  ('Almuerzos', 'Pescado a la plancha con quinua', 'pescado-a-la-plancha-con-quinua',
   'Filete de pescado del día a la plancha con quinua y ensalada fresca.', 29.90, NULL, FALSE, FALSE, 3,
   450, 38, 38, 12, 6, ARRAY['Alto en proteína', 'Sin gluten'], ARRAY['proteina', 'bajo'],
   'Pescado blanco del día, quinua, lechuga, tomate, pepino, limón, aceite de oliva.',
   'Contiene pescado.', 'Mantener refrigerado entre 0 °C y 5 °C. Consumir el mismo día.'),
  -- Ensaladas
  ('Ensaladas', 'Ensalada Mediterránea', 'ensalada-mediterranea',
   'Hojas verdes, tomate, pepino, garbanzos, aceitunas y queso feta con aliño cítrico.', 21.90, NULL, TRUE, FALSE, 1,
   380, 12, 30, 18, 10, ARRAY['Vegetariano', 'Sin gluten'], ARRAY['bajo'],
   'Lechuga, espinaca, tomate, pepino, garbanzos, aceitunas, queso feta, cebolla morada, aliño de limón.',
   'Contiene lácteos.', 'Mantener refrigerado entre 0 °C y 5 °C. Consumir el mismo día.'),
  ('Ensaladas', 'Ensalada César con pollo', 'ensalada-cesar-con-pollo',
   'Lechuga romana, pollo grillado, crutones integrales, parmesano y aderezo César ligero.', 23.90, NULL, FALSE, FALSE, 2,
   360, 33, 18, 19, 5, ARRAY['Alto en proteína'], ARRAY['proteina'],
   'Lechuga romana, pechuga de pollo, crutones integrales, queso parmesano, aderezo de yogurt.',
   'Contiene gluten, lácteos y huevo.', 'Mantener refrigerado entre 0 °C y 5 °C. Consumir el mismo día.'),
  -- Snacks
  ('Snacks', 'Yogurt griego con granola', 'yogurt-griego-con-granola',
   'Yogurt griego natural con granola crocante, frutos rojos y un toque de miel.', 12.90, NULL, FALSE, FALSE, 1,
   250, 16, 34, 8, 4, ARRAY['Vegetariano'], ARRAY['proteina'],
   'Yogurt griego natural, granola, fresas, arándanos, miel.',
   'Contiene lácteos, gluten y frutos secos.', 'Mantener refrigerado entre 0 °C y 5 °C.'),
  ('Snacks', 'Hummus con bastones de verduras', 'hummus-con-bastones-de-verduras',
   'Hummus de garbanzo casero con bastones de zanahoria, pepino y apio.', 11.90, NULL, FALSE, FALSE, 2,
   220, 8, 22, 12, 7, ARRAY['Vegano', 'Sin gluten'], ARRAY['vegano', 'bajo'],
   'Garbanzos, tahini, limón, ajo, aceite de oliva, zanahoria, pepino, apio.',
   'Contiene ajonjolí (tahini).', 'Mantener refrigerado entre 0 °C y 5 °C. Consumir dentro de 48 horas.'),
  -- Bebidas
  ('Bebidas', 'Green power', 'green-power',
   'Jugo de piña, espinaca, manzana verde y limón. 400 ml.', 10.90, NULL, FALSE, FALSE, 1,
   400, 2, 30, 0.5, 4, ARRAY['Vegano', 'Sin azúcar añadida'], ARRAY['vegano', 'bajo'],
   'Piña, espinaca, manzana verde, limón, agua.',
   'Sin alérgenos principales declarados.', 'Se prepara al momento. Consumir de inmediato.'),
  ('Bebidas', 'Batido de proteína y plátano', 'batido-de-proteina-y-platano',
   'Batido de plátano, avena, leche descremada y proteína de suero. 400 ml.', 13.90, NULL, FALSE, FALSE, 2,
   400, 27, 38, 6, 4, ARRAY['Alto en proteína'], ARRAY['proteina', 'energia'],
   'Plátano, avena, leche descremada, proteína de suero, canela.',
   'Contiene lácteos y gluten.', 'Se prepara al momento. Consumir de inmediato.'),
  ('Bebidas', 'Limonada de hierbabuena', 'limonada-de-hierbabuena',
   'Limonada natural con hierbabuena, endulzada ligeramente. 400 ml.', 7.90, NULL, FALSE, FALSE, 3,
   400, 0, 24, 0, 0, ARRAY['Vegano'], ARRAY['vegano'],
   'Limón, hierbabuena, agua, azúcar rubia.',
   'Sin alérgenos principales declarados.', 'Se prepara al momento. Consumir de inmediato.'),
  -- Postres
  ('Postres', 'Brownie de cacao y avena', 'brownie-de-cacao-y-avena',
   'Brownie húmedo de cacao, avena y nueces, endulzado con panela.', 9.90, 8.50, FALSE, FALSE, 1,
   90, 5, 28, 11, 4, ARRAY['Vegetariano'], ARRAY['energia'],
   'Cacao, avena, huevo, panela, nueces, aceite de coco.',
   'Contiene gluten, huevo y frutos secos.', 'Conservar en lugar fresco y seco. Consumir dentro de 3 días.'),
  ('Postres', 'Mousse de maracuyá light', 'mousse-de-maracuya-light',
   'Mousse ligera de maracuyá con yogurt griego y endulzante natural.', 8.90, NULL, FALSE, FALSE, 2,
   120, 6, 18, 4, 1, ARRAY['Vegetariano', 'Sin gluten'], ARRAY['bajo'],
   'Maracuyá, yogurt griego, gelatina sin sabor, stevia.',
   'Contiene lácteos.', 'Mantener refrigerado entre 0 °C y 5 °C. Consumir dentro de 48 horas.')
) AS v (categoria, nombre, slug, descripcion, precio, oferta, destacado, personalizable, orden,
        porcion, p, c, g, f, etiquetas, objetivos, ingredientes, alergenos, conservacion)
JOIN categorias c ON c.nombre = v.categoria
WHERE NOT EXISTS (SELECT 1 FROM platillos x WHERE x.nombre = v.nombre OR x.slug = v.slug);

INSERT INTO sedes (nombre, direccion, horario, referencia, mapa_url, orden) VALUES
  ('Centro', 'Jr. Bolognesi 502, Centro', 'Lun – Sáb · 8:00 a.m. – 9:00 p.m.', 'A media cuadra de la Plaza de Armas', 'https://maps.google.com/?q=Jr.+Bolognesi+502+Trujillo', 1),
  ('La Merced', 'Díaz de Cienfuegos 287, La Merced', 'Lun – Sáb · 8:00 a.m. – 9:00 p.m.', 'Zona La Merced', 'https://maps.google.com/?q=Diaz+de+Cienfuegos+287+Trujillo', 2),
  ('UPAO', 'Av. América Sur 3145, Monserrate', 'Lun – Vie · 8:00 a.m. – 8:00 p.m.', 'Dentro del campus de la UPAO', 'https://maps.google.com/?q=UPAO+Trujillo', 3),
  ('El Golf', 'Av. El Golf 152, Víctor Larco', 'Lun – Dom · 8:00 a.m. – 9:00 p.m.', 'Urbanización El Golf', 'https://maps.google.com/?q=Av.+El+Golf+152+Trujillo', 4),
  ('MIC', 'Mall Aventura Trujillo, Av. América Oeste', 'Lun – Dom · 10:00 a.m. – 9:00 p.m.', 'Módulo Vital Foods', 'https://maps.google.com/?q=Mall+Aventura+Trujillo', 5)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO promociones (etiqueta, titulo, descripcion, descripcion_secundaria, sticker, texto_boton, enlace_boton, variante, caracteristicas, orden)
SELECT * FROM (VALUES
  ('Nuevo · Vital Week', 'Tu semana saludable, lista cuando la necesitas',
   'Platos preparados y refrigerados para quienes estudian, trabajan o entrenan.',
   NULL, 'NUEVO', 'Ver el menú', '/menu', 'launch', ARRAY['Preparado', 'Refrigerado', 'Listo para calentar'], 1),
  ('Arma tu plato', 'Elige tu proteína, tu base y tus extras',
   'En los bowls y almuerzos personalizables ves al instante el precio y las calorías de tu elección.',
   NULL, NULL, 'Personalizar un bowl', '/menu?categoria=Bowls', 'practicality', ARRAY['Proteína', 'Base', 'Extras'], 2),
  ('Siempre cerca', 'Cinco sedes en Trujillo',
   'Centro, La Merced, UPAO, El Golf y Mall Aventura. Encuentra la más cercana.',
   NULL, NULL, 'Ver sedes', '/#sedes', 'organization', ARRAY['Centro', 'La Merced', 'UPAO', 'El Golf', 'MIC'], 3)
) AS v (etiqueta, titulo, descripcion, descripcion_secundaria, sticker, texto_boton, enlace_boton, variante, caracteristicas, orden)
WHERE NOT EXISTS (SELECT 1 FROM promociones p WHERE p.titulo = v.titulo);

-- Textos de la empresa (se editan en el panel). Las cifras, el WhatsApp y las redes quedan vacíos
-- a propósito: solo se muestran en la web cuando la empresa ingresa sus datos reales.
UPDATE empresa SET
  horario = COALESCE(horario, 'Lun – Dom · 8:00 a.m. – 9:00 p.m.'),
  intro_titulo = COALESCE(intro_titulo, 'Cocinamos lo que nos gustaría comer cada día'),
  intro_texto = COALESCE(intro_texto, 'Preparamos comida saludable, fresca y deliciosa en Trujillo para personas con poco tiempo y muchas ganas de cuidarse.'),
  historia_titulo = COALESCE(historia_titulo, 'Comer sano también puede ser delicioso'),
  historia_texto = COALESCE(historia_texto, 'Vital Foods nació en Trujillo al ver que comer sano era difícil para quien trabaja, estudia o entrena: o no había tiempo, o no había opciones ricas.

Hoy cocinamos cada día con ingredientes frescos, indicamos la información nutricional de cada plato y llevamos esa idea a nuestras sedes y a la línea Vital Week.'),
  mision = COALESCE(mision, 'Ofrecer comida saludable, fresca y deliciosa que se adapte al ritmo de vida de nuestros clientes.'),
  vision = COALESCE(vision, 'Ser la marca de alimentación saludable de referencia en el norte del Perú.'),
  email = COALESCE(email, 'hola@vitalfoods.pe')
WHERE id = 1;

INSERT INTO bloques (tipo, titulo, texto, icono, orden)
SELECT * FROM (VALUES
  ('valor', 'Frescura', 'Cocinamos todos los días con ingredientes frescos.', 'leaf', 1),
  ('valor', 'Nutrición', 'Porciones balanceadas y con su información nutricional.', 'heart', 2),
  ('valor', 'Cercanía', 'Escuchamos a nuestros clientes y mejoramos con ellos.', 'users', 3),
  ('valor', 'Sabor', 'Comer saludable también puede ser delicioso.', 'sparkles', 4),
  ('garantia', 'Información nutricional', 'Calorías, proteínas, carbohidratos y grasas de cada plato.', 'chart', 1),
  ('garantia', 'Preparado el mismo día', 'Nuestros platos se cocinan cada mañana.', 'clock-check', 2),
  ('garantia', 'Cadena de frío', 'Vital Week se conserva refrigerado de la cocina a tu mesa.', 'snow', 3),
  ('garantia', 'Alérgenos indicados', 'Cada plato detalla sus ingredientes y alérgenos.', 'shield', 4),
  ('garantia', 'A tu medida', 'Elige proteína, base y extras según tu objetivo.', 'target', 5),
  ('garantia', 'Ingredientes locales', 'Trabajamos con productos de La Libertad siempre que podemos.', 'sprout', 6)
) AS v (tipo, titulo, texto, icono, orden)
WHERE NOT EXISTS (SELECT 1 FROM bloques);

-- Opciones de partida para personalizar platos (valores referenciales que el equipo ajusta en el panel).
INSERT INTO opciones (grupo, nombre, detalle, precio_extra, proteinas, carbohidratos, grasas, fibra, factor, orden)
SELECT * FROM (VALUES
  ('tamano', 'Regular', 'Porción normal', 0, 0, 0, 0, 0, 1.0, 1),
  ('tamano', 'Grande', '30 % más', 5, 0, 0, 0, 0, 1.3, 2),
  ('proteina', 'Pollo grillado', NULL, 0, 0, 0, 0, 0, 1.0, 1),
  ('proteina', 'Res magra', NULL, 3, 4, 0, 5, 0, 1.0, 2),
  ('proteina', 'Tofu', NULL, 0, -14, 3, 2, 1, 1.0, 3),
  ('base', 'Quinua', NULL, 0, 0, 0, 0, 0, 1.0, 1),
  ('base', 'Arroz integral', NULL, 0, -2, 10, 0, -1, 1.0, 2),
  ('base', 'Mix de hojas', NULL, 0, -5, -28, -2, 1, 1.0, 3),
  ('extra', 'Palta', NULL, 3, 1, 4, 11, 4, 1.0, 1),
  ('extra', 'Huevo', NULL, 2.5, 6, 0, 5, 0, 1.0, 2),
  ('extra', 'Porción extra de proteína', NULL, 6, 20, 0, 3, 0, 1.0, 3)
) AS v (grupo, nombre, detalle, precio_extra, proteinas, carbohidratos, grasas, fibra, factor, orden)
WHERE NOT EXISTS (SELECT 1 FROM opciones);
