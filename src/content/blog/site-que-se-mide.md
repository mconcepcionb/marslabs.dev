---
title: Este site se mide a sí mismo
summary: "Las métricas del home no son promesas: son mediciones de esta misma página. Build, peso y estabilidad reales, que se actualizan solas con cada build."
date: 2026-09-16
tags: [web, ssg, medicion]
---

Cuando un sitio promete que mide todo, lo primero que tiene que medir es él
mismo. Este site lo hace: los números del home son mediciones de esta misma
página, no estimaciones.

## Cómo se mide

Con cada build se registran tres cosas:

- cuántas páginas se generan y en cuánto tiempo, según el propio build;
- cuánto pesa de media el HTML de cada página;
- cuánto se mueve la página al cargar, medido en un navegador real.

Los valores se actualizan solos en cada build. No hay números a mano: si el
contenido cambia, las métricas cambian con él.

## Qué dice ahora

El site genera todas sus páginas en poco más de un segundo, cada página pesa
alrededor de 10 KB y no se mueve al cargar. Son datos verificables: se pueden
mirar con las herramientas del navegador mientras se está leyendo esto.

## La regla

Medir lo propio antes que lo ajeno es la mejor defensa de un método. Si la
herramienta no puede medirse a sí misma, ¿por qué confiar en lo que dice de lo
demás?