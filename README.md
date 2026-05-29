# PCD-graficas-2026

Visualizador generativo para crear piezas gráficas del **Processing Community Day 2026**. El proyecto funciona como una herramienta web interactiva para componer, animar y exportar material visual de convocatoria en formatos listos para redes sociales y banners.

## Para qué sirve

Este proyecto permite generar gráficas dinámicas para PCD 2026 usando código creativo. Desde una interfaz en el navegador se pueden ajustar formatos, slides, colores, grillas, animaciones y textos editoriales, y luego exportar el resultado como imagen o video.

La herramienta incluye:

- Formato Instagram vertical `1080 x 1350`.
- Formato banner horizontal `1600 x 400`.
- Slides predefinidos para distintas comunicaciones del evento.
- Paletas de color con validación de contraste WCAG AA.
- Animaciones generativas basadas en texto, partículas, campos de flujo, glitch, pixeles y tipografía.
- Controles de reproducción, reinicio, guías visuales y randomización.
- Exportación de frame actual en `PNG`.
- Exportación de video de 10 segundos usando `MediaRecorder`.
- Assets institucionales y tipografías locales incluidos en la carpeta `assets/`.

## Con qué se hizo

El proyecto está construido como una aplicación web estática, sin framework ni proceso de build.

Tecnologías principales:

- **HTML5** para la estructura de la interfaz.
- **CSS3** para layout, paneles, controles y apariencia visual.
- **JavaScript vanilla** para estado, interacción, renderizado y exportación.
- **p5.js 1.9.0** para el canvas y las animaciones generativas.
- **Canvas API** y **MediaRecorder API** del navegador para exportar imagen y video.

Archivos principales:

```text
.
├── index.html              # Interfaz principal y carga de dependencias
├── style.css               # Estilos de la aplicación
├── app.js                  # Estado global, render, controles, slides y exportación
├── animations.js           # Animaciones generativas principales
├── animations-slide4.js    # Animaciones especiales para slides hero/deadline
├── presets.js              # Presets de color adicionales
└── assets/                 # Logos y tipografías locales
```

## Cómo funciona

Al abrir `index.html`, la página carga p5.js desde CDN y monta un canvas dentro de `#canvas-container`. El estado visual de la pieza vive principalmente en `app.js`, donde se definen formatos, slides, paletas, layout, tipografía, contenido fijo, controles de interfaz y funciones de exportación.

Las animaciones se separan en módulos:

- `animations.js` contiene animaciones reutilizables como física de letras, redes de partículas, campos de flujo, distorsión de grilla, lluvia de código y texturas tipográficas.
- `animations-slide4.js` contiene animaciones de mayor impacto visual, como glitch y explosiones de pixeles, usadas en slides hero o piezas de cierre/extensión.

La interfaz permite modificar parámetros en tiempo real. Cada cambio actualiza el estado global y vuelve a renderizar el canvas. Cuando se exporta una imagen, se descarga el frame actual del canvas. Cuando se exporta video, se captura el stream del canvas durante 10 segundos.

## Cómo ejecutarlo localmente

No requiere instalación de dependencias. Solo necesitas un navegador moderno.

Opción rápida:

1. Clona o descarga este repositorio.
2. Abre `index.html` en tu navegador.

Opción recomendada, usando un servidor local:

```bash
python3 -m http.server 8000
```

Luego abre:

```text
http://localhost:8000
```

Usar servidor local evita restricciones del navegador al cargar assets, fuentes o APIs relacionadas con canvas.

## Cómo usarlo

1. Selecciona el formato de salida: Instagram o banner.
2. Elige el slide del poster o la pieza que quieras generar.
3. Ajusta colores, grilla, animación y parámetros visuales desde el panel lateral.
4. Usa `Play/Pause`, `Reset` y `Guides` para revisar la composición.
5. Exporta el resultado con:
   - `PNG` para descargar el frame actual.
   - `MP4 10s` / `Video - 10 segundos` para descargar una captura animada.

> Nota: el formato real del video puede depender del soporte del navegador para `MediaRecorder`. Navegadores basados en Chromium suelen ofrecer mejor compatibilidad.

## Cómo replicarlo o adaptarlo

Para crear una versión propia del visualizador:

1. Haz fork del repositorio.
2. Cambia los textos base en `app.js`, especialmente constantes como `TITLE_LINES`, `INFO_LINES`, `SLIDE4_TITLE` y los bloques de contenido de cada slide.
3. Reemplaza logos y tipografías dentro de `assets/`.
4. Ajusta paletas en `COLOR_PRESETS` o `WCAG_PALETTES_DEF`.
5. Modifica formatos en las constantes `IG_W`, `IG_H`, `BANNER_W` y `BANNER_H`.
6. Agrega o edita animaciones en `animations.js` o `animations-slide4.js`.
7. Actualiza la interfaz en `index.html` si agregas nuevos controles.
8. Ajusta estilos en `style.css` para adaptar la identidad visual.

El proyecto está pensado para ser fácil de bifurcar: todo vive en archivos estáticos, sin empaquetadores, dependencias instaladas ni configuración de servidor.

## Cómo publicar una copia

Como es un sitio estático, se puede publicar en servicios como:

- GitHub Pages.
- Netlify.
- Vercel.
- Cloudflare Pages.
- Cualquier hosting que sirva archivos HTML, CSS, JS y assets.

Para GitHub Pages:

1. Sube el repositorio a GitHub.
2. Entra a `Settings > Pages`.
3. Selecciona la rama principal y la carpeta raíz.
4. Guarda la configuración.
5. Abre la URL publicada cuando GitHub termine el despliegue.

## Requisitos del navegador

Recomendado:

- Navegador moderno con soporte para Canvas.
- Conexión a internet para cargar p5.js desde CDN y fuentes externas de Google Fonts.
- Soporte de `MediaRecorder` para exportación de video.

Si quieres que el proyecto funcione completamente offline, descarga p5.js y las fuentes externas, guárdalas localmente y actualiza las referencias en `index.html`.

## Licencia y uso

Este repositorio contiene material gráfico, logos y tipografías asociados al proyecto PCD 2026. Antes de reutilizarlo públicamente para otro evento o marca, revisa los permisos correspondientes de identidad, fuentes y assets incluidos.

Para una bifurcación técnica, conserva la atribución del proyecto original y documenta los cambios realizados.
