
# 🤖 Nodemat Contest

**Nodemat Contest** es una plataforma avanzada de simulación y orquestación de LLMs (Large Language Models). Permite enfrentar a dos modelos de Inteligencia Artificial (Agente A vs Agente B) en diversos escenarios conversacionales, desde debates filosóficos hasta batallas de rap y entrevistas técnicas.

![Nodemat Contest Banner](https://via.placeholder.com/1200x400/0f172a/ef4444?text=Nodemat+Contest)

## ✨ Características Principales

*   **⚡ Multi-Proveedor:** Soporte nativo para **OpenRouter**, **OpenAI**, **Groq** y **Google Gemini**.
*   **🎮 Escenarios Predefinidos:** Más de 20 escenarios listos para usar (Turing Battle, Dungeon Master, Code Review, etc.).
*   **🛠 Configuración Granular:**
    *   Personalización completa de *System Prompts*.
    *   Selección dinámica de modelos (GPT, Claude, Llama, Gemini, etc.).
    *   Control de límites de tokens.
*   **🕹️ Modos de Control:**
    *   **Automático:** Los agentes conversan en bucle hasta el límite de iteraciones.
    *   **Manual:** Control paso a paso para analizar cada respuesta antes de continuar.
*   **💰 Estimación de Costos:** Cálculo en tiempo real del costo de la sesión basado en los precios de OpenRouter.
*   **💾 Persistencia:** Guardado automático del historial de chats en Local Storage con opción de exportación a JSON/Markdown.
*   **📱 Diseño Responsivo:** Interfaz moderna y adaptable construida con Tailwind CSS.

---

## 🚀 Instalación y Desarrollo Local

Este proyecto utiliza **React + Vite**.

### Prerrequisitos
*   Node.js (v16 o superior)
*   npm o yarn

### Pasos

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/diegoparras/nodemat-contest.git
    cd nodemat-contest
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz basado en `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Define el usuario y contraseña para el login:
    ```env
    VITE_APP_USER=admin
    VITE_APP_PASSWORD=tupassword
    ```

4.  **Iniciar servidor de desarrollo:**
    ```bash
    npm run dev
    ```

---

## ☁️ Despliegue en Vercel

Esta aplicación está optimizada para desplegarse en Vercel con configuración cero.

1.  Haz un Fork de este repositorio en GitHub.
2.  Crea una cuenta en [Vercel](https://vercel.com).
3.  Importa el proyecto desde GitHub.
4.  En la configuración del proyecto en Vercel, ve a **Environment Variables** y agrega:
    *   `VITE_APP_USER`: Tu usuario deseado.
    *   `VITE_APP_PASSWORD`: Tu contraseña deseada.
5.  Haz clic en **Deploy**.

¡Listo! Tu arena de batalla de IAs estará en línea.

---

## 📖 Guía de Uso

### 1. Login
Ingresa con las credenciales configuradas en tu archivo `.env`.

### 2. Configuración de Agentes
En el panel lateral izquierdo:
*   Selecciona el **Proveedor** (ej. OpenRouter, Gemini).
*   Ingresa tu **API Key** (se almacena solo en memoria local del navegador).
*   Haz clic en el botón de **Conectar** (ícono Wifi/Enchufe).
*   Selecciona el **Modelo** de la lista desplegable.
*   Edita el **System Prompt** si deseas cambiar la personalidad del agente.

### 3. Selección de Escenario
En la barra inferior:
*   Elige un escenario (ej. "Batalla de Rap").
*   Esto cargará automáticamente *System Prompts* temáticos para ambos agentes y un tema inicial.
*   Puedes modificar el **Tema Inicial** manualmente.

### 4. Controles de Simulación
*   **Play:** Inicia la conversación.
*   **Pausa:** Detiene temporalmente.
*   **Paso a Paso (Manual):** Activa el switch "Manual" para aprobar cada turno.
*   **Max Tokens:** Activa y configura el límite de longitud de respuesta.

---

## 🛠 Tecnologías Utilizadas

*   **Frontend:** React 18, TypeScript, Vite.
*   **Estilos:** Tailwind CSS.
*   **Iconos:** Lucide React.
*   **API:** Fetch API estándar para comunicación con LLMs.
*   **Formato de Texto:** React Markdown.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Eres libre de usarlo, modificarlo y distribuirlo.

Desarrollado con ❤️ e IA.
