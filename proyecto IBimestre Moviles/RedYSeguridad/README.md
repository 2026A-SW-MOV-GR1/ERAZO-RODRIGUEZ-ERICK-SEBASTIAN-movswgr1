# RedYSeguridad

Aplicación Android desarrollada con **React Native 0.86 (bare, TypeScript)** para la asignatura de Programación de Aplicaciones Móviles — Escuela Politécnica Nacional.

---

## Arquitectura

```
RedYSeguridad/
├── App.tsx                          # Raíz: NavigationContainer + TabNavigator
├── src/
│   ├── screens/
│   │   ├── RedScreen.tsx            # Módulo 1 — Conectividad REST
│   │   └── BovedaScreen.tsx         # Módulo 3 — Gestión de secretos
│   └── native/
│       └── SecureStorage.ts         # Wrapper TypeScript del puente nativo
└── android/app/src/main/java/com/redyseguridad/
    ├── MainApplication.kt           # Registra SecureStoragePackage en el Bridge
    └── securestorage/
        ├── SecureStorageModule.kt   # NÚCLEO: módulo nativo Kotlin (el puente)
        └── SecureStoragePackage.kt  # Registrador del módulo en React Native
```

### Flujo del Puente Nativo

```
JavaScript (React)
      │
      │  NativeModules.SecureStorageModule.guardarSecreto(...)
      ▼
React Native Bridge  ──── serializa args ────►  SecureStorageModule.kt
                                                      │
                                          ┌───────────┴─────────────┐
                                          │                         │
                                SharedPreferences            DataStore / EncryptedPrefs
                                (XML plano en disco)      (Coroutine en Dispatchers.IO)
                                          │
                                 promise.resolve(true)
                                          │
      ◄── deserializa resultado ──── Bridge
      │
   await en JS  →  actualiza estado React  →  re-render UI
```

---

## Módulos

### Módulo 1 — Red (REST)

Pantalla de consulta y actualización contra **JSONPlaceholder** (`https://jsonplaceholder.typicode.com`).

| Elemento | Detalle |
|---|---|
| GET /posts/{id} | Carga título y cuerpo en campos editables |
| PUT /posts/{id} | Envía cambios; confirma con banner "200 OK" |
| Validación | ID entero 1–100; rechaza vacío y no numérico |
| Estado | Reducer `idle → loading → success/error`; deshabilita UI durante petición |

### Módulo 3 — Bóveda

Interfaz transaccional para guardar y recuperar secretos usando el puente nativo.

| Elemento | Detalle |
|---|---|
| Inputs | Llave y Valor |
| Selector | Radio list: SharedPreferences / DataStore / EncryptedSharedPreferences |
| Guardar | Llama `SecureStorage.guardarSecreto(llave, valor, compartimento)` |
| Recuperar | Llama `SecureStorage.recuperarSecreto(llave, compartimento)` |
| Privacidad | Mensaje genérico cuando la llave no existe (sin revelar qué llaves sí hay) |

---

## Cómo correr el proyecto

### Prerrequisitos

- Node.js >= 22
- JDK 17 o superior
- Android Studio con SDK Platform 35+ y NDK 27
- Emulador Android (API 24+) o dispositivo físico con depuración USB habilitada

### Nota importante — Windows y MAX_PATH

El New Architecture de React Native 0.86 genera rutas C++ que superan el límite de 260 caracteres de Windows cuando el proyecto está en una ruta larga. La solución es crear una unidad virtual con `SUBST` (no requiere permisos de administrador) **antes** de compilar o correr la app:

```powershell
# Ejecutar UNA VEZ por sesión (en PowerShell o cmd, desde cualquier directorio)
subst P: "C:\Users\ERICK\AndroidStudioProjects\Proyecto_Moviles_IB\RedYSeguridad"
```

Todos los comandos siguientes deben ejecutarse desde `P:\`.

### Pasos

```bash
# 0. Crear la unidad virtual (una vez por sesión de terminal)
subst P: "C:\Users\ERICK\AndroidStudioProjects\Proyecto_Moviles_IB\RedYSeguridad"

# 1. Instalar dependencias JS (desde P:\)
cd P:\
npm install

# 2. Iniciar el Metro bundler (terminal A — dejar corriendo)
cd P:\
npx react-native start

# 3. Compilar e instalar en emulador/dispositivo (terminal B)
cd P:\
npx react-native run-android
```

> Si es la primera vez, Gradle descargará NDK y dependencias (~800 MB). La segunda compilación usa caché y tarda ~30 s.

### Build de release (opcional)

```bash
cd P:\android && ./gradlew assembleRelease
```

### Eliminar la unidad virtual al terminar

```powershell
subst P: /D
```

---

## Correspondencia Framework ↔ Android

Esta sección justifica por qué cada tipo de dato sensible debe ir al compartimento correcto.

### SharedPreferences — Solo datos no críticos

**Mecanismo:** Android persiste un archivo XML en `/data/data/<paquete>/shared_prefs/`. El contenido es **texto plano sin cifrado**.

**Riesgo demostrado en la app:** un atacante con acceso root al dispositivo (o una copia forense) puede leer directamente el XML con `cat` o cualquier explorador de archivos.

**Uso apropiado:**
- Preferencias de UI (tema oscuro/claro, idioma)
- Flags de onboarding ya mostrado
- Configuración no sensible

**Nunca usar para:** tokens JWT, contraseñas, claves de API, datos personales.

---

### Jetpack DataStore — Datos de aplicación no críticos

**Mecanismo:** Reemplaza a SharedPreferences con un modelo reactivo basado en **Kotlin Coroutines/Flow** y Preferences. El archivo se almacena en `/data/data/<paquete>/files/datastore/` como binario `.preferences_pb`.

**Riesgo:** aunque el formato es binario (no XML legible), **los datos siguen sin cifrado en disco**. El binario puede descodificarse con herramientas estándar de Protocol Buffers.

**Ventaja sobre SharedPreferences:**
- Acceso no bloqueante (no bloquea el hilo UI)
- Lecturas consistentes (sin race conditions de `apply()`)
- API reactiva apta para arquitecturas modernas (MVVM, MVI)

**Uso apropiado:**
- Configuración de usuario que requiere consistencia fuerte
- Estado persistente de la app que no es secreto

**Nunca usar para:** credenciales, tokens de sesión, datos médicos o financieros.

---

### EncryptedSharedPreferences — Datos sensibles y credenciales

**Mecanismo:** Implementado en `androidx.security:security-crypto`. Internamente:

1. **MasterKey** — generada y almacenada en el **Android Keystore** (enclave de hardware en dispositivos modernos). La clave maestra **nunca sale del Keystore** en texto claro.
2. **Cifrado de llaves** — `AES256_SIV` (determinístico, necesario para búsquedas por clave).
3. **Cifrado de valores** — `AES256_GCM` (autenticado, proporciona confidencialidad + integridad).

**Por qué es seguro:** aunque un atacante extraiga el archivo de disco, obtiene solo texto cifrado. Sin la MasterKey (que vive en el Keystore hardware), el descifrado es computacionalmente inviable.

**Uso obligatorio para:**

| Dato | Justificación |
|---|---|
| Tokens JWT / OAuth | Credencial de sesión; su robo equivale a robo de identidad |
| Contraseñas cacheadas | Dato secreto primario del usuario |
| Claves de API | Acceso a servicios externos con costo o datos privados |
| Tokens de renovación (refresh tokens) | Vida larga -> mayor ventana de ataque si se filtran |
| Datos biométricos derivados | Regulación (GDPR, LGPD) exige protección de datos personales sensibles |

---

## Evaluación — Rúbrica cubierta

| Criterio | Implementación | Peso |
|---|---|---|
| GET y PUT con loading states que deshabilitan widgets | `RedScreen.tsx` — reducer `idle/loading/success/error` | 30 % |
| Tres mecanismos via puente nativo Kotlin reales | `SecureStorageModule.kt` — SP / DataStore / EncryptedPrefs | 30 % |
| Reactividad sin caídas | Hooks + reducer; errores siempre capturados con try/catch | 20 % |
| README con justificación técnica | Esta sección | 20 % |
