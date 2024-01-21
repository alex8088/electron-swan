import log from 'log-update'
import c from 'picocolors'
import { isUnicodeSupported } from './utils'

export class Spinner {
  protected readonly frames: string[] = !isUnicodeSupported()
    ? ['-', '\\', '|', '/']
    : ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

  private inter?: NodeJS.Timeout

  private i = 0

  public timer = 0

  constructor(
    public text = '',
    private readonly interval = 100
  ) {}

  public start(): void {
    this.inter = setInterval(() => {
      const frame = this.frames[(this.i = ++this.i % this.frames.length)]
      log(c.blue(frame) + ` ${this.text}`)
      this.timer += this.interval
    }, this.interval)
  }

  public stop(text?: string): void {
    clearInterval(this.inter)
    this.i = 0
    this.timer = 0
    log.clear()
    log.done()
    console.log(text)
  }
}
