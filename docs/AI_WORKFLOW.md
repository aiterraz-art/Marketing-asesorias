# Workflow Gemini + Codex (Plantilla)

Usa este flujo para trabajar ambos asistentes sin fricción en el mismo repo.

## 1) Ticket base (copiar y llenar)

```md
# Título
[feat|fix|refactor|docs]: <resumen corto>

## Objetivo
Qué problema se resuelve y cuál es el resultado esperado.

## Alcance
- Incluye:
- No incluye:

## Archivos esperados
- src/...
- supabase/...

## Criterios de aceptación
- [ ] Caso 1
- [ ] Caso 2
- [ ] Caso 3

## Riesgos
- Riesgo técnico:
- Riesgo de regresión:

## Validación
- Comandos: `npm run lint`, `npm run test`, `npm run build`
- Prueba manual: pasos concretos
```

## 2) Prompt para Gemini (arquitectura / enfoque)

```md
Contexto:
Estoy trabajando en este ticket:
[pega ticket]

Necesito:
1. Propuesta de enfoque técnico (máximo 2 alternativas).
2. Tradeoffs de cada alternativa.
3. Recomendación final con justificación.
4. Lista de cambios por archivo (sin escribir código completo).
5. Riesgos y plan de pruebas.

Restricciones:
- No inventar archivos fuera del alcance.
- Mantener compatibilidad con lo existente.
- Responder en formato accionable y breve.
```

## 3) Prompt para Codex (implementación)

```md
Implementa este ticket en el repo actual.

Ticket:
[pega ticket]

Decisión de arquitectura elegida:
[pega recomendación final de Gemini]

Instrucciones:
1. Haz cambios mínimos y enfocados.
2. Edita solo archivos dentro del alcance.
3. Ejecuta validaciones necesarias (`lint/test/build` según aplique).
4. Entrega:
   - Resumen de cambios
   - Archivos modificados
   - Riesgos pendientes
   - Cómo probar
```

## 4) Regla para evitar conflictos entre asistentes

- Un solo asistente modifica código a la vez.
- Si ambos participan en la misma tarea:
  1. Gemini define enfoque.
  2. Codex implementa.
  3. Gemini revisa riesgos.
  4. Codex aplica ajustes finales.
- No pedir cambios simultáneos sobre el mismo archivo.

## 5) Checklist de merge

Antes de mergear:

- [ ] `git diff` revisado
- [ ] Cambios alineados al ticket
- [ ] `lint` en verde
- [ ] `test` en verde (si aplica)
- [ ] `build` en verde
- [ ] Validación manual completada
- [ ] PR con resumen claro

## 6) Template de PR (copiar y llenar)

```md
## Qué cambia
- 

## Por qué
- 

## Archivos clave
- 

## Cómo probar
1. 
2. 
3. 

## Riesgos / pendientes
- 
```

## 7) Convención de ramas y commits

- Rama por tarea: `feat/...`, `fix/...`, `refactor/...`
- Commits pequeños y descriptivos:
  - `feat: add campaign filter in dashboard`
  - `fix: handle null profile in student history`
  - `refactor: split ads analytics chart utils`

---

Sugerencia práctica: si una tarea toca `supabase/schema.sql`, trátala como ticket independiente para reducir riesgo y facilitar rollback.
