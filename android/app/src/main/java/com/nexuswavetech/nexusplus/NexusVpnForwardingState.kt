package com.nexuswavetech.nexusplus

import java.util.concurrent.atomic.AtomicBoolean

/**
 * Runtime capability gate for non-DNS forwarding.
 *
 * The VPN must never advertise or install a full-device route unless the
 * protocol-correct forwarding engine has explicitly marked itself ready.
 */
object NexusVpnForwardingState {
    private val ready = AtomicBoolean(false)

    fun isReady(): Boolean = ready.get()

    fun setReady(value: Boolean) {
        ready.set(value)
    }
}
