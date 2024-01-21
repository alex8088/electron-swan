import path from 'node:path'
import crypto from 'node:crypto'
import envPaths from 'env-paths'

export const getCacheRoot = (): string => {
  const cacheRoot = envPaths('electron', { suffix: '' }).cache
  return cacheRoot
}

export const getCachePath = (cacheDir: string, fileName: string): string => {
  return path.resolve(getCacheRoot(), cacheDir, fileName)
}

export const getCacheDirectory = (mirror: string, version: string): string => {
  return crypto
    .createHash('sha256')
    .update(`${mirror}v${version}`)
    .digest('hex')
}
