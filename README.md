# Help Acopio

Plataforma para que los centros de acopio publiquen qué suministros necesitan y para que cualquier persona vea esos centros en un mapa.

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

cp server/.env.example server/.env
```

## Desarrollo

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3000/api

## Rutas de la app

| Ruta | Descripción |
|------|-------------|
| `/mapa` | Mapa público con todos los centros de acopio. Al hacer clic en un marcador se muestran los suministros que necesita. |
| `/panel` | Login y registro para centros de acopio. Permite marcar ubicación en el mapa y seleccionar suministros necesarios. |

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servidor |
| POST | `/api/auth/register` | Registrar centro de acopio |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Obtener centro autenticado |
| GET | `/api/centros` | Listar centros con ubicación (público) |
| GET | `/api/centros/supplies` | Listar suministros disponibles |
| PUT | `/api/centros/me` | Actualizar ubicación y suministros |

## Stack

- **Frontend:** React 19, TypeScript, Vite, React Router, Leaflet, react-leaflet
- **Backend:** Node.js, Express, Mongoose, JWT, bcrypt
- **Base de datos:** MongoDB
