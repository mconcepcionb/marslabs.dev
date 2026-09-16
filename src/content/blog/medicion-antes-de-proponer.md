---
title: Por qué una arquitectura sin medición no se propone
description: "La regla que define cómo trabaja Mars Labs: validar cada decisión de stack con un spike medible, no con intuición. Con el caso ElTime como ejemplo real."
pubDate: 2026-09-10
tags: [arquitectura, ssg, medicion]
---

Toda decisión de arquitectura debería poder defenderse con un número. Si no se
puede medir, no se conoce — y una idea de arquitectura sin medición no se
propone.

## El caso ElTime

Cuando se planteó migrar un periódico digital a un front estático, la pregunta
natural era: *¿aguanta un SSG esta escala?* La respuesta no se dio con opiniones,
sino con un spike:

- **60.000 páginas generadas en 39 segundos** de build.
- **~4,1 KB de HTML por página** servida.
- **CLS de 0,017** con anuncios inyectados por JS y hueco pre-reservado.

Tres números y la arquitectura dejó de ser una apuesta para ser una decisión.

## Qué se aprende

1. La escala casi nunca es el cuello de botella que parece.
2. El riesgo real suele estar en lo que no se mide (transformación de imágenes,
   descarga de datos, layout shift).
3. Medir primero cuesta horas; cambiar de arquitectura después cuesta semanas.

Por eso Mars Labs valida antes de construir, siempre con el mismo método:
primero el número, luego la propuesta.