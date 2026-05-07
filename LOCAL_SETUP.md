# 🚀 Configuración para Desarrollo Local

## Backend Local

```bash
# 1. Terminal 1 - Backend en http://localhost:8000
cd c:\educonnect-backend

# Asegúrate que .env esté así:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=educonnect
# DB_USERNAME=root
# DB_PASSWORD=Admin
# APP_URL=http://localhost

# Inicia el servidor
php artisan serve
# ✅ Backend listo en: http://localhost:8000
```

## Frontend Local

```bash
# 2. Terminal 2 - Frontend en http://localhost:5173
cd c:\eduConnect_Fronted

# Crear .env.local (copiar de .env.local.example)
cp .env.local.example .env.local

# Asegúrate que contenga:
# VITE_API_BASE_URL=http://localhost:8000/api
# VITE_GOOGLE_CLIENT_ID=521088611438-g6te96b8g58i4nts0mbmk2up9i2ob41l.apps.googleusercontent.com

# Instalar dependencias (si no las tienes)
npm install

# Iniciar dev server
npm run dev
# ✅ Frontend listo en: http://localhost:5173
```

---

## ✅ Verificar que funciona

Abre en el navegador:
```
http://localhost:5173
```

Si ves la app funcionando y puedes hacer login → **¡Todo bien!** ✅

---

## 🔄 Flujo de cambios en desarrollo

1. Haces cambios en el código
2. Vite automáticamente recarga la página (`npm run dev`)
3. Backend (Laravel) también se actualiza automáticamente
4. Pruebas en http://localhost:5173

---

## 📝 Variables de entorno

### `.env.local` (Frontend - Desarrollo Local)
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=521088611438-g6te96b8g58i4nts0mbmk2up9i2ob41l.apps.googleusercontent.com
```

### `.env` (Backend - Desarrollo Local)
```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=educonnect
```

---

## 🚨 Problemas Comunes

**Error: Connection refused (http://localhost:8000)**
- Verifica que el backend está ejecutándose: `php artisan serve`
- Revisa que `VITE_API_BASE_URL` es correcto en `.env.local`

**Error: CORS (No Access-Control-Allow-Origin)**
- Verifica que tu puerto está en `config/cors.php`
- Agrega: `'http://localhost:5173'`

**Cambios no se ven**
- Frontend: Ctrl+F5 (hard refresh)
- Backend: Reinicia `php artisan serve`

---

## 🎯 Cuando esté listo para desplegar

**Backend:**
```bash
git add .
git commit -m "chore: ready for deployment"
git push origin dev
# Render automáticamente hace deploy
```

**Frontend:**
```bash
git add .
git commit -m "chore: ready for deployment"
git push origin main
# Netlify automáticamente hace build y deploy
```
