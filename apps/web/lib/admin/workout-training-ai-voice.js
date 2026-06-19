import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const MAX_AUDIO_BYTES = 10 * 1024 * 1024
const SUPPORTED_AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
])

function toSafeString(value) {
  return typeof value === 'string' ? value : ''
}

function getAudioType(audioFile) {
  return toSafeString(audioFile?.type).toLowerCase()
}

function getAudioSize(audioFile) {
  return Number.isFinite(audioFile?.size) ? audioFile.size : 0
}

function getInputExtension(audioFile) {
  const audioType = getAudioType(audioFile)

  if (audioType.includes('mp4')) return 'mp4'
  if (audioType.includes('mpeg') || audioType.includes('mp3')) return 'mp3'
  if (audioType.includes('wav')) return 'wav'
  if (audioType.includes('ogg')) return 'ogg'
  return 'webm'
}

async function defaultRunCommand(binary, args) {
  await execFileAsync(binary, args, { timeout: 60_000 })
}

export function validateWorkoutTrainingVoiceAudio(audioFile) {
  if (!audioFile) {
    return { valid: false, status: 400, error: 'Audio file is required.' }
  }

  const audioType = getAudioType(audioFile)
  if (!SUPPORTED_AUDIO_TYPES.has(audioType)) {
    return { valid: false, status: 415, error: 'Unsupported audio type. Use webm, mp4, mpeg, wav, or ogg audio.' }
  }

  if (getAudioSize(audioFile) > MAX_AUDIO_BYTES) {
    return { valid: false, status: 413, error: 'Audio file is too large. Keep recordings under 10 MB.' }
  }

  return { valid: true, status: 200, error: '' }
}

export function createLocalWhisperTranscriber({
  whisperBinary,
  whisperModel,
  ffmpegBinary = 'ffmpeg',
  createTempDir = () => mkdtemp(join(tmpdir(), 'pplus-workout-voice-')),
  runCommand = defaultRunCommand,
  writeFile: writeTempFile = writeFile,
  readFile: readTempFile = readFile,
  removePath = rm,
} = {}) {
  const safeWhisperBinary = toSafeString(whisperBinary).trim()
  const safeWhisperModel = toSafeString(whisperModel).trim()
  const safeFfmpegBinary = toSafeString(ffmpegBinary).trim() || 'ffmpeg'

  if (!safeWhisperBinary || !safeWhisperModel) return undefined

  return async function transcribeWithLocalWhisper({ audioFile }) {
    const tempDir = await createTempDir()
    const inputPath = join(tempDir, `input-source.${getInputExtension(audioFile)}`)
    const wavPath = join(tempDir, 'input.wav')
    const transcriptBasePath = join(tempDir, 'transcript')
    const transcriptPath = `${transcriptBasePath}.txt`

    try {
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
      await writeTempFile(inputPath, audioBuffer)
      await runCommand(safeFfmpegBinary, ['-y', '-i', inputPath, '-ar', '16000', '-ac', '1', wavPath])
      await runCommand(safeWhisperBinary, ['-m', safeWhisperModel, '-f', wavPath, '-otxt', '-of', transcriptBasePath])

      return {
        transcript: toSafeString(await readTempFile(transcriptPath, 'utf8')).trim(),
      }
    } finally {
      await removePath(tempDir, { recursive: true, force: true })
    }
  }
}

export function getWorkoutTrainingVoiceTranscriber({ env = process.env } = {}) {
  if (toSafeString(env.PPLUS_VOICE_TRANSCRIPTION_PROVIDER).trim() !== 'local-whisper') {
    return undefined
  }

  return createLocalWhisperTranscriber({
    whisperBinary: env.PPLUS_WHISPER_BINARY,
    whisperModel: env.PPLUS_WHISPER_MODEL,
    ffmpegBinary: env.PPLUS_FFMPEG_BINARY || 'ffmpeg',
  })
}

export async function createWorkoutTrainingVoiceTranscript({ audioFile, transcribeAudio } = {}) {
  const validation = validateWorkoutTrainingVoiceAudio(audioFile)

  if (!validation.valid) {
    return {
      ok: false,
      status: validation.status,
      error: validation.error,
    }
  }

  if (typeof transcribeAudio !== 'function') {
    return {
      ok: false,
      status: 501,
      error: 'Voice transcription is not configured yet.',
    }
  }

  const result = await transcribeAudio({ audioFile })
  const transcript = toSafeString(result?.transcript).trim()

  if (!transcript) {
    return {
      ok: false,
      status: 502,
      error: 'Voice transcription returned an empty transcript.',
    }
  }

  return {
    ok: true,
    status: 200,
    transcript,
  }
}
