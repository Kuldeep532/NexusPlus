package expo.modules.audioeditornative.shared

/** Timeline range shared by trim, overlay, effects, join and future audio tools. */
data class AudioEditRange(val startMs: Double, val endMs: Double) {
  init {
    require(startMs.isFinite() && endMs.isFinite()) { "Audio range values must be finite." }
    require(startMs >= 0.0) { "Audio range start must be non-negative." }
    require(endMs > startMs) { "Audio range end must be greater than start." }
  }

  val durationMs: Double
    get() = endMs - startMs

  fun requireWithin(durationMs: Double) {
    require(durationMs.isFinite() && durationMs >= 0.0) { "Audio duration is invalid." }
    require(endMs <= durationMs) { "Audio range exceeds source duration." }
  }
}
