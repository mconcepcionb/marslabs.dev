---
version: alpha
name: Mars Labs
description: >-
  Ingeniería visible. Negro profundo y Marte naranja, acento cian de misión,
  tipografía Space Grotesk + Inter con toques mono. NASA-punk sutil: técnico
  sin cosplay de startup.
colors:
  background: "#06080C"
  foreground: "#E8EBEE"
  card: "#0B0E13"
  muted: "#14181F"
  muted-foreground: "#767F8C"
  border: "#232B33"
  primary: "#FF7A45"
  primary-foreground: "#14100D"
  accent: "#26D0F0"
  accent-foreground: "#061418"
  secondary: "#3A4149"
  secondary-foreground: "#E8EBEE"
  mars-deep: "#D8481F"
  mars-light: "#FFB98A"
  mars-crater: "#9C2E18"
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 3.25rem
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  h1:
    fontFamily: Space Grotesk
    fontSize: 2rem
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  h2:
    fontFamily: Space Grotesk
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  h3:
    fontFamily: Space Grotesk
    fontSize: 1.2rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  body:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.01em"
  body-em:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: "0.005em"
  tech-tag:
    fontFamily: JetBrains Mono
    fontSize: 0.72rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.22em"
  mission-badge:
    fontFamily: JetBrains Mono
    fontSize: 0.62rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
spacing:
  xs: 6px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body-em}"
    rounded: "{rounded.md}"
    padding: 12px 24px
  button-secondary:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-em}"
    rounded: "{rounded.md}"
    padding: 12px 24px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 24px
  mission-badge:
    backgroundColor: "{colors.background}"
    textColor: "{colors.accent}"
    typography: "{typography.mission-badge}"
    rounded: 9999px
    padding: 5px 10px
  tech-tag:
    backgroundColor: "{colors.background}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.tech-tag}"
  patch-mars:
    backgroundColor: "{colors.mars-deep}"
    textColor: "{colors.mars-light}"
    rounded: "{rounded.lg}"
    padding: 8px
  crater:
    backgroundColor: "{colors.mars-crater}"
    textColor: "{colors.mars-light}"
    rounded: 9999px
    padding: 4px
---

## Overview

Mars Labs es un laboratorio de desarrollo e infraestructura que **se mide,
no se promete**. La identidad visual traduce eso: fondo negro profundo
(`#06080C`), Marte en naranja como único color emocional, cian de misión como
acento técnico, y una tipografía que es ingenieril sin ser cosplay de startup.

El estilo es **NASA-punk sutil**: coordenadas, readouts mono, retículas y
corners de mira como micro-detalles — nunca tema completo. Nada de brillos de
neón ni degradados por todas partes.

## Colors

- **Background (`#06080C`)**: negro espacial, base de todo.
- **Primary — Marte (`#FF7A45`)**: el único "emocional". CTA principal,
  palabra clave del hero, marcador del planeta. Con variantes profundas
  (`#D8481F`), claras (`#FFB98A`) y de cráter (`#9C2E18`).
- **Accent — Cian de misión (`#26D0F0`)**: técnico. Corners, órbita, badges,
  cursores, enlaces hover, retícula.
- **Neutrales**: surfaces `#0B0E13`/`#14181F`, texto `#E8EBEE`, muted `#6B7480`,
  bordes `#232B33`. El negro domina; el gris solo jerarquiza.
- **Regla**: el naranja nunca compite con el cian en la misma zona. Naranja =
  emoción/acción; cian = técnica/estado. Si ambos aparecen, uno es fondo del
  otro (planeta con órbita cian).

## Typography

La combinación de la casa: **Space Grotesk para titulares** (carácter
geométrico sin extravagancia), **Inter para cuerpo largo** (aguanta páginas de
texto técnico y tablas sin cansar), **JetBrains Mono solo para lo técnico**
(etiquetas, readouts, coordenadas).

- Titulares: Space Grotesk 600–700, tracking cerrado, `-0.01em` o más.
- Cuerpo: Inter 400 (600 para énfasis), interlineado 1.6, tracking `+0.01em` —
  espacioso, nada mecánico.
- Técnico: JetBrains Mono 500–600, tracking **abierto** (`0.14em`–`0.22em`),
  MAYÚSCULAS, solo para micro-etiquetas (`// MOD-01`, `STATUS: OPERATIONAL`).
- El mono nunca se usa para bloques grandes de lectura; es condimento.

### Jerarquía (web)

| Rol | Fuente | Peso | Tamaño | Interlínea | Tracking |
|-----|--------|------|--------|-----------|----------|
| Display (hero) | Space Grotesk | 700 | 3.25rem | 1.05 | -0.02em |
| H1 | Space Grotesk | 600 | 2rem | 1.1 | -0.01em |
| H2 | Space Grotesk | 600 | 1.5rem | 1.15 | -0.01em |
| H3 | Space Grotesk | 600 | 1.2rem | 1.25 | -0.005em |
| Cuerpo | Inter | 400 | 1rem | 1.6 | +0.01em |
| Énfasis | Inter | 600 | 1rem | 1.6 | +0.005em |
| Etiqueta técnica | JetBrains Mono | 500 | 0.72rem | 1.4 | +0.22em |
| Badge de misión | JetBrains Mono | 600 | 0.62rem | 1.2 | +0.14em |

**Detalle de marca**: Space Grotesk Medium con tracking abierto para
micro-elementos en mayúsculas — el equivalente web de
`PROPUESTA TÉCNICA · SEPTIEMBRE 2026` en un documento.

## Layout & Spacing

- Contenedor máximo: 1024 px (64rem), centrado.
- Base de espaciado: escala 6-12-24-40-64.
- Secciones: 40–64 px verticales; el hero respira más (100+ px).
- Retícula technique de fondo solo en el hero, con máscara radial
  (centro visible, bordes fundidos) — nunca en todo el viewport.

## Shapes

- Radios: 4 / 8 / 12 / 16 px (sm/md/lg/xl). Bordes vivos, nada de píldoras
  salvo badges de misión.
- **Corners de mira**: micro-ticks cian (2 px, 14 px de largo) en las 4
  esquinas del marco del hero — el sello visual.
- Badges: píldora completa (9999px) solo para badges de misión y estados.

## Components

- **Button-primary**: fondo Marte `#FF7A45`, texto casi negro `#14100D`,
  Inter 600, radio 8px. Hover: `↗ lighten` (opacity 90%). Es el único
  elemento "llamativo" de la página.
- **Button-secondary**: transparente, borde `#232B33`, texto `#E8EBEE`.
  Hover: borde y texto cian.
- **Card**: superficie `#0B0E13`, borde `#232B33`, radio 12px, padding 24px.
  Hover: borde cian al 40%.
- **Mission-badge**: píldora con borde cian, texto `#26D0F0` Mono 600
  (`MARS-07`). Estados: "En curso" es la única variante con tinte naranja.
- **Tech-tag**: Mono 500, tracking 0.22em, MAYÚSCULAS, muted
  (`// REGISTRO_DE_MISIONES`, `STATUS: OPERATIONAL`).

## Print Documents

Para documentos que circulan como PDF/DOCX (ofertas, propuestas técnicas),
la misma jerarquía en puntos (pt):

| Elemento | Fuente | Peso | Tamaño orientativo |
|----------|--------|------|--------------------|
| Título principal | Space Grotesk | 600–700 | 28–34 pt |
| Subtítulo portada | Space Grotesk | 400–500 | 15–18 pt |
| H1 / capítulos | Space Grotesk | 600 | 20–24 pt |
| H2 | Space Grotesk | 600 | 15–17 pt |
| H3 | Space Grotesk | 500–600 | 12–14 pt |
| Cuerpo | Inter | 400 | 9.5–10.5 pt |
| Negritas cuerpo | Inter | 600 | (igual) |
| Tablas | Inter | 400/600 | 8.5–9.5 pt |
| Notas / pies | Inter | 400 | 8–9 pt |
| Números destacados | Space Grotesk | 600 | según contexto |

Cuerpo de propuesta: **Inter 10 pt, interlineado 1.3–1.4**.
Identidad de cabecera: Space Grotesk Medium, tracking abierto, MAYÚSCULAS —
`PROPUESTA TÉCNICA · SEPTIEMBRE 2026`.

Alternativas registradas: **Aptos Display + Aptos** (máxima compatibilidad
Word/LibreOffice, menos distintiva); **Manrope + Source Sans 3** (más editorial,
para proyectos tipo ElTime). Evitar Montserrat en textos largos (pesa más que
Inter).

## Do's and Don'ts

### Do
- Space Grotesk para TODOS los titulares; Inter para TODO el cuerpo.
- JetBrains Mono solo como condimento técnico (etiquetas, coords, badges).
- El naranja y el cian tienen papeles distintos: acción vs técnica.
- Tracking abierto en mono; tracking cerrado en Space Grotesk.
- Negro dominante; grises solo jerarquizan.
- Medir el resultado (build s, peso/página, CLS) antes de darlo por bueno.

### Don't
- No Montserrat para el cuerpo (pesado en texto largo).
- No píldoras para botones (excepto badges) — los botones son rectos, radio 8.
- No brillos de neón, glows exagerados ni degradados multicolor.
- No usar el mono para bloques de lectura grande.
- No combinar naranja y cian "compitiendo" en la misma zona.
- No rellenar cada sección con retícula/corners — es condimento del hero.