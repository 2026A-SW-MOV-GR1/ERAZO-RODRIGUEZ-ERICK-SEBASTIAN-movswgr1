package com.redyseguridad.securestorage

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * SecureStoragePackage registra el módulo nativo en el runtime de React Native.
 * RN llama a createNativeModules() durante la inicialización para construir
 * la lista de módulos disponibles en el Bridge.
 */
class SecureStoragePackage : ReactPackage {

    // Devuelve la lista de módulos nativos que este package expone al Bridge
    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(SecureStorageModule(reactContext))

    // Sin vistas nativas personalizadas en este módulo
    @Suppress("OVERRIDE_DEPRECATION")
    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> = emptyList()
}
