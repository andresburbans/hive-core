---
name: seo-rich-preview
description: Optimización técnica para previsualización de enlaces enriquecidos (Open Graph/Twitter), Google Sitelinks y validación inteligente en Search Console para subdominios (ej. .pages.dev) y dominios propios.
---

# SEO Rich Preview Skill

Usa este skill cuando necesites configurar vistas previas avanzadas de enlaces (estilo Airbnb), estructurar datos locales (estilo DeepMind/Palantir) y guiar en la validación en Google Search Console según el tipo de hosting/dominio.

## 1. Checklist de Implementación Técnica

### A. Open Graph & Twitter Cards (Rich Links)
1. **SIEMPRE usar URLs Absolutas:** Nunca usar rutas relativas como `images/foto.jpg`. Obtener el dominio del proyecto e inyectar la URL completa.
2. **Imagen e Identidad visual:** 
   - Usar imagen real principal (ej. Fachada, Logo, Producto).
   - **Dimensiones Recomendadas:** 1200 x 630 píxeles (Ratio 1.91:1) para máxima compatibilidad.
   - **Centrado:** Advertir al usuario o diseñar manteniendo el contenido clave en el centro (los bots recortan bordes).
3. **Etiquetas Mínimas & Optimización de Carga:**
   - `og:type` (website/article)
   - `og:url` (URL canónica absoluta)
   - `og:title`
   - `og:description`
   - `og:image`
   - `og:image:type` (image/jpeg, image/png)
   - `og:image:alt` (Accesibilidad)
   - **PREVENT LAYOUT SHIFT:** Agregar siempre `og:image:width` (1200) y `og:image:height` (630) para que el renderizado de la tarjeta en chats/redes sea instantáneo y sin saltos.
   - `twitter:card` (`summary_large_image` para banners grandes).

### B. Datos Estructurados (Schema JSON-LD Avanzado)
1. Inyectar bloque `<script type="application/ld+json">` en el `<head>`.
2. Usar el tipo exacto de `Schema.org` (ej. `Hotel`, `LocalBusiness`, `Restaurant`) en lugar del genérico.
3. **Enriquecimiento de Datos (Checklist de Calidad):**
   - Identidad: `name`, `image`, `logo`, `url`.
   - Localización y Contacto: `address`, `telephone`, `geo` (coordenadas exactas).
   - Confianza: `priceRange`, `openingHours`, `aggregateRating`.
   - Señales Sociales: Atributo `sameAs` conteniendo array de redes sociales (FB, IG, TikTok) para vincular entidades en el Knowledge Graph.
4. **CRÍTICO:** La información en el código (NAP: Name, Address, Phone) debe ser 100% consistente con el sitio web y la ficha de Google Maps para gatillar el panel derecho de Google.

### C. Google Maps Embed
1. Usar el Embed oficial de Google Maps Business (no coordenadas genéricas) para vincular la entidad en el buscador.
2. Preservar `loading="lazy"` para no dañar el Core Web Vital (LCP).

---

## 2. Herramientas de Validación y Limpieza de Caché

Después de cada despliegue, el Agente DEBE proveer estos enlaces para que el usuario verifique su trabajo:

| Herramienta | Para qué sirve | Link |
| :--- | :--- | :--- |
| **Facebook Debugger** | Forzar actualización del link en WhatsApp/FB | [Link](https://developers.facebook.com/tools/debug/) |
| **Google Rich Results** | Validar que el JSON-LD es válido para Google | [Link](https://search.google.com/test/rich-results) |
| **LinkedIn Inspector** | Limpiar la caché vieja si el preview se ve roto | [Link](https://www.linkedin.com/post-inspector/) |

---

## 3. Guía de Validación (Detección de Dominio)

Al finalizar, el Agente DEBE evaluar si el usuario usa un subdominio gestionado (ej. `*.pages.dev`, `*.netlify.app`) o un Dominio Propio, y emitir la siguiente instrucción:

### SI ES SUBDOMINIO (Ej: .pages.dev)
Google no permite verificación por DNS (Registro TXT) en el dominio raíz del proveedor.
**Ruta de Acción:**
1. En Google Search Console, elegir **"Prefijo de la URL"** (cuadro derecho).
2. Usar método **"Etiqueta HTML"**. El Agente debe copiar el `<meta name="google-site-verification" ... />` e insertarlo en el `<head>`.

### SI ES DOMINIO PROPIO (Ej: hotel.com)
**Ruta de Acción:**
1. En Search Console, elegir **"Dominio"** (cuadro izquierdo).
2. Copiar registro TXT y añadirlo a la zona DNS en el registrador o Cloudflare.

---

## 4. Cierre del Ciclo SEO
1. Verificar `sitemap.xml` y URL absoluta en `<loc>`.
2. Instruir envío de Sitemap en Search Console para gatillar el indexado inmediato de Sitelinks y el Panel lateral.

