package com.redyseguridad.securestorage

import android.content.Context
import android.content.SharedPreferences
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.io.File

/**
 * PUENTE NATIVO: SecureStorageModule
 *
 * Este módulo expone tres mecanismos de persistencia de Android a JavaScript
 * a través del Bridge de React Native. Cada método lleva la anotación
 * @ReactMethod para que RN lo registre y lo haga accesible desde JS via
 * NativeModules.SecureStorageModule.
 *
 * CRUCE JS → KOTLIN: RN serializa los argumentos JS y los inyecta aquí.
 * CRUCE KOTLIN → JS: la Promise se resuelve/rechaza desde cualquier hilo;
 *   RN se encarga de despachar el resultado de vuelta al hilo JS.
 */
class SecureStorageModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    // Scope para todas las corrutinas de DataStore (no bloquea el hilo principal)
    private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // DataStore de Preferences — inicialización perezosa, instancia única
    private val dataStore: DataStore<Preferences> by lazy {
        PreferenceDataStoreFactory.create {
            File(reactContext.filesDir, "datastore/rny_datastore.preferences_pb")
        }
    }

    // EncryptedSharedPreferences con MasterKey AES-256-GCM
    private val encryptedPrefs: SharedPreferences by lazy {
        val masterKey = MasterKey.Builder(reactContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            reactContext,
            "rny_encrypted_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    // Nombre que usa RN para identificar este módulo en NativeModules
    override fun getName(): String = "SecureStorageModule"

    /**
     * PUENTE: guardarSecreto
     *
     * JS llama a: NativeModules.SecureStorageModule.guardarSecreto(llave, valor, compartimento)
     * Kotlin recibe los argumentos, ejecuta la operación nativa y resuelve la Promise.
     *
     * @param llave        Clave bajo la que se persiste el valor
     * @param valor        Datos a almacenar
     * @param compartimento "SHARED_PREFERENCES" | "DATASTORE" | "ENCRYPTED"
     * @param promise      Canal de respuesta hacia JavaScript
     */
    @ReactMethod
    fun guardarSecreto(llave: String, valor: String, compartimento: String, promise: Promise) {
        when (compartimento) {

            // ── SharedPreferences: almacenamiento plano en XML (SIN cifrado) ──
            // Demostración del riesgo: el valor queda legible en disco.
            "SHARED_PREFERENCES" -> {
                try {
                    val prefs: SharedPreferences =
                        reactContext.getSharedPreferences("rny_shared", Context.MODE_PRIVATE)
                    prefs.edit().putString(llave, valor).apply()
                    promise.resolve(true)
                } catch (e: Exception) {
                    promise.reject("SP_WRITE_ERROR", e.message ?: "Error en SharedPreferences")
                }
            }

            // ── DataStore (Preferences): acceso reactivo con Coroutines/Flow ──
            // La operación corre en Dispatchers.IO para no bloquear el hilo principal.
            "DATASTORE" -> {
                moduleScope.launch {
                    try {
                        dataStore.edit { prefs ->
                            prefs[stringPreferencesKey(llave)] = valor
                        }
                        // Resuelve la Promise desde la corrutina; RN lo despacha a JS
                        promise.resolve(true)
                    } catch (e: Exception) {
                        promise.reject("DS_WRITE_ERROR", e.message ?: "Error en DataStore")
                    }
                }
            }

            // ── EncryptedSharedPreferences: cifrado AES-256 sobre disco ──
            // La llave se cifra con AES-256-SIV y el valor con AES-256-GCM.
            "ENCRYPTED" -> {
                try {
                    encryptedPrefs.edit().putString(llave, valor).apply()
                    promise.resolve(true)
                } catch (e: Exception) {
                    promise.reject("ESP_WRITE_ERROR", e.message ?: "Error en EncryptedSharedPreferences")
                }
            }

            else -> promise.reject("UNKNOWN_COMPARTMENT", "Compartimento desconocido: $compartimento")
        }
    }

    /**
     * PUENTE: recuperarSecreto
     *
     * JS llama a: NativeModules.SecureStorageModule.recuperarSecreto(llave, compartimento)
     * Devuelve el valor como String, o null si la clave no existe.
     *
     * @param llave        Clave a buscar
     * @param compartimento "SHARED_PREFERENCES" | "DATASTORE" | "ENCRYPTED"
     * @param promise      Canal de respuesta hacia JavaScript
     */
    @ReactMethod
    fun recuperarSecreto(llave: String, compartimento: String, promise: Promise) {
        when (compartimento) {

            "SHARED_PREFERENCES" -> {
                try {
                    val prefs: SharedPreferences =
                        reactContext.getSharedPreferences("rny_shared", Context.MODE_PRIVATE)
                    val valor = prefs.getString(llave, null)
                    promise.resolve(valor)
                } catch (e: Exception) {
                    promise.reject("SP_READ_ERROR", e.message ?: "Error en SharedPreferences")
                }
            }

            "DATASTORE" -> {
                moduleScope.launch {
                    try {
                        // .first() recoge la primera emisión del Flow y se suspende
                        val snapshot = dataStore.data.first()
                        val valor = snapshot[stringPreferencesKey(llave)]
                        promise.resolve(valor)
                    } catch (e: Exception) {
                        promise.reject("DS_READ_ERROR", e.message ?: "Error en DataStore")
                    }
                }
            }

            "ENCRYPTED" -> {
                try {
                    val valor = encryptedPrefs.getString(llave, null)
                    promise.resolve(valor)
                } catch (e: Exception) {
                    promise.reject("ESP_READ_ERROR", e.message ?: "Error en EncryptedSharedPreferences")
                }
            }

            else -> promise.reject("UNKNOWN_COMPARTMENT", "Compartimento desconocido: $compartimento")
        }
    }
}
