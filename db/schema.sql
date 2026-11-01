-- Esquema de Vital Foods (PostgreSQL / Neon).
-- Es idempotente: solo crea o agrega lo que falta, nunca borra datos.

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- categorias ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categorias (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(50) NOT NULL UNIQUE,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE categorias ADD COLUMN IF NOT EXISTS descripcion VARCHAR(150);
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 0;
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
UPDATE categorias SET activo = TRUE WHERE activo IS NULL;
ALTER TABLE categorias ALTER COLUMN activo SET NOT NULL;
ALTER TABLE categorias ALTER COLUMN created_at SET NOT NULL;

-- platillos -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platillos (
  id            SERIAL PRIMARY KEY,
  categoria_id  INTEGER NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  descripcion   TEXT,
  precio        NUMERIC(10, 2) NOT NULL,
  imagen_url    VARCHAR(500),
  disponible    BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_categoria FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE RESTRICT
);

ALTER TABLE platillos ADD COLUMN IF NOT EXISTS imagen_public_id VARCHAR(255);
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 0;
ALTER TABLE platillos ALTER COLUMN precio TYPE NUMERIC(10, 2);
ALTER TABLE platillos ALTER COLUMN imagen_url TYPE VARCHAR(500);
UPDATE platillos SET disponible = TRUE WHERE disponible IS NULL;
ALTER TABLE platillos ALTER COLUMN disponible SET NOT NULL;
ALTER TABLE platillos ALTER COLUMN created_at SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platillos_precio_positivo') THEN
    ALTER TABLE platillos ADD CONSTRAINT platillos_precio_positivo CHECK (precio >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_platillos_categoria ON platillos (categoria_id);
CREATE INDEX IF NOT EXISTS idx_platillos_disponible ON platillos (disponible);

-- usuarios --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  rol            VARCHAR(20) DEFAULT 'admin',
  ultimo_acceso  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE usuarios SET rol = 'admin' WHERE rol IS NULL;
ALTER TABLE usuarios ALTER COLUMN rol SET NOT NULL;
ALTER TABLE usuarios ALTER COLUMN created_at SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_rol_valido') THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_valido CHECK (rol IN ('admin', 'editor'));
  END IF;
END $$;

-- sedes -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sedes (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(80) NOT NULL UNIQUE,
  direccion   VARCHAR(200) NOT NULL,
  horario     VARCHAR(120) NOT NULL,
  referencia  VARCHAR(200),
  mapa_url    VARCHAR(500),
  orden       INTEGER NOT NULL DEFAULT 0,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- promociones (carrusel principal) --------------------------------------

CREATE TABLE IF NOT EXISTS promociones (
  id                      SERIAL PRIMARY KEY,
  etiqueta                VARCHAR(60) NOT NULL,
  titulo                  VARCHAR(120) NOT NULL,
  descripcion             VARCHAR(300) NOT NULL,
  descripcion_secundaria  VARCHAR(300),
  sticker                 VARCHAR(20),
  texto_boton             VARCHAR(60) NOT NULL,
  enlace_boton            VARCHAR(300) NOT NULL DEFAULT '#platillos',
  imagen_url              VARCHAR(500),
  imagen_public_id        VARCHAR(255),
  variante                VARCHAR(20) NOT NULL DEFAULT 'launch',
  caracteristicas         TEXT[] NOT NULL DEFAULT '{}',
  orden                   INTEGER NOT NULL DEFAULT 0,
  activo                  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT promociones_variante_valida CHECK (variante IN ('launch', 'practicality', 'organization'))
);

-- ofertas y destacados ----------------------------------------------------

ALTER TABLE platillos ADD COLUMN IF NOT EXISTS precio_oferta NUMERIC(10, 2);
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS destacado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS precio_actualizado_at TIMESTAMPTZ;
-- Los platillos existentes no deben aparecer como "precio actualizado"
UPDATE platillos SET precio_actualizado_at = created_at WHERE precio_actualizado_at IS NULL;
ALTER TABLE platillos ALTER COLUMN precio_actualizado_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE platillos ALTER COLUMN precio_actualizado_at SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platillos_oferta_valida') THEN
    ALTER TABLE platillos ADD CONSTRAINT platillos_oferta_valida
      CHECK (precio_oferta IS NULL OR (precio_oferta >= 0 AND precio_oferta < precio));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION set_precio_actualizado_at() RETURNS trigger AS $$
BEGIN
  IF NEW.precio IS DISTINCT FROM OLD.precio OR NEW.precio_oferta IS DISTINCT FROM OLD.precio_oferta THEN
    NEW.precio_actualizado_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_platillos_precio ON platillos;
CREATE TRIGGER trg_platillos_precio BEFORE UPDATE ON platillos
  FOR EACH ROW EXECUTE FUNCTION set_precio_actualizado_at();

-- seguridad de usuarios: permisos por módulo, 2FA y bloqueo por intentos ----

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permisos TEXT[] NOT NULL
  DEFAULT ARRAY['platillos', 'categorias', 'sedes', 'promociones'];
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS totp_secreto TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS totp_activo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS totp_ultimo_paso BIGINT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ;

-- historial de cambios del panel --------------------------------------------

CREATE TABLE IF NOT EXISTS actividad (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  INTEGER REFERENCES usuarios (id) ON DELETE SET NULL,
  usuario     VARCHAR(100) NOT NULL,
  accion      VARCHAR(30) NOT NULL,
  modulo      VARCHAR(30) NOT NULL,
  detalle     VARCHAR(300) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_actividad_fecha ON actividad (created_at DESC);

-- triggers de updated_at ------------------------------------------------

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['categorias', 'platillos', 'sedes', 'promociones'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- el menú ahora es una página propia (/menu) --------------------------------

ALTER TABLE promociones ALTER COLUMN enlace_boton SET DEFAULT '/menu';
UPDATE promociones SET enlace_boton = '/menu' WHERE enlace_boton = '#platillos';

-- información de la empresa (una sola fila, editable desde el panel) -------

CREATE TABLE IF NOT EXISTS empresa (
  id                   INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nombre               VARCHAR(80) NOT NULL DEFAULT 'Vital Foods',
  eslogan              VARCHAR(200) NOT NULL DEFAULT 'Comida fresca, nutritiva y deliciosa para acompañar cada momento de tu día.',
  ciudad               VARCHAR(80) NOT NULL DEFAULT 'Trujillo',
  anio_fundacion       INTEGER CHECK (anio_fundacion IS NULL OR anio_fundacion BETWEEN 1950 AND 2100),
  clientes_mes         INTEGER CHECK (clientes_mes IS NULL OR clientes_mes >= 0),
  equipo               INTEGER CHECK (equipo IS NULL OR equipo >= 0),
  intro_titulo         VARCHAR(160),
  intro_texto          VARCHAR(500),
  historia_titulo      VARCHAR(160),
  historia_texto       TEXT,
  mision               VARCHAR(400),
  vision               VARCHAR(400),
  imagen_url           VARCHAR(500),
  imagen_public_id     VARCHAR(255),
  whatsapp             VARCHAR(20),
  telefono             VARCHAR(30),
  email                VARCHAR(150),
  horario              VARCHAR(160),
  instagram            VARCHAR(300),
  facebook             VARCHAR(300),
  tiktok               VARCHAR(300),
  resenas_url          VARCHAR(300),
  reclamaciones_url    VARCHAR(300),
  updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO empresa (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- bloques de la página Nosotros: valores, garantías, hitos y opiniones --------

CREATE TABLE IF NOT EXISTS bloques (
  id          SERIAL PRIMARY KEY,
  tipo        VARCHAR(20) NOT NULL CHECK (tipo IN ('valor', 'garantia', 'hito', 'opinion')),
  titulo      VARCHAR(120) NOT NULL,
  texto       VARCHAR(500) NOT NULL,
  icono       VARCHAR(40) NOT NULL DEFAULT 'leaf',
  anio        INTEGER,
  autor       VARCHAR(80),
  detalle     VARCHAR(120),
  estrellas   INTEGER CHECK (estrellas IS NULL OR estrellas BETWEEN 1 AND 5),
  orden       INTEGER NOT NULL DEFAULT 0,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- detalle y nutrición de cada platillo --------------------------------------

ALTER TABLE platillos ADD COLUMN IF NOT EXISTS slug VARCHAR(120);
UPDATE platillos SET slug = trim(both '-' from regexp_replace(
  lower(translate(nombre, 'ÁÉÍÓÚÜÑáéíóúüñ&', 'AEIOUUNaeiouuny')), '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platillos_slug_key') THEN
    ALTER TABLE platillos ADD CONSTRAINT platillos_slug_key UNIQUE (slug);
  END IF;
END $$;
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS porcion_g INTEGER CHECK (porcion_g IS NULL OR porcion_g > 0);
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS proteinas NUMERIC(6, 1) CHECK (proteinas IS NULL OR proteinas >= 0);
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS carbohidratos NUMERIC(6, 1) CHECK (carbohidratos IS NULL OR carbohidratos >= 0);
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS grasas NUMERIC(6, 1) CHECK (grasas IS NULL OR grasas >= 0);
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS fibra NUMERIC(6, 1) CHECK (fibra IS NULL OR fibra >= 0);
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS kcal_manual INTEGER CHECK (kcal_manual IS NULL OR kcal_manual >= 0);
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS etiquetas TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS objetivos TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS ingredientes TEXT;
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS alergenos VARCHAR(300);
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS conservacion VARCHAR(300);
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS personalizable BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE platillos ADD COLUMN IF NOT EXISTS galeria JSONB NOT NULL DEFAULT '[]';

-- opciones para personalizar platillos (tamaño, proteína, base y extras) ------

CREATE TABLE IF NOT EXISTS opciones (
  id             SERIAL PRIMARY KEY,
  grupo          VARCHAR(20) NOT NULL CHECK (grupo IN ('tamano', 'proteina', 'base', 'extra')),
  nombre         VARCHAR(80) NOT NULL,
  detalle        VARCHAR(80),
  precio_extra   NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (precio_extra >= 0),
  proteinas      NUMERIC(6, 1) NOT NULL DEFAULT 0,
  carbohidratos  NUMERIC(6, 1) NOT NULL DEFAULT 0,
  grasas         NUMERIC(6, 1) NOT NULL DEFAULT 0,
  fibra          NUMERIC(6, 1) NOT NULL DEFAULT 0,
  factor         NUMERIC(4, 2) NOT NULL DEFAULT 1 CHECK (factor > 0 AND factor <= 3),
  orden          INTEGER NOT NULL DEFAULT 0,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- el módulo "empresa" se agrega a los permisos asignables
ALTER TABLE usuarios ALTER COLUMN permisos SET DEFAULT ARRAY['platillos', 'categorias', 'sedes', 'promociones'];

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['empresa', 'bloques', 'opciones'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END $$;
