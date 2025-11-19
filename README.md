# Sushi Score

Aplicación web para organizar batallas de sushi libre. Permite crear una sala, invitar participantes mediante un código y que cada persona lleve su propio conteo de piezas en tiempo real desde su dispositivo. Cuando todos finalizan, se muestra un ranking con los resultados y se puede guardar la sesión en el historial local.

## Características

- Creación y unión a salas mediante un identificador aleatorio.
- Identidad persistente por dispositivo usando `localStorage`.
- Contador individual con gestos táctiles o clics.
- Sincronización local entre participantes de la misma sala.
- Ranking final con guardado del resultado en el historial.
- Interfaz pensada para móviles y pantallas táctiles.

## Tecnologías

- Next.js 16 (App Router) y React 19.
- Tailwind CSS y componentes Radix UI.
- Persistencia híbrida: `localStorage` para historial personal y MongoDB para compartir salas en tiempo real entre dispositivos.
- PNPM como gestor de paquetes.

## Requisitos

- Node.js 20+
- PNPM 9+

## Configuración local

1. Crea un archivo `.env.local` en la raíz con:

```
MONGODB_URI=<cadena de conexión con usuario y contraseña>
MONGODB_DB=sushilibre
```

2. Instala dependencias y arranca el entorno:

```bash
pnpm install
pnpm dev
```

La aplicación quedará disponible en `http://localhost:3000`.

## Despliegue

El proyecto está listo para desplegarse en Vercel. Una vez que tengas la URL pública, reemplaza la línea siguiente con el enlace final:

```
URL en producción: https://tu-dominio.vercel.app
```

## Scripts útiles

- `pnpm dev`: modo desarrollo con recarga en caliente.
- `pnpm build`: compila la versión de producción.
- `pnpm start`: ejecuta la build ya compilada.
- `pnpm lint`: corre el linter.

## Estructura principal

- `app/`: rutas y páginas del App Router.
- `components/`: componentes reutilizables de UI.
- `hooks/`: hooks personalizados.
- `lib/`: utilidades y lógica para salas/almacenamiento.
- `public/`: assets estáticos.

## Próximos pasos sugeridos

- Habilitar WebSockets o un servicio tipo Ably/Pusher para actualizar los contadores instantáneamente sin polling.
- Añadir autenticación para respaldar el historial en la nube.


