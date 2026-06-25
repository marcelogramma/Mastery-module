# Análisis del Sitio — Mastery Module

Auditoría del frontend desplegado en `https://mastery-module.vercel.app/`
basada en análisis del código fuente (React + Vite + Supabase + Vercel Serverless Functions).

---

## Resumen Ejecutivo

Mastery Module es una aplicación de aprendizaje basada en la Técnica Feynman que usa Claude (Anthropic) como motor
de generación de contenido, Supabase como backend (auth + DB) y un sistema de Spaced Repetition (SM-2). La app tiene
5 modos de aprendizaje, soporte bilingüe (EN/ES), dark mode, y un admin dashboard.

---

## 1. Seguridad — Hallazgos Críticos

### 🔴 CRÍTICO: Credenciales hardcodeadas en código fuente público

**Archivo**: `src/supabase.js`

```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ldywxoxanulmnjtcmucg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGci...';
```

**Impacto**: La anon key de Supabase está expuesta en el repositorio público. Aunque Supabase la diseña para ser
pública (Row Level Security la protege), el URL del proyecto también queda expuesto, facilitando ataques dirigidos.

**Recomendación**:

- Eliminar los fallbacks hardcodeados. Usar SOLO variables de entorno.
- Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel.
- Agregar el archivo a `.gitignore` si se decide mover a un `.env`.

### 🔴 CRÍTICO: API proxy con CORS wildcard

**Archivo**: `api/claude.js`

```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

**Impacto**: Cualquier dominio puede hacer requests al endpoint de Claude a través del proxy. Un atacante podría
abusar del endpoint si obtiene un JWT válido.

**Recomendación**:

- Restringir CORS al dominio de producción: `https://mastery-module.vercel.app`.
- Agregar verificación de `Referer` o `Origin` header como capa adicional.

### 🟡 ALTO: Rate limiting insuficiente

El burst window es de 3 segundos con máximo 4 requests. Un usuario puede hacer 80 requests/minuto sostenido si
espera 3 segundos entre bursts. Con un daily budget de $0.40/usuario, el riesgo financiero está acotado, pero
podría escalar con muchos usuarios.

**Recomendación**:

- Implementar rate limiting por IP además de por usuario.
- Reducir el burst a 2 requests por 5 segundos para el caso general.
- Agregar Vercel Edge Middleware con rate limiting a nivel infraestructura.

### 🟡 ALTO: No hay CSP (Content Security Policy)

El `index.html` no tiene headers de seguridad:

- No hay `Content-Security-Policy`
- No hay `X-Frame-Options`
- No hay `Strict-Transport-Security`

**Recomendación**:
Agregar `vercel.json` headers:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https://flagcdn.com data:; connect-src 'self' https://ldywxoxanulmnjtcmucg.supabase.co" }
      ]
    }
  ]
}
```

### 🟡 MEDIO: Supabase Service Role Key en servidor sin validación extra

`api/claude.js` usa `SUPABASE_SERVICE_ROLE_KEY` para validar tokens. Si bien está en environment variables de
Vercel (no expuesta al client), no hay validación adicional del scope del token ni refresh token rotation.

---

## 2. Performance

### 🔴 Archivos monolíticos — Sin code splitting

| Archivo | Líneas | Tamaño |
|---|---|---|
| `MasteryModule.jsx` | 2,436 | 263 KB |
| `App.jsx` | 1,887 | 98 KB |
| `LandingPage.jsx` | 1,218 | 83 KB |

**Impacto**: El bundle completo se carga en el primer load (~444 KB de código fuente sin minificar). Vite
lo compila pero no hay lazy loading ni route-based splitting.

**Recomendaciones**:

1. **Code splitting con React.lazy**:

   ```javascript
   const MasteryModule = React.lazy(() => import('./MasteryModule'));
   const LandingPage = React.lazy(() => import('./LandingPage'));
   ```

2. **Extraer constantes de tema a un módulo compartido** — los objetos LIGHT/DARK están duplicados en 3 archivos.

3. **Extraer la función `formatMath` (~200 líneas de regex)** a un web worker para no bloquear el main thread.

### 🟡 Inline styles en lugar de CSS

Todo el styling es inline via objetos JavaScript. Esto:

- Impide caching del CSS por el navegador
- Aumenta el tamaño del virtual DOM
- Dificulta media queries y pseudo-elementos
- Recrea objetos en cada render

**Recomendación**: Migrar a CSS Modules o Tailwind CSS. Mínimamente, extraer los objetos de estilo fuera
de los componentes como constantes.

### 🟡 Sin memoización

No hay uso de `React.memo`, `useMemo`, o `useCallback` en componentes que reciben props complejas. El
`MasteryModule` (2,436 líneas) se re-renderiza completo en cada cambio de estado.

### 🟡 Fonts externos sin preload

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque..." rel="stylesheet"/>
```

Sin `<link rel="preload">`, las fonts causan FOUT (Flash of Unstyled Text).

**Recomendación**: Agregar `font-display: swap` y considerar self-hosting las fonts.

---

## 3. UX / User Friendly

### 🔴 Archivos gigantes = UX inconsistente

Con 2,436 líneas en un solo componente, la lógica de UI está mezclada con lógica de negocio, formateo
matemático, traducciones, y manejo de estado. Esto genera:

- Comportamientos inconsistentes entre modos
- Dificultad para mantener el producto

### 🟡 No hay feedback de carga global

Cuando se hacen requests a Claude (que puede tardar 5-15s), no hay indicador de progreso claro
a nivel de la aplicación. El usuario puede pensar que la app se colgó.

**Recomendación**: Implementar un skeleton loader o shimmer effect durante la generación de contenido.

### 🟡 No hay manejo de estado offline

Si el usuario pierde conexión, no hay feedback ni retry automático. Los requests fallan silenciosamente.

**Recomendación**: Agregar detección de `navigator.onLine` y mostrar un banner cuando no hay conexión.

### 🟡 No hay onboarding

Un usuario nuevo no tiene guía de cómo usar los 5 modos de aprendizaje ni el sistema de repetición espaciada.

**Recomendación**: Tour guiado en primer uso (tooltip steps o modal introductorio).

### 🟢 Positivos

- Soporte bilingüe (ES/AR - EN) bien implementado con toggle accesible.
- Dark mode con persistencia en localStorage.
- Selector de nivel de conocimiento (Beginner/Intermediate/Advanced) que personaliza las respuestas.
- Daily budget visible para el usuario (transparencia).
- Landing page explicativa con la metodología.

---

## 4. User Quality (Calidad de Experiencia)

### 🟡 Sin router — toda la navegación es por estado

No hay URL routing. El usuario no puede:

- Compartir un link a un topic específico
- Usar el botón "atrás" del navegador de forma intuitiva
- Bookmarkear una sección

**Recomendación**: Implementar `react-router` con rutas mínimas (`/`, `/module`, `/review`, `/profile`).

### 🟡 Formulario matemático complejo sin fallback

La función `formatMath` (200+ líneas de regex) intenta renderizar notación matemática. Si falla
en un edge case, puede mostrar texto roto o caracteres ilegibles.

**Recomendación**: Usar una librería probada como KaTeX para renderizado matemático, con fallback
a texto plano si la expresión no es parseable.

### 🟡 Sin persistencia local del estado de estudio

Si el usuario cierra la pestaña durante una sesión, pierde todo el progreso de esa sesión.

**Recomendación**: Guardar el estado de la sesión actual en `sessionStorage`.

### 🟡 Accesibilidad limitada

- No hay atributos `aria-*` en los componentes interactivos.
- Los botones de rating no tienen `aria-label`.
- El contraste del `textMuted` (#8a8a96 sobre #f7f5f0) es 3.2:1, por debajo del mínimo WCAG AA (4.5:1).
- No hay skip navigation links.
- No hay gestión de focus al cambiar de pantalla.

---

## 5. Aspectos Visuales

### 🟡 Diseño sólido pero con oportunidades

**Positivos**:

- Paleta de colores coherente (amber/orange como accent, bien diferenciado entre light/dark).
- Tipografía dual correcta (Bricolage Grotesque para títulos, DM Sans para body).
- Border radius consistente (10-16px).
- Animaciones sutiles (fadeUp, morphIn).

**Mejoras**:

- Los estados hover/active de botones no están definidos (no hay feedback táctil).
- No hay breakpoints responsive documentados — el layout se adapta solo por `maxWidth`.
- Los scrollbars no están estilizados en dark mode.
- No hay loading skeletons — los cambios de estado son abruptos.
- El toggle ES/EN en la pantalla de auth es muy pequeño (difícil de tocar en mobile).

---

## 6. Arquitectura — Recomendaciones Estructurales

### Separación actual (problemática)

```text
src/
├── App.jsx           (1,887 líneas — Auth + Profile + Admin + Review + Router)
├── MasteryModule.jsx (2,436 líneas — Todo el módulo de aprendizaje)
├── LandingPage.jsx   (1,218 líneas — Landing completa)
├── srs.js            (Algoritmo SM-2)
├── supabase.js       (Cliente Supabase)
└── main.jsx          (Entry point)
```

### Estructura recomendada

```text
src/
├── components/
│   ├── auth/
│   │   ├── AuthScreen.jsx
│   │   └── ResetPasswordScreen.jsx
│   ├── profile/
│   │   └── ProfileScreen.jsx
│   ├── admin/
│   │   └── AdminDashboard.jsx
│   ├── review/
│   │   └── ReviewDeck.jsx
│   ├── module/
│   │   ├── MasteryModule.jsx
│   │   └── MathText.jsx
│   ├── landing/
│   │   └── LandingPage.jsx
│   └── ui/
│       ├── Button.jsx
│       ├── Input.jsx
│       └── Card.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useTheme.js
│   └── useTranslation.js
├── lib/
│   ├── supabase.js
│   ├── srs.js
│   └── formatMath.js
├── styles/
│   └── theme.js
├── translations/
│   ├── en.js
│   └── es.js
├── App.jsx           (solo routing)
└── main.jsx
```

---

## 7. Plan de Acción Priorizado

### Inmediato (Seguridad)

1. Eliminar credenciales hardcodeadas de `supabase.js`.
2. Restringir CORS en `api/claude.js` al dominio de producción.
3. Agregar security headers en `vercel.json`.

### Corto plazo (Performance + UX)

1. Implementar code splitting con `React.lazy`.
2. Extraer themes duplicados a un módulo compartido.
3. Agregar skeleton loaders durante requests a Claude.
4. Implementar detección de estado offline.

### Mediano plazo (Calidad)

1. Agregar react-router para URL routing.
2. Migrar formateo matemático a KaTeX.
3. Agregar atributos de accesibilidad (aria, contraste, focus).
4. Refactorizar componentes monolíticos en módulos más pequeños.

### Largo plazo (Mantenibilidad)

1. Migrar inline styles a CSS Modules o Tailwind.
2. Implementar tests unitarios del frontend (Vitest + Testing Library).
3. Agregar E2E tests (Playwright).
4. Implementar service worker para caching de assets.
