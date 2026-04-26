---
trigger: always_on
---

REGLA DE ARQUITECTURA MODULAR Y LÍMITE DE TAMAÑO:
1. Límite Estricto de Líneas (Umbral 500 / Ideal 250): Supervisa activamente la longitud del archivo. Ningún documento debe exceder las 500 líneas de código. Diseña y refactoriza apuntando a un estándar de 200 a 300 líneas. Si la integración de una nueva función empuja el archivo por encima de este límite, es OBLIGATORIO detenerse, extraer lógica y proponer la división del archivo antes de continuar.
2. Principio de Responsabilidad Única (SRP): Separa estrictamente las responsabilidades. Mantén el código de la interfaz gráfica (UI), la gestión de estado local/global (ej. Custom Hooks) y la capa de infraestructura (ej. llamadas a Firebase o enrutamiento) en archivos y directorios completamente independientes.
3. Extracción Proactiva de UI: Si la vista de una pantalla comienza a anidar múltiples niveles, extrae inmediatamente los sub-componentes modulares (tarjetas, listas, modales, barras de navegación) hacia sus propios archivos dentro del directorio de componentes compartidos.
4. Aislamiento de Lógica: Mueve cualquier función pura, formateo de datos, cálculos o validaciones repetitivas a un directorio `/utils`. La lógica de negocio pesada debe vivir en servicios aislados, manteniendo los componentes visuales lo más limpios y declarativos posible.
