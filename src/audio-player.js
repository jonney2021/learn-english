// Pre-rendered neural audio: identical voices across desktop and mobile.
export class LessonAudio {
  constructor({createAudio = url => new Audio(url), onError = () => {}, onState = () => {}} = {}) {
    this.createAudio = createAudio;
    this.onError = onError;
    this.onState = onState;
    this.current = null;
    this.key = null;
    this.generation = 0;
    this.rate = 1;
  }
  setRate(rate) {
    this.rate = [0.75, 0.9, 1, 1.1].includes(Number(rate)) ? Number(rate) : 1;
    if (this.current) this.current.playbackRate = this.rate;
  }
  stop() {
    this.generation++;
    if (this.current) {
      this.current.pause();
      this.current.removeAttribute('src');
      this.current.load();
      this.current = null;
    }
    this.key = null;
    this.onState('idle');
  }
  async play(id, kind = 'dialogue') {
    if (!/^[a-z]+$/.test(id) || !['dialogue','phrase'].includes(kind)) return;
    const key = `${id}-${kind}`;
    if (this.current && this.key === key) {
      if (!this.current.paused) { this.current.pause(); this.onState('paused'); return; }
      try { await this.current.play(); } catch { this.onError(); }
      return;
    }
    this.stop();
    const generation = this.generation;
    const audio = this.createAudio(new URL(`../audio/${key}.mp3`, import.meta.url).href);
    this.current = audio;
    this.key = key;
    audio.preload = 'auto';
    audio.playbackRate = this.rate;
    audio.preservesPitch = true;
    const valid = () => generation === this.generation;
    audio.addEventListener('playing', () => { if (valid()) this.onState('playing'); });
    audio.addEventListener('waiting', () => { if (valid()) this.onState('loading'); });
    audio.addEventListener('ended', () => { if (valid()) this.stop(); });
    audio.addEventListener('error', () => { if (valid()) { this.stop(); this.onError(); } });
    this.onState('loading');
    try { await audio.play(); }
    catch { if (valid()) { this.stop(); this.onError(); } }
  }
}
