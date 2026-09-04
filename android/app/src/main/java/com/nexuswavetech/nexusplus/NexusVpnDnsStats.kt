package com.nexuswavetech.nexusplus

/** Per-session DNS classification counters kept separate from packet-health counters. */
object NexusVpnDnsStats {
    @Volatile private var blocked: Long = 0
    @Volatile private var forwarded: Long = 0
    @Volatile private var failed: Long = 0

    @Synchronized fun recordBlocked() { blocked += 1 }
    @Synchronized fun recordForwarded() { forwarded += 1 }
    @Synchronized fun recordFailed() { failed += 1 }

    @Synchronized fun snapshot(): Map<String, Long> = mapOf(
        "blocked" to blocked,
        "forwarded" to forwarded,
        "failed" to failed,
    )

    @Synchronized fun reset() {
        blocked = 0
        forwarded = 0
        failed = 0
    }
}
