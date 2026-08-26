package com.nexuswavetech.nexusplus

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

/**
 * Authentication is handled entirely by the TypeScript Supabase web-auth
 * adapter. This native module remains only as a compatibility boundary for
 * older generated builds and performs no Google/Firebase authentication.
 */
class NexusAuthModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NexusAuth"
}
