package com.nexuswavetech.nexusplus

import org.junit.Assert.assertFalse
import org.junit.Test

class NexusVpnProtectionConfigTest {
    @Test
    fun onlyDnsHandlingMayInterfere() {
        assert(NexusVpnProtectionConfig.mayInterfere(NexusVpnTrafficDecision.Action.HANDLE_DNS))
        assertFalse(NexusVpnProtectionConfig.mayInterfere(NexusVpnTrafficDecision.Action.FORWARD_TCP))
        assertFalse(NexusVpnProtectionConfig.mayInterfere(NexusVpnTrafficDecision.Action.FORWARD_UDP))
        assertFalse(NexusVpnProtectionConfig.mayInterfere(NexusVpnTrafficDecision.Action.IGNORE_OTHER_IPV4))
        assertFalse(NexusVpnProtectionConfig.mayInterfere(NexusVpnTrafficDecision.Action.DROP_INVALID))
    }
}
