package com.examenib.erickerazo

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    /**
     * Nombre del componente registrado en index.js con AppRegistry.registerComponent().
     * Debe coincidir EXACTAMENTE con el campo "name" en app.json.
     */
    override fun getMainComponentName(): String = "ExamenIB_ErickErazo_GR1SW"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
