# Nexo — Visión del Producto

## ¿Qué es Nexo?

Nexo es una aplicación web diseñada exclusivamente para estudios contables argentinos que administran carteras de clientes monotributistas.

No es un ERP. No es una plataforma genérica de contabilidad. Es una herramienta de precisión quirúrgica para un problema muy específico: que un contador sepa, en segundos, el estado real de cada uno de sus clientes monotributistas.

---

## El Problema

Un contador con 80 clientes monotributistas enfrenta todos los meses el mismo caos:

- Planillas de Excel dispersas
- Emails con facturas adjuntas sin organizar
- Recordatorios manuales de vencimientos
- El miedo constante de que un cliente supere su límite de categoría y no se haya recategorizado a tiempo
- Tiempo invertido en buscar información que debería estar a un clic

El contador no puede crecer su cartera si cada cliente nuevo representa más carga operativa.

---

## La Solución

Nexo centraliza toda la información de cada monotributista en un solo lugar.

El contador entra, ve un dashboard que le dice exactamente qué necesita atención hoy, y puede actuar en minutos en lugar de horas.

**Nexo no hace el trabajo del contador. Le permite trabajar diez veces más rápido.**

---

## Usuario Objetivo

**Rol principal:** Contador o estudio contable con cartera de monotributistas

**Contexto:**
- Administra entre 20 y 200 clientes activos
- Necesita visibilidad rápida del estado de cada cliente
- Valora la velocidad sobre las funcionalidades

**Lo que más valora:**
1. Ver de un vistazo qué clientes requieren atención
2. No perder un vencimiento nunca más
3. Saber antes que el cliente si está cerca del límite de categoría
4. Tener todo el historial del cliente en un lugar

---

## Principios de Diseño

### 1. Velocidad sobre completitud
Una feature que ahorra 10 segundos por cliente, multiplicada por 100 clientes, ahorra casi 17 minutos diarios. Cada decisión de diseño se evalúa en función del tiempo que le devuelve al contador.

### 2. Claridad sobre opciones
El usuario no necesita configurar nada para empezar. Los defaults inteligentes cubren el 90% de los casos.

### 3. Datos limpios sobre integraciones complejas
Antes de automatizar la carga de datos (ARCA, APIs externas), Nexo debe ser excelente para gestionar datos cargados manualmente. La confianza en los datos es más valiosa que la automatización prematura.

### 4. Diseño profesional desde el día 1
Una herramienta profesional debe verse y sentirse profesional. No hay segunda oportunidad para la primera impresión, especialmente en un mercado donde la competencia son planillas de Excel.

---

## Lo que Nexo NO es

- No es un sistema de facturación electrónica
- No es una integración con ARCA (en esta etapa)
- No es un ERP
- No reemplaza al software contable existente
- No hace liquidaciones ni balances

---

## Métricas de Éxito del MVP

El MVP es exitoso cuando un contador puede:

1. Dar de alta un cliente nuevo en menos de 2 minutos
2. Ver el estado de toda su cartera en menos de 10 segundos
3. Identificar qué clientes necesitan recategorización este mes sin buscar manualmente
4. Encontrar cualquier documento de un cliente en menos de 30 segundos
