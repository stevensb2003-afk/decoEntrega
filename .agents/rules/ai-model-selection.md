---
trigger: always_on
---

Siempre confirma con el usuario qué modelo de lenguage tiene seleccionado para ejecutar la tarea.

Para cada tarea o modificación siempre análiza y sugiere el modelo de lenguage óptimo para ejecutar la tarea, el plan o la correción.

Siempre prioriza usar Gemini Flash 3 si este lenguage es adecuado o apto para ejecutar, si no procede a sugerir otro modelo y siempre pon el modelo sugerido para ejecutar al final de cada respuesta con el siguiente formato

MODELO PREFERIDO : [ AI_MODEL_LANGUAGE_NAME ]

Los modelos a elegir son los siguientes:
- Gemini Flash 3
- Gemini 3.1 Pro (Low)
- Gemini 3.1 Pro (High)
- Claude Sonnet 4.6
- Claude Opus 4.6

Siempre argumenta por qué escogiste los modelos que escogiste y justifica por qué es el mejor para esa tarea.

REGLAS PARA MOSTRAR EL LENGUAGE PREFERIDO:
- El output no es una respuesta final o resultado final
- El output no es la respuesta final tras un análisis
- El output es un aqssessment inicial de la solicitud
- El output es el plan detallado y se comunica qu[e lenguage se prefiere para confirmar
- BONUS: NO siempre el output es una tarea a ejecutar posterior, entonces no siempre se necesita mostrar el lenguage recomendado para continuar, sé inteligente en cómo manejas estos escenarios

Guia de selección de lenguages:

1) Gemini Flash (Velocidad y Eficiencia)
Este modelo está optimizado para baja latencia, ejecución rápida y tareas de volumen. Su ventana de contexto es amplia pero su razonamiento es más ligero.

- Mejor caso de uso: Generación de código "boilerplate", maquetado repetitivo, tareas iterativas de CSS/Tailwind y estructuración rápida de bases de datos.

- Ejemplo práctico en PWA: "Crea la estructura HTML y las clases de Tailwind para un bottom tab navigation (barra de navegación inferior) típico de un diseño mobile-first. Incluye cinco botones de navegación básicos y asegúrate de que ocupe todo el ancho de la pantalla."

- Ejemplo en backend/datos: "Escribe las reglas de seguridad básicas y el esquema de colección en formato JSON para un catálogo de productos en Firestore."

2) Gemini 3.1 Pro - Low (Inferencia Estándar / Equilibrio)
Este es mi modo de operación principal. Ofrece un equilibrio óptimo entre razonamiento complejo y un tiempo de respuesta ágil. Es el "caballo de batalla" para el desarrollo diario.

- Mejor caso de uso: Lógica de negocio de la aplicación, configuración core de la PWA (Manifest, Service Workers), integración de APIs y manejo de estado de datos.

- Ejemplo práctico en PWA: "Escribe el código del Service Worker para esta PWA. Necesito que intercepte las peticiones de red usando una estrategia Cache-First para los recursos estáticos (imágenes, CSS) y Network-First para las llamadas a la API, permitiendo que la aplicación funcione offline y sincronice los datos cuando recupere la conexión."

3) Gemini 3.1 Pro - High (Alto Nivel de Inferencia / Pensamiento Extendido)
Representa la configuración del modelo donde se le otorga más "tiempo de cómputo" o pasos de razonamiento para resolver problemas difíciles.

- Mejor caso de uso: Resolución de bugs complejos, arquitectura a gran escala, optimización profunda de rendimiento y refactorización.

- Ejemplo práctico en PWA: "Tengo un problema grave de fuga de memoria en mi PWA cuando el usuario navega entre múltiples vistas de catálogo pesado en dispositivos móviles de gama baja. Aquí está el código de mi gestor de estado global y mis hooks de ciclo de vida. Analiza el flujo de re-renderizado, identifica el cuello de botella y reescribe la lógica para optimizar la memoria."

4) Claude Sonnet (Precisión Frontend y UI/UX)
El tier Sonnet es ampliamente reconocido en el ecosistema actual por ser excepcionalmente preciso escribiendo código frontend moderno, componentes de React y manejando CSS complejo.

- Mejor caso de uso: Traducción de diseños a código, maquetación estricta mobile-first, animaciones fluidas, y creación de componentes UI altamente interactivos.

- Ejemplo práctico en PWA: "Genera un componente de React Native Web (o React puro) para una tarjeta de producto. El diseño debe ser estrictamente mobile-first, manejar estados visuales interactivos (tap/hover, loading, error), e incluir una animación suave al desplegar los detalles del producto."

5) Claude Opus (Macro-arquitectura y Teoría)
Opus es el modelo de peso pesado, diseñado para la comprensión teórica profunda y la retención de bases de código masivas. En el día a día de programación, Sonnet suele superarlo en agilidad, pero Opus brilla en la fase de diseño y seguridad.

- Mejor caso de uso: Diseño inicial de la arquitectura del sistema, auditorías de seguridad, cumplimiento de normativas de datos y planificación de flujos complejos.

- Ejemplo práctico en PWA: "Diseña la arquitectura completa de seguridad y autenticación para esta PWA. Detalla paso a paso cómo debemos manejar el flujo de tokens JWT, el almacenamiento criptográfico seguro en el navegador del dispositivo móvil (IndexDB vs HTTP-only cookies), y genera un diagrama de secuencia del flujo de sesión cruzada."