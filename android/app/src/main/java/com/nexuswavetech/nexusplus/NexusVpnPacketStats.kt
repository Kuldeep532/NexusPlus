package com.nexuswavetech.nexusplus

import java.util.concurrent.atomic.AtomicLong

/** Lightweight process-local counters for VPN health diagnostics. */
object NexusVpnPacketStats {
    private val packetsIn = AtomicLong(0)
    private val packetsOut = AtomicLong(0)
    private val dnsBlocked = AtomicLong(0)
    private val dnsForwarded = AtomicLong(0)
    private val dnsFailed = AtomicLong(0)
    private val nonDns = AtomicLong(0)
    private val dropped = AtomicLong(0)

    fun recordIn() { packetsIn.incrementAndGet() }
    fun recordOut() { packetsOut.incrementAndGet() }
    fun recordDnsBlocked() { dnsBlocked.incrementAndGet() }
    fun recordDnsForwarded() { dnsForwarded.incrementAndGet() }
    fun recordDnsFailed() { dnsFailed.incrementAndGet() }
    fun recordNonDns() { nonDns.incrementAndGet() }
    fun recordDropped() { dropped.incrementAndGet() }

    fun snapshot(): Map<String, Long> = mapOf(
        "packetsIn" to packetsIn.get(),
        "packetsOut" to packetsOut.get(),
        "dnsBlocked" to dnsBlocked.get(),
        "dnsForwarded" to dnsForwarded.get(),
        "dnsFailed" to dnsFailed.get(),
        "nonDns" to nonDns.get(),
        "dropped" to dropped.get(),
    )

    fun reset() {
        packetsIn.set(0)
        packetsOut.set(0)
        dnsBlocked.set(0)
        dnsForwarded.set(0)
        dnsFailed.set(0)
        nonDns.set(0)
        dropped.set(0)
    }
}
