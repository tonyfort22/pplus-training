import { access, mkdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

function createProviderError(message, status = 500) {
  const error = new Error(message)
  error.status = status
  return error
}

async function assertExecutable(command, label) {
  try {
    await execFileAsync('/usr/bin/env', ['which', command], { timeout: 5000 })
  } catch {
    throw createProviderError(`${label} is not installed or not available on PATH.`, 503)
  }
}

async function assertParentDirectory(path) {
  const parent = path.split('/').slice(0, -1).join('/') || '.'
  await mkdir(parent, { recursive: true })
}

async function assertFileReadable(path, label) {
  try {
    await access(path, constants.R_OK)
  } catch {
    throw createProviderError(`${label} was not created.`, 500)
  }
}

async function run(command, args, options = {}) {
  try {
    const result = await execFileAsync(command, args, {
      timeout: options.timeout ?? 120000,
      maxBuffer: options.maxBuffer ?? 1024 * 1024 * 20,
    })
    return result.stdout
  } catch (error) {
    const detail = String(error?.stderr || error?.stdout || error?.message || '').trim()
    throw createProviderError(detail || `${command} failed.`, error?.status || 500)
  }
}

export function createYoutubeMediaProvider() {
  return {
    async assertReady() {
      await assertExecutable('yt-dlp', 'yt-dlp')
      await assertExecutable('ffmpeg', 'ffmpeg')
      await assertExecutable('ffprobe', 'ffprobe')
    },

    async getVideoMetadata({ youtubeUrl }) {
      await this.assertReady()
      const raw = await run('yt-dlp', ['--dump-json', '--no-playlist', youtubeUrl], {
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 10,
      })
      const metadata = JSON.parse(raw)
      return {
        title: metadata?.title || 'youtube-exercise-video',
        duration: Number(metadata?.duration || 0),
        id: metadata?.id || '',
      }
    },

    async downloadYoutubeVideo({ youtubeUrl, outputPath }) {
      await this.assertReady()
      await assertParentDirectory(outputPath)
      await run('yt-dlp', [
        '--no-playlist',
        '--format',
        'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best',
        '--merge-output-format',
        'mp4',
        '--output',
        outputPath,
        youtubeUrl,
      ], {
        timeout: 300000,
        maxBuffer: 1024 * 1024 * 20,
      })
      await assertFileReadable(outputPath, 'Downloaded MP4')
      return outputPath
    },

    async getVideoDuration({ videoPath }) {
      await this.assertReady()
      const raw = await run('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        videoPath,
      ], { timeout: 30000 })
      const duration = Number.parseFloat(String(raw).trim())
      if (!Number.isFinite(duration) || duration <= 0) {
        throw createProviderError('Could not determine generated video duration.', 500)
      }
      return duration
    },

    async extractMidpointThumbnail({ videoPath, outputPath, duration }) {
      await this.assertReady()
      await assertParentDirectory(outputPath)
      const midpointSeconds = Math.max(0.1, Number(duration) / 2)
      await run('ffmpeg', [
        '-y',
        '-ss',
        String(midpointSeconds),
        '-i',
        videoPath,
        '-frames:v',
        '1',
        '-q:v',
        '2',
        outputPath,
      ], {
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 20,
      })
      await assertFileReadable(outputPath, 'Midpoint thumbnail')
      return outputPath
    },
  }
}
