---
title: "Mi asistente de IA vive en mi homelab"
summary: "Un agente de IA no tiene por qué vivir en la nube de nadie: el mío corre en un contenedor de mi homelab y me habla por Telegram, con un topic para cada cosa."
date: 2026-09-16
tags: [ia, agentes, homelab, telegram]
---

Tengo un asistente de IA que no vive en un data center ajeno. Corre en un
contenedor de mi homelab, en una máquina de mi casa, y le hablo por Telegram
como a cualquier persona. No es un chatbot con respuestas prefabricadas: es un
agente con herramientas reales.

## Qué es

Puede ejecutar comandos en el terminal, editar archivos, buscar en la web,
usar un navegador, lanzar subagentes en paralelo y programar tareas que se
repiten solas. Cuando le pido algo, lo ejecuta y lo verifica con esas
herramientas antes de responder. No describe: hace.

Tiene memoria persistente entre sesiones. No empieza de cero cada vez que le
escribo: sabe de mi setup, de mis proyectos y de las convenciones que hemos
acordado. La memoria no es un prompt que se repite; es un estado que guarda.

## Cómo lo opero

La operación es Telegram. La conversación tiene cinco topics fijos, cada uno
con un trabajo:

- `sistema` — mantenimiento y mensajes del propio agente.
- `notificaciones` — canal de avisos y tareas programadas.
- `infra` — la salud del homelab. Un poller consulta Grafana cada minuto y
  avisa aquí solo cuando cambia el estado de una alerta, sin spam.
- `general` — las conversaciones normales, el destino por defecto.
- `gaming` — tres tareas programadas: la recomendación diaria de Steam Deck a
  las 10:00, el repaso semanal del domingo y la revisión de lo que se juega
  fuera de Steam.

Además, cada conversación nueva crea su propio topic con título generado por
el modelo. No son los cinco fijos: son sesiones que se nombran solas. El
resultado es que mi homelab habla por el mismo canal que uso para hablar con
personas, y cada cosa cae donde toca.

## Ejemplo: gestión

Mis notas viven en vaults de Obsidian. El agente las clasifica cada semana con
reglas: si es trabajo, si es la novela, si es del homelab y, si no encaja, a
un vault general. Repara el frontmatter que falta, mueve los archivos
actualizando los enlaces entre notas y hace commit de git antes y después de
cada movimiento. Todo es reversible con un `git revert`. El conocimiento se
ordena solo, sin romper nada y con vuelta atrás.

## Ejemplo: investigación

El otro lado es investigar a fondo. Cuando hizo falta saber quién está
realmente detrás de una persona o empresa, el agente escaneó los registros del
BORME de Tenerife entre 2009 y 2026, cruzó los datos con perfiles públicos y
dejó la traza documentada. No es una búsqueda de diez segundos: es un trabajo
de varias horas ejecutado bajo demanda y verificado.

## Perfiles

No es un solo asistente: son tres instancias aisladas, una por persona, cada
una con su propia memoria y sus propios secretos. La mía y la de otras dos
personas. Un agente por perfil, sin mezclar contextos.

## La regla

La diferencia entre un chatbot y un agente no es el modelo: es que el agente
tiene acceso y ejecuta. Y la diferencia entre una demo y una herramienta es la
operación: por dónde le hablas, dónde caen las alertas y qué memoria conserva.
Cuando la infraestructura habla por donde ya hablas, el asistente deja de ser
una curiosidad y pasa a ser parte del sistema.