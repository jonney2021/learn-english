# Lesson audio

All 12 dialogues and 12 phrase examples are pre-rendered US-English neural audio. They are synthetic, not human recordings. The files are shipped with the static website; no speech API, account, API key, or browser voice pack is required for playback.

- Engine: Kokoro-82M v1.0, via kokoro-onnx 0.6.1.
- Voices: af_heart for the learner and standalone phrases; am_michael for the other role.
- Generate each turn separately at speed 1.0; insert a 280 ms turn gap. Sentence and clause gaps are 180 ms and 80 ms respectively. Keep the original dialogue wording.
- Normalize to -18 LUFS / -2 dBTP; MP3, 96 kbps. Browser speed controls preserve pitch.
- `manifest.json` records exact source text, voice choices, durations and MP3 SHA-256 checksums. Tests reject missing or stale assets.
- Model weights are Apache 2.0; runtime code is MIT. See MODEL-LICENSE.txt and RUNTIME-LICENSE.txt. We distribute generated audio, not the model weights or runtime.

## Regenerate after changing lesson text

Only content maintainers need Python 3.12+, ffmpeg, and the generation dependencies. The app itself remains dependency-free.

```sh
python3 -m venv /tmp/northstar-tts
/tmp/northstar-tts/bin/pip install kokoro-onnx==0.6.1 soundfile==0.14.0
mkdir -p /tmp/northstar-model
curl -fL https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx -o /tmp/northstar-model/kokoro-v1.0.onnx
curl -fL https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin -o /tmp/northstar-model/voices-v1.0.bin
printf '%s\n' '7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5  /tmp/northstar-model/kokoro-v1.0.onnx' 'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d  /tmp/northstar-model/voices-v1.0.bin' | sha256sum -c -
/tmp/northstar-tts/bin/python scripts/generate-audio.py --model /tmp/northstar-model/kokoro-v1.0.onnx --voices /tmp/northstar-model/voices-v1.0.bin
npm test
```

The checksums pin the exact upstream artifacts used for this library; keep TLS and checksum verification enabled. Review and listen to generated audio before publishing content changes. New dynamic text requires new assets. Playback failures are surfaced to the learner instead of silently reverting to device speech synthesis.
