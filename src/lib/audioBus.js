// A tiny shared bus for realtime audio analysis data.
// Components can read `latest` in a render loop or subscribe to beat events.
const audioBus = {
  // latest analysis snapshot (updated in-place for perf)
  latest: {
    timestamp: 0,
    volume: 0,
    rms: 0,
    spectralFlux: 0,
    centroid: 0,
    bands: {
      subBass: 0,
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      treble: 0
    },
    smoothBands: {
      subBass: 0,
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      treble: 0
    },
    bandPeaks: {
      subBass: 0,
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      treble: 0
    },
    energy3: {
      low: 0,
      mid: 0,
      high: 0
    },
    // latest reference to the frequency buffer (may be reused by analyser)
    fft: null
  },

  // a simple FIFO of beat events (consumer can pop or peek)
  beatQueue: [],
  maxBeats: 256,

  // subscribers are called synchronously when a beat is detected; they should
  // not perform heavy work — prefer collecting events and reacting during useFrame.
  _subs: [],

  pushBeat(evt) {
    this.beatQueue.push(evt)
    if (this.beatQueue.length > this.maxBeats) this.beatQueue.shift()
    for (let i = 0; i < this._subs.length; i++) {
      try {
        this._subs[i](evt)
      } catch (e) {
        // swallow subscriber errors
        console.warn('audioBus subscriber error', e)
      }
    }
  },

  popBeat() {
    return this.beatQueue.shift()
  },

  peekBeats() {
    return this.beatQueue.slice()
  },

  clearBeats() {
    this.beatQueue.length = 0
  },

  subscribe(fn) {
    if (typeof fn !== 'function') return () => {}
    this._subs.push(fn)
    return () => {
      const i = this._subs.indexOf(fn)
      if (i >= 0) this._subs.splice(i, 1)
    }
  }
}

export default audioBus
