import { ELECTRON_DOWNLOAD_URL } from './constants'

export function getMirrorVar(): string {
  return (
    process.env[`npm_config_electron_mirror`] ||
    process.env[`npm_config_ELECTRON_MIRROR`] ||
    process.env[`npm_package_config_electron_mirror`] ||
    process.env[`ELECTRON_MIRROR`] ||
    ''
  )
}

export function getMirror(mirror: string): string {
  return mirror.startsWith('http') ? mirror : ELECTRON_DOWNLOAD_URL
}

export function useMirror(): boolean {
  return !!getMirrorVar()
}
