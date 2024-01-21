import {
  promises as fs,
  existsSync,
  readdirSync,
  lstatSync,
  rmdirSync,
  unlinkSync
} from 'node:fs'
import path from 'node:path'
import c from 'picocolors'

export function emptyDir(dir: string): void {
  for (const file of readdirSync(dir)) {
    const abs = path.resolve(dir, file)
    if (lstatSync(abs).isDirectory()) {
      emptyDir(abs)
      rmdirSync(abs)
    } else {
      unlinkSync(abs)
    }
  }
}

export async function moveFile(
  oldPath: string,
  newPath: string
): Promise<void> {
  if (!existsSync(path.dirname(newPath))) {
    await fs.mkdir(path.dirname(newPath), { recursive: true })
  }
  await fs.rename(oldPath, newPath)
}

export const groupBy = <T>(
  array: T[],
  predicate: (value: T, index: number) => string
): { [key: string]: T[] } =>
  array.reduce(
    (acc, value, index) => {
      ;(acc[predicate(value, index)] ||= []).push(value)
      return acc
    },
    {} as { [key: string]: T[] }
  )

export const groupByToMap = <T, Q>(
  array: T[],
  predicate: (value: T, index: number) => Q
): Map<Q, T[]> =>
  array.reduce((map, value, index) => {
    const key = predicate(value, index)
    map.get(key)?.push(value) ?? map.set(key, [value])
    return map
  }, new Map<Q, T[]>())

export function isUnicodeSupported(): boolean {
  return (
    process.platform !== 'win32' ||
    !!process.env.CI ||
    !!process.env.WT_SESSION ||
    process.env.TERM_PROGRAM === 'vscode' ||
    process.env.TERM === 'xterm-256color' ||
    process.env.TERM === 'alacritty'
  )
}

const symbols = isUnicodeSupported()
  ? {
      tick: '✔',
      info: 'ℹ',
      warning: '⚠',
      cross: '✘'
    }
  : {
      tick: '√',
      info: 'i',
      warning: '‼',
      cross: '×'
    }

export const icons = {
  tick: c.green(symbols.tick),
  info: c.blue(symbols.info),
  warning: c.yellow(c.bold('!')),
  cross: c.red(symbols.cross),
  arrowR: c.yellow('→'),
  circle: c.white('○'),
  bullet: c.green('●'),
  error: c.bgRed(c.white(' ERROR '))
}
