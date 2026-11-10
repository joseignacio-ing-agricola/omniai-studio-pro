# OmniAI Studio PRO — MVP

Chat multi-IA con proyectos e historial persistente, autenticación Supabase y failover por proveedor. Código de ejemplo para uso personal o desarrollo; no es un SaaS endurecido para producción.

## Requisitos
Node.js 20+, Supabase, y una o más claves API. Para Ollama local, ejecutar Ollama en el mismo host que Next.js (no en Cloudflare).

## Instalación
1. `npm install`
2. Copiar `.env.example` a `.env.local` y completar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y claves de proveedores.
3. Ejecutar `supabase/schema.sql` en Supabase SQL Editor (en proyecto nuevo; las políticas CREATE POLICY no son idempotentes).
4. Configurar Supabase Auth > URL Configuration con la URL local y luego la URL pública; habilitar Email auth.
5. `npm run dev` y abrir http://localhost:3000.
6. Crear usuario, confirmar email si corresponde, crear proyecto y conversar.

## Proveedores
- Gemini: `GEMINI_API_KEY` (modelo `gemini-2.5-flash`).
- Groq: `GROQ_API_KEY` (modelo `llama-3.3-70b-versatile`).
- OpenRouter: `OPENROUTER_API_KEY` (router `openrouter/free`, disponibilidad variable).
- Ollama: `OLLAMA_MODEL=llama3.2`, `OLLAMA_BASE_URL=http://127.0.0.1:11434`; ejecutar `ollama pull llama3.2` y `ollama serve` localmente. En Cloudflare, desactivar Ollama eliminando OLLAMA_MODEL o apuntar a endpoint remoto privado autorizado; nunca exponer Ollama públicamente sin protección.

El indicador de Ollama representa configuración, no una comprobación de salud. Las cuotas no son consultadas: los estados solo indican si existe una clave; errores HTTP 429/5xx activan failover. No se garantiza gratuidad ni compatibilidad constante de los modelos. La API puede cobrar según configuración de cuenta. Para modo estrictamente gratuito, utilizar únicamente credenciales y modelos gratuitos verificados.

## GitHub
`git init && git add . && git commit -m "Initial OmniAI MVP"`; crear repositorio en GitHub y configurar remoto. `.env.local` está ignorado.

## Cloudflare
Next.js con API routes **no** es un sitio estático: desplegar mediante Cloudflare Workers y un adaptador Next.js compatible (OpenNext Cloudflare). En Cloudflare crear Worker con build de OpenNext, agregar variables y secretos en el panel Workers, configurar dominio y variables públicas. Consultar la guía vigente de OpenNext Cloudflare para el comando de despliegue y la compatibilidad de la versión de Next.js. No usar Cloudflare Pages static export porque rompería /api/chat. Alternativa inmediata para el MVP: desplegar en Vercel y conectar luego Cloudflare como DNS.

## Límites actuales del MVP
- Historial reciente: últimos 30 mensajes; no hay compresión semántica ni editor de archivos.
- Respuestas no streaming y ejecución secuencial.
- Fallos recuperables: 402, 408, 409, 429, 5xx y errores de red. Errores 400/401/403 detienen la cadena para evitar ocultar credenciales inválidas.
- No existe seguimiento real de saldo ni detección preventiva de agotamiento; hay failover reactivo.
- No hay herramientas de ejecución de código, repositorios GitHub ni publicación automática.
- Para producción: añadir rate limiting por usuario, protección contra concurrencia, métricas, auditoría, verificación de salud, retry/backoff, deduplicación/idempotencia, protección de costos y pruebas end-to-end.

## Prueba manual de failover
Configurar dos proveedores. Desactivar temporalmente uno o provocar un error 429 con un proxy de pruebas y enviar un mensaje. El router intentará el siguiente y registrará el proveedor utilizado. Si no hay proveedor funcional, conservará el mensaje del usuario.