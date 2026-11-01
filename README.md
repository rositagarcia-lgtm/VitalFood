# Vital Foods

Sitio web de Vital Foods (Trujillo) con panel de administración. Todo lo que se ve en la web (menú, precios, calorías, banners, sedes, contacto y la página Nosotros) se edita desde el panel.

## Tecnologías

- TanStack Start (React 19, SSR y server functions)
- Tailwind CSS 4 y componentes Radix UI
- PostgreSQL en Neon
- Cloudinary para las imágenes que se suben desde el panel

## Requisitos

- Node.js 22.12 o superior
- Una base de datos PostgreSQL (Neon)
- Una cuenta de Cloudinary (opcional para desarrollo)

## Puesta en marcha

1. Instalar dependencias:

   ```sh
   npm ci
   ```

2. Copiar `.env.example` a `.env` y completar los valores.

3. Crear o actualizar las tablas y cargar los datos iniciales:

   ```sh
   npm run db:migrate
   npm run db:seed
   ```

4. Crear el primer administrador con `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`:

   ```sh
   npm run db:admin
   ```

5. Levantar el entorno de desarrollo:

   ```sh
   npm run dev
   ```

   - Sitio: `http://localhost:5173`
   - Panel: `http://localhost:5173/admin`

## Scripts

| Comando              | Descripción                                            |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Servidor de desarrollo                                 |
| `npm run build`      | Compila para producción en `.output/`                  |
| `npm start`          | Ejecuta la compilación de producción                   |
| `npm run lint`       | ESLint                                                 |
| `npm run typecheck`  | Verificación de tipos                                  |
| `npm run format`     | Formatea el código con Prettier                        |
| `npm run db:migrate` | Aplica `db/schema.sql` (idempotente, no borra datos)   |
| `npm run db:seed`    | Inserta los datos iniciales que falten (`db/seed.sql`) |
| `npm run db:admin`   | Crea el administrador o recupera su acceso             |

## Estructura

```
db/                 Esquema y datos iniciales de PostgreSQL
scripts/db.mjs      Migración, seed y alta de administrador
public/images/      Imágenes iniciales optimizadas (WebP)
src/routes/_site/   Páginas públicas: inicio, menú, detalle del plato y Nosotros
src/routes/admin/   Panel de administración
src/functions/      Server functions (públicas y del panel)
src/server/         Código que solo corre en el servidor: BD, sesión, Cloudinary
src/components/     Componentes del sitio (site/), del panel (admin/) y base (ui/)
src/lib/nutrition.ts Cálculo de calorías y de la personalización de platos
src/site.css        Estilos del sitio público (un solo diseño para todas las páginas)
```

## Sitio público

- `/`: portada con banners (pasan solos y se eligen con los puntos), cifras de la empresa, platillos destacados, presentación y sedes con mapa.
- `/menu`: menú con buscador, categorías, filtros (objetivo, calorías, precio, dieta, ofertas, personalizable) y orden. Cada categoría tiene su propia dirección, por ejemplo `/menu?categoria=Bowls`.
- `/menu/<plato>`: detalle con galería de fotos, valores nutricionales, ingredientes, alérgenos, conservación, platos relacionados y pedido por WhatsApp con el resumen del pedido.
- `/nosotros`: historia, misión, visión, valores, hitos, garantías, opiniones y redes.
- Las secciones sin datos no se muestran (por ejemplo, una cifra vacía o un plato sin nutrición).
- En celulares hay una barra de navegación inferior, como en una app.
- Las ofertas muestran el precio normal tachado y el porcentaje de descuento.

## Calorías y personalización

- En cada platillo se escriben los gramos de proteínas, carbohidratos y grasas por porción; las calorías se calculan solas con los factores de Atwater: **4 × proteínas + 4 × carbohidratos + 9 × grasas**. Si existe una ficha técnica con otra cifra, se puede escribir a mano.
- Los platos marcados como personalizables muestran opciones de tamaño, proteína, base y extras (sección _Opciones para personalizar_). Cada opción indica cuánto cambia frente a la receta original; los tamaños multiplican la porción. El precio y las calorías se recalculan al elegir.
- Los botones "¿Qué priorizas?" (más proteína, menos carbohidratos, más ligero, más energía) eligen automáticamente las opciones que mejor cumplen ese objetivo.

## Panel y seguridad

- **Verificación en dos pasos obligatoria**: después de la contraseña se pide un código de 6 dígitos de Google Authenticator, Microsoft Authenticator u otra app compatible. La primera vez se vincula escaneando un código QR.
- **Bloqueo temporal**: 5 intentos fallidos bloquean la cuenta 15 minutos. Un administrador puede desbloquearla desde _Usuarios y permisos_.
- **Correos autorizados**: solo se pueden crear cuentas con los dominios de `ADMIN_EMAIL_DOMAINS` (por defecto gmail.com y vitalfoods.pe).
- **Contraseñas** de mínimo 10 caracteres, guardadas con bcrypt. El secreto de la verificación en dos pasos se guarda cifrado con una clave derivada de `SESSION_SECRET`; si se cambia esa variable, hay que restablecer la verificación de cada usuario.
- **Permisos por sección**: los administradores acceden a todo; a cada editor se le eligen las secciones que puede modificar (platillos, categorías, sedes, banners, empresa y Nosotros).
- **Historial de cambios**: registra quién creó, modificó o eliminó algo y cuándo. La campana del panel muestra pendientes y cambios recientes.

### Recuperar el acceso de administrador

Si se pierde el celular o la cuenta queda bloqueada, define `ADMIN_EMAIL` y una nueva `ADMIN_PASSWORD` en `.env` y ejecuta `npm run db:admin`. Esto cambia la contraseña, desbloquea la cuenta y pide vincular de nuevo la app de autenticación en el siguiente ingreso.

## Caché

En producción, las páginas y los datos siempre se revalidan, para que nadie vea precios desactualizados. Las imágenes locales se guardan 7 días en el navegador y los archivos con hash, un año. Las imágenes de Cloudinary se sirven desde su CDN en formato y tamaño automáticos (`f_auto`, `q_auto`, `srcset`). Las reglas están en `vite.config.ts` (`routeRules`).

## Imágenes

Las imágenes que se suben desde el panel van directo del navegador a Cloudinary con una firma generada en el servidor, así que la clave secreta nunca llega al cliente. Al reemplazar o eliminar un registro, su imagen anterior también se borra de Cloudinary. Mientras Cloudinary no esté configurado, el panel permite pegar la URL de la imagen.

## Despliegue

`npm run build` genera un servidor Node en `.output/` que se ejecuta con `npm start`. Hay que definir las mismas variables de `.env` en el entorno de producción.
