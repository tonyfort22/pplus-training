import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createLocalWhisperTranscriber,
  createWorkoutTrainingVoiceTranscript,
  getWorkoutTrainingVoiceTranscriber,
} from '../apps/web/lib/admin/workout-training-ai-voice.js'

function createAudioFile(overrides = {}) {
  return {
    name: overrides.name ?? 'voice.webm',
    type: overrides.type ?? 'audio/webm',
    size: overrides.size ?? 1024,
    arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
  }
}

test('voice transcript requires an uploaded audio file', async () => {
  const result = await createWorkoutTrainingVoiceTranscript({ audioFile: null })

  assert.equal(result.ok, false)
  assert.equal(result.status, 400)
  assert.equal(result.error, 'Audio file is required.')
})

test('voice transcript rejects unsupported audio file types', async () => {
  const result = await createWorkoutTrainingVoiceTranscript({ audioFile: createAudioFile({ type: 'text/plain' }) })

  assert.equal(result.ok, false)
  assert.equal(result.status, 415)
  assert.equal(result.error, 'Unsupported audio type. Use webm, mp4, mpeg, wav, or ogg audio.')
})

test('voice transcript rejects oversized audio uploads', async () => {
  const result = await createWorkoutTrainingVoiceTranscript({ audioFile: createAudioFile({ size: 12 * 1024 * 1024 }) })

  assert.equal(result.ok, false)
  assert.equal(result.status, 413)
  assert.equal(result.error, 'Audio file is too large. Keep recordings under 10 MB.')
})

test('voice transcript is provider-gated instead of faking text', async () => {
  const result = await createWorkoutTrainingVoiceTranscript({ audioFile: createAudioFile() })

  assert.equal(result.ok, false)
  assert.equal(result.status, 501)
  assert.equal(result.error, 'Voice transcription is not configured yet.')
})

test('voice transcript returns provider transcript when a transcriber is configured', async () => {
  const result = await createWorkoutTrainingVoiceTranscript({
    audioFile: createAudioFile(),
    transcribeAudio: async ({ audioFile }) => ({ transcript: `Delete warmup section from ${audioFile.name}` }),
  })

  assert.equal(result.ok, true)
  assert.equal(result.status, 200)
  assert.equal(result.transcript, 'Delete warmup section from voice.webm')
})

test('voice provider is disabled unless local whisper env is complete', () => {
  assert.equal(getWorkoutTrainingVoiceTranscriber({ env: {} }), undefined)
  assert.equal(getWorkoutTrainingVoiceTranscriber({ env: { PPLUS_VOICE_TRANSCRIPTION_PROVIDER: 'local-whisper' } }), undefined)
  assert.equal(getWorkoutTrainingVoiceTranscriber({
    env: {
      PPLUS_VOICE_TRANSCRIPTION_PROVIDER: 'local-whisper',
      PPLUS_WHISPER_BINARY: '/usr/local/bin/whisper-cli',
      PPLUS_WHISPER_MODEL: '/models/ggml-base.en.bin',
    },
  }) instanceof Function, true)
})

test('local whisper transcriber converts audio, runs whisper-cli, reads transcript, and cleans temp files', async () => {
  const calls = []
  const removedPaths = []
  const writtenFiles = new Map()

  const transcriber = createLocalWhisperTranscriber({
    whisperBinary: '/opt/whisper/whisper-cli',
    whisperModel: '/models/ggml-base.en.bin',
    ffmpegBinary: '/opt/homebrew/bin/ffmpeg',
    createTempDir: async () => '/tmp/pplus-voice-123',
    writeFile: async (path, value) => writtenFiles.set(path, value),
    readFile: async (path, encoding) => {
      assert.equal(path, '/tmp/pplus-voice-123/transcript.txt')
      assert.equal(encoding, 'utf8')
      return ' delete warmup section \n'
    },
    removePath: async (path, options) => removedPaths.push({ path, options }),
    runCommand: async (binary, args) => calls.push({ binary, args }),
  })

  const result = await transcriber({ audioFile: createAudioFile() })

  assert.equal(result.transcript, 'delete warmup section')
  assert.deepEqual(calls, [
    {
      binary: '/opt/homebrew/bin/ffmpeg',
      args: ['-y', '-i', '/tmp/pplus-voice-123/input-source.webm', '-ar', '16000', '-ac', '1', '/tmp/pplus-voice-123/input.wav'],
    },
    {
      binary: '/opt/whisper/whisper-cli',
      args: ['-m', '/models/ggml-base.en.bin', '-f', '/tmp/pplus-voice-123/input.wav', '-otxt', '-of', '/tmp/pplus-voice-123/transcript'],
    },
  ])
  assert.equal(writtenFiles.has('/tmp/pplus-voice-123/input-source.webm'), true)
  assert.deepEqual(removedPaths, [{ path: '/tmp/pplus-voice-123', options: { recursive: true, force: true } }])
})

test('local whisper transcriber never uses the same wav path for ffmpeg input and output', async () => {
  const calls = []

  const transcriber = createLocalWhisperTranscriber({
    whisperBinary: '/opt/whisper/whisper-cli',
    whisperModel: '/models/ggml-base.en.bin',
    createTempDir: async () => '/tmp/pplus-voice-wav',
    writeFile: async () => {},
    readFile: async () => 'transcribed wav',
    removePath: async () => {},
    runCommand: async (binary, args) => calls.push({ binary, args }),
  })

  await transcriber({ audioFile: createAudioFile({ name: 'voice.wav', type: 'audio/wav' }) })

  assert.deepEqual(calls[0].args, ['-y', '-i', '/tmp/pplus-voice-wav/input-source.wav', '-ar', '16000', '-ac', '1', '/tmp/pplus-voice-wav/input.wav'])
})
