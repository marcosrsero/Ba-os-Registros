# Baños Registros

Aplicación web sencilla para registrar las salidas y regresos de alumnos al baño durante el día.

## Funciones

- Inicio de sesión como profesor con perfiles guardados.
- Botón para iniciar sesión como administrador.
- Usuario administrador inicial: `marcos`.
- Contraseña administradora inicial: `marcos2011@`.
- Registro automático de fecha y hora al crear una salida.
- Botón para marcar que el alumno ha vuelto.
- Panel administrador para añadir y borrar profesores.
- Panel administrador con todos los detalles de los registros y descarga JSON.
- Persistencia local con `localStorage`, pensada para sustituirse más adelante por una base de datos compartida.

## Desarrollo local

La aplicación no necesita dependencias para funcionar. Puedes abrir `index.html` directamente o usar cualquier servidor estático.

```bash
npm run dev
```

## Build para Vercel

```bash
npm run build
```

El comando genera la carpeta `dist`.

## Deploy en Vercel

1. Sube este repositorio a GitHub.
2. En Vercel, importa el repositorio.
3. Usa estos valores si Vercel los pide:
   - Framework preset: `Other`.
   - Build command: `npm run build`.
   - Output directory: `dist`.
