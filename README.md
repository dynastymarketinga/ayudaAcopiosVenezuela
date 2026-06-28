# Help Acopio

Plataforma para que los centros de acopio publiquen qué suministros necesitan y para que cualquier persona vea esos centros en un mapa.

**Producción:** [ayuda-acopios-venezuela.vercel.app](https://ayuda-acopios-venezuela.vercel.app)

## Estructura

```
helpAcopio/
├── client/          # Frontend React + Vite + TypeScript + Leaflet
├── server/          # Backend Node.js + Express + MongoDB
└── package.json     # Scripts para ejecutar ambos
```

## Requisitos

- [Node.js](https://nodejs.org/) 20+
- [MongoDB](https://www.mongodb.com/) corriendo localmente o MongoDB Atlas

## Instalación

```bash
npm install
npm install --prefix client
npm install --prefix server
```

Crea el archivo `server/.env` con las variables necesarias (ver abajo).

## Variables de entorno

Archivo `server/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/helpAcopio
JWT_SECRET=tu-secreto-jwt
PANEL_EMAIL=admin@ejemplo.com
PANEL_PASSWORD=tu-contraseña-admin
PORT=3000
```

| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | Conexión a MongoDB |
| `JWT_SECRET` | Secreto para tokens de centros autenticados |
| `PANEL_EMAIL` | Email del administrador (panel en `/panel`) |
| `PANEL_PASSWORD` | Contraseña del administrador |
| `PORT` | Puerto del servidor (opcional, default `3000`) |

## Desarrollo

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3000/api

## Rutas de la app

| Ruta | Descripción |
|------|-------------|
| `/mapa` | Mapa público con centros de acopio y hospitales de Venezuela (OpenStreetMap). Filtros por tipo de lugar y por estado. Al hacer clic en un marcador se muestran suministros, contacto, fotos y enlace a Google Maps. |
| `/crear` | Formulario público para registrar un centro de acopio: ubicación en mapa, búsqueda de dirección, suministros necesarios, contacto e imágenes (hasta 10). |
| `/panel` | Panel de administración (acceso directo por URL, sin enlace en el menú). Permite listar y eliminar centros registrados. |

El menú principal muestra **Mapa** y **Crear centro de acopio**.

## API

### General

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servidor |
| GET | `/api/geocode` | Búsqueda de direcciones |
| GET | `/api/hospitals` | Hospitales en Venezuela (OpenStreetMap, con caché) |

### Centros

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/centros` | Listar centros con ubicación. Query opcional: `?tipo=` |
| GET | `/api/centros/supplies` | Catálogo de suministros disponibles |
| GET | `/api/centros/place-types` | Tipos de lugar disponibles |
| POST | `/api/centros` | Crear centro (público, sin autenticación) |
| POST | `/api/centros/:id/imagenes` | Subir imágenes al crear un centro |
| PUT | `/api/centros/me` | Actualizar centro autenticado |
| POST | `/api/centros/me/imagenes` | Subir imágenes (autenticado) |
| PUT | `/api/centros/me/imagen-principal` | Establecer imagen principal |
| DELETE | `/api/centros/me/imagenes` | Eliminar una imagen |

### Autenticación de centros

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar centro con cuenta |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Obtener centro autenticado |

### Administración

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/admin/login` | Login del panel de administración |
| GET | `/api/admin/centros` | Listar todos los centros (requiere token admin) |
| DELETE | `/api/admin/centros/:id` | Eliminar un centro y sus imágenes |

## Despliegue

- **Frontend:** Vercel (`vercel.json` en la raíz). Variable `VITE_API_URL` apunta a la API en producción.
- **API:** Render — `https://ayudaacopiosvenezuela.onrender.com`

## Stack

- **Frontend:** React 19, TypeScript, Vite, React Router, Leaflet, react-leaflet
- **Backend:** Node.js, Express, Mongoose, JWT, bcrypt, Multer
- **Base de datos:** MongoDB
