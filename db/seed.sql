-- Datos iniciales. Solo inserta lo que no existe (por nombre o título).

INSERT INTO categorias (nombre, descripcion, orden) VALUES
  ('Desayunos', 'Opciones frescas para empezar el día', 1),
  ('Almuerzos', 'Platos completos y balanceados', 2),
  ('Bowls', 'Bowls con proteína, granos y vegetales frescos', 3),
  ('Ensaladas', 'Ensaladas frescas con aliños de la casa', 4),
  ('Snacks', 'Opciones ligeras para cualquier momento', 5),
  ('Bebidas', 'Jugos naturales, batidos y refrescos', 6),
  ('Postres', 'Postres artesanales para cerrar la comida', 7)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO platillos (categoria_id, nombre, descripcion, precio, imagen_url, orden)
SELECT c.id, v.nombre, v.descripcion, v.precio, v.imagen_url, v.orden
FROM (VALUES
  ('Bowls', 'Bowl Vital', 'Pollo grillado, quinua, palta, mix de hojas y vegetales frescos.', 24.90, '/images/platillos/bowl-vital.webp', 1),
  ('Desayunos', 'Tostadas tropicales', 'Tostadas integrales, frutas de estación, granola y palta cremosa.', 18.90, '/images/platillos/tostadas-tropicales.webp', 2),
  ('Ensaladas', 'Ensalada Mediterránea', 'Hojas verdes, tomate, pepino, granos y aliño cítrico de la casa.', 22.90, '/images/platillos/ensalada-mediterranea.webp', 3),
  ('Snacks', 'Yogurt & berries', 'Yogurt natural, frutos rojos, granola crocante y miel.', 14.90, '/images/platillos/yogurt-berries.webp', 4),
  ('Bebidas', 'Green power', 'Piña, espinaca, manzana y un toque fresco de limón.', 11.90, '/images/platillos/green-power.webp', 5),
  ('Almuerzos', 'Pollo garden', 'Pechuga grillada con vegetales, palta y cereales integrales.', 26.90, '/images/platillos/pollo-garden.webp', 6),
  ('Bebidas', 'Limonada de Hierbabuena', 'Limonada natural refrescante con un toque de hierbabuena.', 9.50, NULL, 7),
  ('Postres', 'Brownie con Helado', 'Brownie de chocolate tibio acompañado de helado de vainilla.', 14.90, NULL, 8)
) AS v (categoria, nombre, descripcion, precio, imagen_url, orden)
JOIN categorias c ON c.nombre = v.categoria
WHERE NOT EXISTS (SELECT 1 FROM platillos p WHERE p.nombre = v.nombre);

INSERT INTO sedes (nombre, direccion, horario, referencia, mapa_url, orden) VALUES
  ('Centro', 'Jr. Bolognesi 502, Centro', 'Lun – Sáb · 8:00 a.m. – 9:00 p.m.', 'A media cuadra de la Plaza de Armas', 'https://maps.google.com/?q=Jr.+Bolognesi+502+Trujillo', 1),
  ('La Merced', 'Díaz de Cienfuegos 287, La Merced', 'Lun – Sáb · 8:00 a.m. – 9:00 p.m.', 'Zona La Merced', 'https://maps.google.com/?q=Diaz+de+Cienfuegos+287+Trujillo', 2),
  ('UPAO', 'UPAO', 'Lun – Vie · 8:00 a.m. – 8:00 p.m.', 'Campus universitario', 'https://maps.google.com/?q=UPAO+Trujillo', 3),
  ('El Golf', 'Av. El Golf 152', 'Lun – Dom · 8:00 a.m. – 9:00 p.m.', 'Urbanización El Golf', 'https://maps.google.com/?q=Av.+El+Golf+152+Trujillo', 4),
  ('MIC', 'MIC', 'Lun – Sáb · 9:00 a.m. – 8:00 p.m.', 'Módulo Vital Foods', 'https://maps.google.com/?q=MIC+Trujillo', 5)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO promociones (etiqueta, titulo, descripcion, descripcion_secundaria, sticker, texto_boton, imagen_url, variante, caracteristicas, orden)
SELECT * FROM (VALUES
  ('Nuevo', 'VITAL WEEK', 'Tu alimentación saludable, lista cuando la necesitas.',
   'Comidas saludables preparadas y refrigeradas para ayudarte a organizar mejor tu alimentación.',
   'NUEVO', 'Conoce Vital Week', '/images/promociones/vital-week.webp', 'launch',
   ARRAY['Preparado', 'Refrigerado', 'Listo para calentar'], 1),
  ('Vital Week', 'Menos tiempo en la cocina. Más tiempo para ti.',
   'Ten tus comidas preparadas y refrigeradas para disfrutarlas cuando las necesites.',
   NULL, NULL, 'Descubre cómo funciona', '/images/promociones/vital-week-practicidad.webp', 'practicality',
   ARRAY['Guarda', 'Calienta', 'Disfruta'], 2),
  ('Tu rutina, más fácil', 'Organiza tus comidas con Vital Week',
   'Una alternativa práctica para quienes estudian, trabajan o entrenan y quieren mantener una alimentación saludable.',
   NULL, NULL, 'Descubre Vital Week', '/images/promociones/vital-week-organizacion.webp', 'organization',
   ARRAY['Saludable', 'Práctico', 'Refrigerado', 'Delivery'], 3)
) AS v (etiqueta, titulo, descripcion, descripcion_secundaria, sticker, texto_boton, imagen_url, variante, caracteristicas, orden)
WHERE NOT EXISTS (SELECT 1 FROM promociones p WHERE p.titulo = v.titulo);

-- Destacados iniciales de la portada (solo si todavía no hay ninguno)
UPDATE platillos SET destacado = TRUE
WHERE nombre IN ('Bowl Vital', 'Tostadas tropicales', 'Ensalada Mediterránea')
  AND NOT EXISTS (SELECT 1 FROM platillos WHERE destacado);

-- Textos iniciales de la empresa (se editan en el panel). Las cifras quedan vacías a propósito:
-- solo se muestran en la web cuando la empresa ingresa datos reales.
UPDATE empresa SET
  intro_titulo = COALESCE(intro_titulo, 'Cocinamos lo que nos gustaría comer cada día'),
  intro_texto = COALESCE(intro_texto, 'Preparamos comida saludable, fresca y deliciosa en Trujillo para personas con poco tiempo y muchas ganas de cuidarse.'),
  historia_titulo = COALESCE(historia_titulo, 'Comer sano también puede ser delicioso'),
  historia_texto = COALESCE(historia_texto, 'En Vital Foods creemos que comer saludable también puede ser delicioso. Preparamos opciones frescas y nutritivas para acompañar el día a día de quienes buscan cuidar su alimentación sin dejar de disfrutar.'),
  mision = COALESCE(mision, 'Ofrecer comida saludable, fresca y deliciosa que se adapte al ritmo de vida de nuestros clientes.'),
  vision = COALESCE(vision, 'Ser la marca de alimentación saludable de referencia en el norte del Perú.'),
  email = COALESCE(email, 'hola@vitalfoods.pe')
WHERE id = 1;

INSERT INTO bloques (tipo, titulo, texto, icono, orden)
SELECT * FROM (VALUES
  ('valor', 'Frescura', 'Preparamos nuestros platos con ingredientes frescos.', 'leaf', 1),
  ('valor', 'Nutrición', 'Porciones balanceadas para comer bien.', 'heart', 2),
  ('valor', 'Cercanía', 'Escuchamos a nuestros clientes y mejoramos con ellos.', 'users', 3),
  ('valor', 'Sabor', 'Comer saludable también puede ser delicioso.', 'sparkles', 4)
) AS v (tipo, titulo, texto, icono, orden)
WHERE NOT EXISTS (SELECT 1 FROM bloques);

-- Opciones de partida para personalizar platos (valores referenciales que el equipo ajusta en el panel).
-- No se muestran hasta marcar un plato como personalizable.
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
