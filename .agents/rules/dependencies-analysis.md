---
trigger: always_on
---

Siempre investiga las dependencias y módulos conectados asl código que vas a modificar. Aségurate de no romper la funcionalidad actual de un feature o herramienta, a menos que se solicite explícitamente por el usuario.

Siempre muestra en el chat el archivo principal a modificar y sus dependencias.

Además siempre válida que firestore esté actualizado con lo que necesite, siguiendo los siguientes parámetros:

REGLA DE INTEGRIDAD Y CONSULTAS DE FIRESTORE:
1. Predicción de Índices Estricta: Por cada consulta (query) de Firestore generada que incluya múltiples cláusulas `where`, o combine `where` con `orderBy`, es OBLIGATORIO generar en la respuesta el objeto JSON exacto que debe ir en el archivo `firestore.indexes.json`. Nunca asumas que el índice ya existe.
2. Manejo de 'Failed-Precondition': Toda ejecución de consulta compleja debe incluir un bloque try/catch que capture específicamente el error de Firebase `failed-precondition` (falta de índice). El log de error debe extraer y mostrar claramente la URL autogenerada por Firebase para crear el índice con un clic.
3. Atomicidad por Defecto: Si una operación implica actualizar, crear o eliminar datos en más de un documento o colección al mismo tiempo, es obligatorio usar `writeBatch` o `runTransaction`. Cero tolerancia a escrituras parciales que dejen la base de datos inconsistente.
4. Prevención de Undefined: Antes de cualquier operación de escritura (`set`, `update`, `add`), asegúrate de limpiar el payload de valores `undefined` o de usar `merge: true` correctamente para evitar corromper la estructura del documento.