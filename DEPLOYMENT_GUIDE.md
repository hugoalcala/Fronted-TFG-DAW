## 🚀 Deployment en Netlify + Render

### Configuración del Frontend (Netlify)

Tu frontend ya está listo. Solo necesitas configurar estas variables en Netlify:

#### 1. Conectar GitHub
- Ve a [netlify.com](https://netlify.com)
- New site from Git → GitHub
- Selecciona tu repositorio del frontend

#### 2. Build Settings (Detecta automáticamente)
- Build command: `npm run build`
- Publish directory: `dist`

#### 3. Environment Variables ⚙️
En **Site settings → Build & deploy → Environment**

**Agrega estas variables:**
```env
VITE_API_BASE_URL=https://api-tuapp.render.com/api
VITE_GOOGLE_CLIENT_ID=521088611438-g6te96b8g58i4nts0mbmk2up9i2ob41l.apps.googleusercontent.com
```

#### 4. Deploy
- Netlify automáticamente hace build y deploy
- Tu URL: `https://tu-app.netlify.app`

---

### Configuración del Backend (Render)

Ver instrucciones en el backend (`render.yaml`)

**URL del Backend:** `https://api-tuapp.render.com/api`

---

### Pasos Finales

1. **Backend:** Push a GitHub con los cambios de Render
2. **Frontend:** Push a GitHub 
3. **Netlify:** Conectar repositorio frontend
4. **Render:** Conectar repositorio backend
5. **Profit:** 🎉

---

### Verificar Conexión

Una vez deployed, prueba que funciona:

```bash
# Desde el navegador:
curl https://api-tuapp.render.com/api/teachers -X GET
```

Si devuelve datos de profesores → ¡Conectado! ✅

---

### Troubleshooting

**Error CORS en el navegador:**
- Verifica que `VITE_API_BASE_URL` sea la URL correcta de Render
- Verifica que `config/cors.php` tenga el dominio de Netlify

**Variables no se cargan:**
- Redeploy en Netlify después de agregar las variables
- Verifica que `.env.local` no esté commiteado a GitHub
