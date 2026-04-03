declare module 'plyr' {
  export default class Plyr {
    constructor(target: HTMLMediaElement, options?: Record<string, unknown>)
    destroy(): void
  }
}
