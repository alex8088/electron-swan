import readline from 'node:readline'
import stripAnsi from 'strip-ansi'

interface LogOptions {
  icon?: string
  indent?: boolean
  newLine?: boolean
  clearLine?: boolean
}

interface Logger {
  log(msg?: string, options?: LogOptions): void
  info(msg?: string, options?: LogOptions): void
  warn(msg?: string, options?: LogOptions): void
  error(msg?: string, options?: LogOptions): void
}

function format(msg: string, options: LogOptions = {}): string {
  const { indent, icon } = options
  return (indent ? '  ' : '') + (icon ? `${icon} ${msg}` : msg)
}

function clearLine(): void {
  readline.moveCursor(process.stdout, 0, -1)
  readline.clearLine(process.stdout, 1)
}

function output(type: string, msg: string, options: LogOptions = {}): void {
  if (options?.clearLine) clearLine()
  console[type](format(msg, options))
  if (options?.newLine) console.log()
}

const logger: Logger = {
  log(msg = '', opts) {
    output('log', msg, opts)
  },
  info(msg = '', opts) {
    output('info', msg, opts)
  },
  warn(msg = '', opts) {
    output('warn', msg, opts)
  },
  error(msg = '', opts) {
    output('error', msg, opts)
  }
}

function length(str: string): number {
  if (str === '') return 0

  str = stripAnsi(str)

  let width = 0

  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i)
    if (!code) continue

    // Ignore control characters
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) continue

    // Ignore combining characters
    if (code >= 0x300 && code <= 0x36f) continue

    // Surrogates
    if (code > 0xffff) i++

    width += 1
  }
  return width
}

function padEnd(str: string, pad: number, char = ' '): string {
  return str.padEnd(pad - length(str) + str.length, char)
}

function padStart(str: string, pad: number, char = ' '): string {
  return str.padStart(pad - length(str) + str.length, char)
}

interface TableLoggerOptions {
  columns: number
  align: string
  pending?: number
}

export class TableLogger {
  private rows: (string[] | string)[] = []

  constructor(private readonly options: TableLoggerOptions) {}

  row(...args: string[]): void {
    this.rows.push(args)
  }

  log(string = ''): void {
    this.rows.push(string)
  }

  print(): void {
    const { columns, align, pending = 1 } = this.options
    const columnsWidth = Array.from({ length: columns }, () => 0)

    this.rows.forEach((line) => {
      if (typeof line === 'string') return
      for (let i = 0; i < columns; i++)
        columnsWidth[i] = Math.max(columnsWidth[i], length(line[i] || ''))
    })

    this.rows.forEach((line) => {
      if (typeof line === 'string') {
        logger.info(line, { newLine: true })
        return
      }

      let row = ''
      for (let i = 0; i < columns; i++) {
        const pad = align[i] === 'R' ? padStart : padEnd
        row += pad(line[i] || '', columnsWidth[i]) + '  '.repeat(pending)
      }
      logger.info(row, { indent: true })
    })

    this.rows = []
  }
}

export default logger
