'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Check, CircleCheckBig, LoaderCircle, Mic, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'

export default function WorkoutTrainingAiEditor({
  open,
  onOpenChange,
  workoutDetails,
  trainingSections,
  onApplyTrainingSections,
}) {
  const [instruction, setInstruction] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [voiceIconState, setVoiceIconState] = useState('idle')
  const [voiceWaveLevels, setVoiceWaveLevels] = useState([0.35, 0.55, 0.85, 0.5, 0.75])
  const [voiceWavePhase, setVoiceWavePhase] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [voiceMessage, setVoiceMessage] = useState('')
  const [proposedEdit, setProposedEdit] = useState(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const mediaStreamRef = useRef(null)
  const voiceConfirmationTimeoutRef = useRef(null)
  const audioContextRef = useRef(null)
  const audioAnalyserRef = useRef(null)
  const voiceWaveFrameRef = useRef(null)
  const shouldDiscardRecordingRef = useRef(false)

  useEffect(() => {
    if (!open) {
      setInstruction('')
      setIsGenerating(false)
      setIsRecording(false)
      setIsTranscribing(false)
      setVoiceIconState('idle')
      setErrorMessage('')
      setVoiceMessage('')
      setProposedEdit(null)
      if (voiceConfirmationTimeoutRef.current) clearTimeout(voiceConfirmationTimeoutRef.current)
      stopVoiceWave()
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaRecorderRef.current = null
      mediaStreamRef.current = null
      audioChunksRef.current = []
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (voiceConfirmationTimeoutRef.current) clearTimeout(voiceConfirmationTimeoutRef.current)
      stopVoiceWave()
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function startVoiceWave(stream) {
    stopVoiceWave()

    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextConstructor) return

    try {
      const audioContext = new AudioContextConstructor()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioContextRef.current = audioContext
      audioAnalyserRef.current = analyser

      const frequencyData = new Uint8Array(analyser.frequencyBinCount)

      function updateVoiceWave() {
        analyser.getByteFrequencyData(frequencyData)
        const bucketSize = Math.max(1, Math.floor(frequencyData.length / 5))
        const nextLevels = Array.from({ length: 5 }, (_, index) => {
          const bucket = frequencyData.slice(index * bucketSize, (index + 1) * bucketSize)
          const average = bucket.reduce((sum, value) => sum + value, 0) / bucket.length
          return Math.max(0.35, Math.min(1, average / 95))
        })

        setVoiceWaveLevels(nextLevels)
        setVoiceWavePhase(performance.now() / 160)
        voiceWaveFrameRef.current = requestAnimationFrame(updateVoiceWave)
      }

      updateVoiceWave()
    } catch (error) {
      setVoiceWaveLevels([0.35, 0.55, 0.85, 0.5, 0.75])
    }
  }

  function stopVoiceWave() {
    if (voiceWaveFrameRef.current) {
      cancelAnimationFrame(voiceWaveFrameRef.current)
      voiceWaveFrameRef.current = null
    }

    audioAnalyserRef.current = null
    audioContextRef.current?.close?.()
    audioContextRef.current = null
    setVoiceWaveLevels([0.35, 0.55, 0.85, 0.5, 0.75])
  }

  function showVoiceConfirmed() {
    if (voiceConfirmationTimeoutRef.current) clearTimeout(voiceConfirmationTimeoutRef.current)
    setVoiceIconState('confirmed')
    voiceConfirmationTimeoutRef.current = setTimeout(() => setVoiceIconState('idle'), 1500)
  }

  async function transcribeAudio(audioBlob) {
    setIsTranscribing(true)
    setVoiceMessage('')
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'workout-ai-voice.webm')

      const response = await fetch('/api/admin/workout-training-ai-transcribe', {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json()

      if (!response.ok) {
        if (payload?.error === 'Voice transcription is not configured yet.') {
          setVoiceMessage('Voice transcription is not configured yet. Type the instruction instead.')
          return
        }

        throw new Error(payload?.error || 'Unable to transcribe voice instruction.')
      }

      if (payload?.transcript) {
        setInstruction((currentInstruction) => currentInstruction.trim() ? `${currentInstruction.trim()} ${payload.transcript}` : payload.transcript)
        setVoiceMessage('Voice transcript added. Review it before applying changes.')
        showVoiceConfirmed()
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to transcribe voice instruction.')
    } finally {
      setIsTranscribing(false)
    }
  }

  async function startRecording() {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setVoiceMessage('Voice recording is not supported in this browser. Type the instruction instead.')
      return
    }

    try {
      setErrorMessage('')
      setVoiceMessage('Listening...')
      setVoiceIconState('idle')
      audioChunksRef.current = []
      shouldDiscardRecordingRef.current = false
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      startVoiceWave(stream)
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stopVoiceWave()
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        mediaRecorderRef.current = null
        audioChunksRef.current = []
        if (shouldDiscardRecordingRef.current) {
          shouldDiscardRecordingRef.current = false
          return
        }
        if (audioBlob.size > 0) void transcribeAudio(audioBlob)
      }

      recorder.start()
      setIsRecording(true)
    } catch (error) {
      setVoiceMessage('Microphone access was not available. Type the instruction instead.')
      setIsRecording(false)
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    stopVoiceWave()
    setIsRecording(false)
    setVoiceMessage('Transcribing voice instruction...')
  }

  function cancelRecording() {
    shouldDiscardRecordingRef.current = true
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    stopVoiceWave()
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    setIsRecording(false)
    setVoiceMessage('Voice recording cancelled.')
  }

  async function generateEdits() {
    setIsGenerating(true)
    setErrorMessage('')
    setProposedEdit(null)

    try {
      const response = await fetch('/api/admin/workout-training-ai-edits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction,
          trainingSections,
          workoutContext: workoutDetails,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to generate workout edits.')
      }

      setProposedEdit(payload)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to generate workout edits.')
    } finally {
      setIsGenerating(false)
    }
  }

  function applyEdits() {
    if (!proposedEdit?.nextTrainingSections) return
    onApplyTrainingSections(proposedEdit.nextTrainingSections)
    setProposedEdit(null)
    onOpenChange(false)
  }

  const primaryAiButtonClassName = "!border !border-[#38E0AF] bg-[#003F1D] text-[#38E0AF] shadow-none backdrop-blur-sm hover:!border-[#38E0AF] hover:bg-[#003F1D] hover:text-[#38E0AF] disabled:opacity-60"
  const voiceButtonClassName = `min-h-[40px] min-w-10 rounded-[12px] ${primaryAiButtonClassName} disabled:opacity-100`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] sm:max-w-[620px]">
        <DialogHeader>
          <div className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--admin-shell-primary-green-light-bg)] text-[var(--admin-shell-primary-button-bg)]">
            <Bot className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>Edit workout with AI</DialogTitle>
          <DialogDescription>Describe the changes you want to make to this training plan.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="workout-training-ai-instruction" className="text-sm font-medium text-[var(--admin-dashboard-card-text)]">
              Instructions
            </label>
            <InputGroup className="admin-shell-workout-ai-input-group min-h-[172px] items-stretch rounded-[14px] border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] has-disabled:opacity-100 has-disabled:bg-[var(--admin-dashboard-control-bg)] has-[[data-slot=input-group-control]:focus-visible]:border-[var(--admin-shell-accent)] has-[[data-slot=input-group-control]:focus-visible]:ring-0">
              <InputGroupTextarea
                id="workout-training-ai-instruction"
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                placeholder="Example: Add a warmup section before A1"
                className="min-h-[132px] resize-none px-4 pb-16 pt-3 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)]"
              />
              <InputGroupAddon align="block-end" className="absolute bottom-2 right-2 w-auto justify-end gap-2 p-0">
                <InputGroupButton
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={generateEdits}
                  disabled={isGenerating || !instruction.trim()}
                  className={`min-h-[40px] rounded-[12px] px-4 ${primaryAiButtonClassName}`}
                >
                  {isGenerating ? 'Applying...' : 'Apply changes'}
                </InputGroupButton>
                {isRecording ? (
                  <SpotrRecordingControl
                    levels={voiceWaveLevels}
                    phase={voiceWavePhase}
                    onCancel={cancelRecording}
                    onConfirm={stopRecording}
                  />
                ) : (
                  <InputGroupButton
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={startRecording}
                    disabled={isTranscribing}
                    aria-label="Record voice instruction"
                    className={voiceButtonClassName}
                  >
                    {isTranscribing ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : voiceIconState === 'confirmed' ? (
                      <CircleCheckBig className="size-4" aria-hidden="true" />
                    ) : (
                      <Mic className="size-4" aria-hidden="true" />
                    )}
                  </InputGroupButton>
                )}
              </InputGroupAddon>
            </InputGroup>
            {voiceMessage ? (
              <p className="text-xs text-[var(--admin-dashboard-card-muted)]">{voiceMessage}</p>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="rounded-[12px] border border-[var(--admin-shell-primary-red-bg)] bg-[var(--admin-shell-primary-red-light-bg)] px-4 py-3 text-sm text-[var(--admin-shell-primary-red-bg)]">
              {errorMessage}
            </p>
          ) : null}

          {proposedEdit ? (
            <div className="grid gap-3 rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
              <div className="grid gap-1">
                <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Review edits</p>
                <p className="text-sm text-[var(--admin-dashboard-card-muted)]">{proposedEdit.summary}</p>
              </div>
              {proposedEdit.actions?.length ? (
                <div className="grid gap-1 text-xs text-[var(--admin-dashboard-card-muted)]">
                  <p className="font-semibold uppercase tracking-[0.12em] text-[var(--admin-dashboard-card-muted)]">Planned actions</p>
                  <ul className="grid gap-1">
                    {proposedEdit.actions.map((action, actionIndex) => (
                      <li key={`${action.type}-${actionIndex}`}>
                        • {action.type.replaceAll('_', ' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {proposedEdit.warnings?.length ? (
                <ul className="grid gap-1 text-sm text-[var(--admin-dashboard-card-muted)]">
                  {proposedEdit.warnings.map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              ) : null}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" className="rounded-[12px] min-h-[40px]" onClick={() => setProposedEdit(null)}>
                  Revise
                </Button>
                <Button type="button" className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[var(--admin-shell-primary-button-text)] hover:bg-[var(--admin-shell-primary-button-bg)]" onClick={applyEdits}>
                  Apply edits
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="sm:flex-row sm:justify-end gap-3">
          <Button type="button" variant="outline" className="rounded-[12px] min-h-[40px]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const IOS9_WAVE_LAYERS = [
  { scale: 1, phase: 0, opacity: 0.95, width: 2.2 },
  { scale: 0.76, phase: 0.85, opacity: 0.62, width: 1.8 },
  { scale: 0.54, phase: 1.7, opacity: 0.42, width: 1.5 },
]

function SpotrRecordingControl({ levels, phase, onCancel, onConfirm }) {
  return (
    <div className="spotr-voice-recorder flex items-center">
      <div className="flex h-12 items-center gap-3 rounded-[18px] border border-[#38E0AF] bg-[#003F1D] px-3 shadow-none backdrop-blur-sm">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel voice recording"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#38E0AF]/10 text-[#38E0AF] transition hover:bg-[#38E0AF]/20"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <Ios9VoiceWave levels={levels} phase={phase} />
        <button
          type="button"
          onClick={onConfirm}
          aria-label="Confirm voice recording"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#38E0AF]/10 text-[#38E0AF] transition hover:bg-[#38E0AF]/20"
        >
          <Check className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function Ios9VoiceWave({ levels, phase }) {
  const averageLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length
  const amplitude = 8 + averageLevel * 12

  return (
    <svg
      className="size-[auto] h-8 w-[92px] overflow-visible"
      style={{ width: '92px', height: '32px' }}
      viewBox="0 0 120 36"
      fill="none"
      aria-label="Recording voice instruction"
      role="img"
    >
      <defs>
        <linearGradient id="ai-wave-gradient" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38E0AF" />
          <stop offset="52%" stopColor="#2DE2E6" />
          <stop offset="100%" stopColor="#4D7CFE" />
        </linearGradient>
      </defs>
      {IOS9_WAVE_LAYERS.map((layer, index) => {
        const y1 = 18 + Math.sin(phase + layer.phase) * amplitude * layer.scale
        const y2 = 18 - Math.cos(phase * 0.9 + layer.phase) * amplitude * layer.scale
        const y3 = 18 + Math.sin(phase * 1.12 + layer.phase + 1.1) * amplitude * layer.scale
        const y4 = 18 - Math.cos(phase * 0.78 + layer.phase + 0.65) * amplitude * layer.scale

        return (
          <path
            key={`ios9-voice-wave-${index}`}
            d={`M2 18 C16 ${y1.toFixed(2)}, 26 ${y2.toFixed(2)}, 40 18 S64 ${y3.toFixed(2)}, 78 18 S100 ${y4.toFixed(2)}, 118 18`}
            stroke={index === 0 ? 'url(#ai-wave-gradient)' : '#38E0AF'}
            strokeWidth={layer.width}
            strokeLinecap="round"
            opacity={layer.opacity}
            style={{ filter: 'drop-shadow(0 0 6px rgba(56,224,175,0.42))' }}
          />
        )
      })}
    </svg>
  )
}
