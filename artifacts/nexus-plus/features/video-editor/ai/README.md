# Video Editor AI Stack

The AI layer is designed to avoid mandatory cloud inference and heavyweight hosted APIs.

## Initial public components

- `whisper.cpp` (MIT): on-device speech recognition for auto captions, transcript generation, silence-aware speech segmentation, smart-cut suggestions, and local highlight scoring.
- MediaPipe Face Detector: on-device face detection for face blur and auto-reframe workflows.
- OpenCV-style frame analysis: deterministic scene-change detection using frame differences/histograms.
- Optional small quantized translation models: subtitle translation can use a locally bundled/downloaded OPUS-MT/Marian model through a native runtime.

## Model policy

1. Prefer tiny/base quantized models on supported Android devices.
2. Keep models optional and downloadable so the APK is not unnecessarily large.
3. Never require a cloud API for the core editing workflow.
4. Run inference off the UI thread and surface progress/cancellation.
5. Keep the model adapter separate from video-processing operations.

## Planned AI workflows

- Auto captions: Whisper transcript -> timestamped subtitle segments -> editable subtitle track.
- Smart cut: transcript + VAD + configurable filler/pause rules -> suggested timeline cuts.
- Scene detection: frame analysis -> cut markers -> optional automatic clip splitting.
- Face blur: detector -> tracked regions -> native blur/mosaic render operation.
- Auto reframe: face center tracking -> animated crop/keyframes for social aspect ratios.
- Highlight finder: transcript segments scored using local heuristics; no hosted LLM required.
- Subtitle translation: local translation model, optional due to model size.
