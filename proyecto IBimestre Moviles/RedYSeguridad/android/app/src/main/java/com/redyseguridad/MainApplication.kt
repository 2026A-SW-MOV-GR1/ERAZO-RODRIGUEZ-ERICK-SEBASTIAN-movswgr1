package com.redyseguridad

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
// PUENTE NATIVO: importamos el package del módulo de almacenamiento seguro
import com.redyseguridad.securestorage.SecureStoragePackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // PUENTE NATIVO: registramos SecureStoragePackage para que RN
          // incluya SecureStorageModule en el Bridge al arrancar la app.
          add(SecureStoragePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
