import React, { useEffect, useRef, useState } from 'react'
import audioBus from '../lib/audioBus'

// Simple audio analyzer that supports file playback and microphone input.
// Calls `onUpdate` with a small object of summary values (volume, bass, mid, treble, beat)
// at a throttled rate so the rest of the app can react without being flooded.
export default function AudioAnalyzer({ onUpdate, onAudioData }) {
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const audioElementRef = useRef(null)
  const rafRef = useRef(null)
  const lastBeatRef = useRef(0)
  const lastUpdateRef = useRef(0)

  const [mode, setMode] = useState('file') // 'file' or 'mic'
  const [running, setRunning] = useState(false)
  const [sensitivity, setSensitivity] = useState(1.0)
  const [smoothing, setSmoothing] = useState(0.8)
  const [status, setStatus] = useState('idle')
  const [fileURL, setFileURL] = useState(null)
  const canvasRef = useRef(null)
  const prevFreqRef = useRef(null)
  const fluxHistoryRef = useRef([])
  const smoothBandsRef = useRef({ subBass: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0 })
  const tripletSmoothRef = useRef({ low: 0, mid: 0, high: 0 })
  const peaksRef = useRef({ subBass: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0 })
  const [rawFftEnabled, setRawFftEnabled] = useState(false)
  // how often we call the external onUpdate callback (ms). When omitted the
  // analyzer still populates audioBus every frame and notifies subscribers.
  const updateIntervalMs = 200

  useEffect(() => {
    return () => {
      stop()
      if (fileURL?.startsWith('blob:')) URL.revokeObjectURL(fileURL)
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function ensureAudioContext() {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      audioCtxRef.current = new AudioContext()
    }
  }

  function createAnalyser() {
    ensureAudioContext()
    if (!analyserRef.current) {
      analyserRef.current = audioCtxRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
    }
    analyserRef.current.smoothingTimeConstant = smoothing
    return analyserRef.current
  }

  function connectElement(el) {
    disconnectSource()
    const ctx = audioCtxRef.current
    try {
      sourceRef.current = ctx.createMediaElementSource(el)
      const analyser = createAnalyser()
      sourceRef.current.connect(analyser)
      analyser.connect(ctx.destination)
    } catch (e) {
      // some browsers may block cross-origin or disconnected elements
    }
  }

  function disconnectSource() {
    try {
      if (sourceRef.current) sourceRef.current.disconnect()
    } catch (e) {}
    sourceRef.current = null
  }

  async function startMic() {
    try {
      ensureAudioContext()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      const ctx = audioCtxRef.current
      disconnectSource()
      sourceRef.current = ctx.createMediaStreamSource(stream)
      const analyser = createAnalyser()
      sourceRef.current.connect(analyser)
      // do not connect mic to destination to avoid echo
      setMode('mic')
      setRunning(true)
      setStatus('listening')
      startLoop()
    } catch (err) {
      setStatus('mic failed')
      console.warn('AudioAnalyzer: mic start failed', err)
    }
  }

  function stopMic() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop())
      mediaStreamRef.current = null
    }
    stop()
    setStatus('idle')
  }

  function handleFilePicked(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (fileURL) { if (fileURL.startsWith('blob:')) URL.revokeObjectURL(fileURL) }
    const url = URL.createObjectURL(f)
    setFileURL(url)
    setMode('file')
    createAndPlayFile(url)
  }

  function createAndPlayFile(url) {
    stop()
    ensureAudioContext()
    if (audioElementRef.current) {
      try { audioElementRef.current.pause() } catch (e) {}
      audioElementRef.current = null
    }
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.src = url
    audio.loop = true
    audio.controls = true
    audioElementRef.current = audio
    audio.addEventListener('canplay', async () => {
      try {
        await audio.play()
      } catch (e) {
        // play might be blocked until user interacts
      }
      if (!audioCtxRef.current) ensureAudioContext()
      try { connectElement(audio) } catch (e) {}
      setRunning(true)
      setStatus('playing')
      startLoop()
    }, { once: true })
  }

  function stopFile() {
    try {
      if (audioElementRef.current) {
        audioElementRef.current.pause()
        audioElementRef.current = null
      }
    } catch (e) {}
    stop()
    setStatus('idle')
  }

  function stop() {
    stopLoop()
    disconnectSource()
    setRunning(false)
  }

  function startLoop() {
    if (!analyserRef.current) createAnalyser()
    if (!analyserRef.current) return
    const analyser = analyserRef.current
  const freqData = new Uint8Array(analyser.frequencyBinCount)
  const timeData = new Uint8Array(analyser.fftSize)

    function loop() {
      analyser.getByteFrequencyData(freqData)
      analyser.getByteTimeDomainData(timeData)

    // compute RMS from time domain
      let sum = 0
      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / timeData.length)

      // band energy helper
      const sampleRate = audioCtxRef.current?.sampleRate || 44100
      const fftSize = analyser.fftSize
      const binSize = sampleRate / fftSize
      function bandMetrics(low, high) {
        const start = Math.max(0, Math.floor(low / binSize))
        const end = Math.min(freqData.length - 1, Math.floor(high / binSize))
        if (end < start) return { energy: 0, peak: 0 }
        let sumSq = 0
        let peak = 0
        const count = end - start + 1
        for (let i = start; i <= end; i++) {
          const norm = (freqData[i] || 0) / 255
          sumSq += norm * norm
          if (norm > peak) peak = norm
        }
        const rms = Math.sqrt(sumSq / Math.max(1, count))
        // gentle emphasis of stronger signals while keeping dynamic range
        const energy = Math.pow(Math.min(1, rms), 1.05)
        return { energy, peak }
      }

      const bandDefs = [
        { key: 'subBass', low: 20, high: 60 },
        { key: 'bass', low: 60, high: 250 },
        { key: 'lowMid', low: 250, high: 500 },
        { key: 'mid', low: 500, high: 2000 },
        { key: 'highMid', low: 2000, high: 5000 },
        { key: 'treble', low: 5000, high: 14000 }
      ]

      const bands = {}
      const peaks = {}
      for (let i = 0; i < bandDefs.length; i++) {
        const def = bandDefs[i]
        const metrics = bandMetrics(def.low, def.high)
        bands[def.key] = metrics.energy
        peaks[def.key] = metrics.peak
      }
      const smoothBands = smoothBandsRef.current
      const peaksState = peaksRef.current
      const attack = Math.max(0.01, 0.38 * (1 / Math.max(0.1, sensitivity)))
      const release = 0.12
      Object.keys(bands).forEach((key) => {
        const val = bands[key]
        const prev = smoothBands[key] || 0
        const k = val > prev ? attack : release
        smoothBands[key] = prev + (val - prev) * k
        // decay peaks a little slower so beat detection can interrogate transient energy
        peaksState[key] = Math.max(val, peaksState[key] * 0.92)
      })

      const lowEnergy = (bands.subBass * 1.4 + bands.bass + bands.lowMid * 0.6) / 3
      const midEnergy = (bands.lowMid * 0.5 + bands.mid + bands.highMid * 0.6) / 2.1
      const highEnergy = (bands.highMid * 0.9 + bands.treble * 1.2) / 2.1
      const tripletSmooth = tripletSmoothRef.current
      tripletSmooth.low = tripletSmooth.low + (lowEnergy - tripletSmooth.low) * (lowEnergy > tripletSmooth.low ? attack : release)
      tripletSmooth.mid = tripletSmooth.mid + (midEnergy - tripletSmooth.mid) * (midEnergy > tripletSmooth.mid ? attack : release)
      tripletSmooth.high = tripletSmooth.high + (highEnergy - tripletSmooth.high) * (highEnergy > tripletSmooth.high ? attack : release)

      const volume = Math.min(1, rms * sensitivity)

      // spectral flux (sum of positive differences between frames)
      let spectralFlux = 0
      if (!prevFreqRef.current) prevFreqRef.current = new Uint8Array(freqData.length)
      for (let i = 0; i < freqData.length; i++) {
        const diff = freqData[i] - prevFreqRef.current[i]
        spectralFlux += diff > 0 ? diff : 0
      }
      spectralFlux = spectralFlux / freqData.length / 255
      // keep a history of fluxes to compute a dynamic threshold
      const fh = fluxHistoryRef.current
      fh.push(spectralFlux)
      if (fh.length > 43) fh.shift()
      let meanFlux = 0
      for (let i = 0; i < fh.length; i++) meanFlux += fh[i]
      meanFlux = fh.length ? meanFlux / fh.length : 0
      // compute a basic standard deviation
      let std = 0
      for (let i = 0; i < fh.length; i++) std += Math.pow(fh[i] - meanFlux, 2)
      std = fh.length ? Math.sqrt(std / fh.length) : 0

      const now = performance.now()
      let beat = false
      // adaptive threshold using mean + std and a user-facing sensitivity scalar
      const threshold = meanFlux + Math.max(0.01, std) * (1.5 * sensitivity)
      if (spectralFlux > threshold && now - lastBeatRef.current > 150) {
        beat = true
        lastBeatRef.current = now
        // push a beat event to the shared audio bus
        audioBus.pushBeat({
          time: now,
          strength: spectralFlux,
          volume,
          rms,
          bands: { ...bands },
          smoothBands: { ...smoothBands },
          energy3: { ...tripletSmooth },
          peaks: { ...peaksState }
        })
      }
      // copy freq buffer into the bus if requested; otherwise provide the live buffer
      // spectral centroid (in Hz)
      let num = 0, den = 0
      for (let i = 0; i < freqData.length; i++) {
        num += i * freqData[i]
        den += freqData[i]
      }
      const centroid = den ? (num / den) * (sampleRate / fftSize) : 0

      audioBus.latest.timestamp = now
      audioBus.latest.volume = volume
      audioBus.latest.rms = rms
      audioBus.latest.spectralFlux = spectralFlux
      audioBus.latest.centroid = centroid
  audioBus.latest.bands.subBass = bands.subBass
  audioBus.latest.bands.bass = bands.bass
  audioBus.latest.bands.lowMid = bands.lowMid
  audioBus.latest.bands.mid = bands.mid
  audioBus.latest.bands.highMid = bands.highMid
  audioBus.latest.bands.treble = bands.treble
  audioBus.latest.smoothBands.subBass = smoothBands.subBass
  audioBus.latest.smoothBands.bass = smoothBands.bass
  audioBus.latest.smoothBands.lowMid = smoothBands.lowMid
  audioBus.latest.smoothBands.mid = smoothBands.mid
  audioBus.latest.smoothBands.highMid = smoothBands.highMid
  audioBus.latest.smoothBands.treble = smoothBands.treble
  audioBus.latest.bandPeaks.subBass = peaksState.subBass
  audioBus.latest.bandPeaks.bass = peaksState.bass
  audioBus.latest.bandPeaks.lowMid = peaksState.lowMid
  audioBus.latest.bandPeaks.mid = peaksState.mid
  audioBus.latest.bandPeaks.highMid = peaksState.highMid
  audioBus.latest.bandPeaks.treble = peaksState.treble
  audioBus.latest.energy3.low = tripletSmooth.low
  audioBus.latest.energy3.mid = tripletSmooth.mid
  audioBus.latest.energy3.high = tripletSmooth.high
      audioBus.latest.fft = rawFftEnabled ? new Uint8Array(freqData) : freqData
      // store the current frame to compute flux next frame
      prevFreqRef.current.set(freqData)

      // Pass audio data to parent for visual meter
      if (onAudioData) {
        onAudioData({
          subBass: smoothBands.subBass,
          bass: smoothBands.bass,
          mid: smoothBands.mid,
          treble: smoothBands.treble,
          volume,
        })
      }

      // throttle external onUpdate callback (UI consumer) to a lower rate so the
      // rest of the React tree isn't re-rendered each frame.
      if (onUpdate) {
        if (!lastUpdateRef.current || now - lastUpdateRef.current > updateIntervalMs) {
          lastUpdateRef.current = now
          onUpdate({
            volume,
            rms,
            spectralFlux,
            centroid,
            bands: { ...bands },
            smoothBands: { ...smoothBands },
            energy: { ...tripletSmooth },
            beat
          })
        }
      }

      // draw a compact frequency bar visualizer when a canvas is available
      try {
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          const w = canvas.width
          const h = canvas.height
          ctx.clearRect(0, 0, w, h)
          // compress spectrum into N bars
          const bars = 48
          const binSize = Math.floor(freqData.length / bars)
          for (let i = 0; i < bars; i++) {
            let s = 0
            const start = i * binSize
            for (let j = 0; j < binSize; j++) s += freqData[start + j] || 0
            const avg = s / (binSize || 1)
            const norm = avg / 255
            const bw = Math.max(1, Math.floor(w / bars))
            const bh = Math.max(1, Math.floor(norm * h))
            ctx.fillStyle = `hsl(${i / bars * 360}, 80%, ${20 + norm * 50}%)`
            ctx.fillRect(i * bw, h - bh, bw - 1, bh)
          }
        }
      } catch (e) {
        // drawing should never throw, but guard in case
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    if (!rafRef.current) rafRef.current = requestAnimationFrame(loop)
  }

  function stopLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }

  return (
    <div className="audio-analyzer">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 12 }}>
          Audio file
          <input type="file" accept="audio/*" onChange={handleFilePicked} />
        </label>

        <button
          onClick={() => {
            if (mode === 'mic' && running) stopMic()
            else startMic()
            setMode('mic')
          }}
        >
          Use mic
        </button>

        <button onClick={() => { if (running) { stop(); stopFile(); stopMic() } else { /* no-op: either file or mic starts via controls */ } }}>
          Stop
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 12 }}>
          Sensitivity
          <input type="range" min="0.1" max="5" step="0.01" value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} />
        </label>
        <label style={{ fontSize: 12 }}>
          Smoothing
          <input type="range" min="0" max="0.99" step="0.01" value={smoothing} onChange={(e) => { setSmoothing(Number(e.target.value)); if (analyserRef.current) analyserRef.current.smoothingTimeConstant = Number(e.target.value) }} />
        </label>
        <div style={{ fontSize: 12 }}>
          Status: {status} {running ? '•' : '◦'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 12 }}>
          <input type="checkbox" checked={rawFftEnabled} onChange={(e) => setRawFftEnabled(e.target.checked)} />
          Copy raw FFT into bus
        </label>
      </div>
      <div style={{ marginTop: 8 }}>
        <canvas ref={canvasRef} width={240} height={48} style={{ width: 240, height: 48, background: '#05060a', borderRadius: 4 }} />
      </div>
    </div>
  )
}
