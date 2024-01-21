import path from 'node:path'
import c from 'picocolors'
import semver from 'semver'
import { downloadArtifact } from '@electron/get'
import { getAllVersions } from '../npm'
import { getCacheRoot, getCachePath, getCacheDirectory } from '../cache'
import { getLocalArchives } from '../archives'
import { getMirror, getMirrorVar } from '../mirror'
import { Spinner } from '../spinner'
import { NPM_MIRROR, ELECTRON_DOWNLOAD_URL } from '../constants'
import { icons, moveFile } from '../utils'
import logger from '../logger'

export interface InstallOptions {
  a?: string
  arch?: string
  p?: string
  platform?: string
  mirror?: string
}

export const install = async (
  version: string,
  options: InstallOptions
): Promise<void> => {
  logger.log()
  let _range = ''
  if (version) {
    const range = semver.validRange(version)
    if (!range) {
      logger.log(`Invalid version: ${c.underline(version)}`, {
        icon: icons.warning,
        newLine: true
      })
      return
    }
    _range = range
  }
  try {
    const versions = await getAllVersions()
    if (versions.length) {
      const installVersion = _range
        ? versions.findLast((v) => semver.satisfies(v, _range))
        : versions.findLast((v) => !v.includes('-'))

      if (installVersion) {
        const npmMirror = getMirrorVar()
        const {
          platform = process.platform,
          arch = process.arch,
          mirror = npmMirror || NPM_MIRROR
        } = options

        const cacheRoot = getCacheRoot()
        const archives = await getLocalArchives(cacheRoot)
        const _mirror = getMirror(mirror)
        const proxy = !npmMirror && _mirror !== ELECTRON_DOWNLOAD_URL
        const name = getCacheDirectory(
          proxy ? ELECTRON_DOWNLOAD_URL : _mirror,
          installVersion
        )

        const archive = archives.find(
          (a) =>
            a.version === installVersion &&
            a.platform === platform &&
            a.arch === arch &&
            a.name === name
        )

        logger.log(
          `${c.cyan('Latest version:')} ${c.yellow(installVersion)} ${c.gray(
            '/'
          )} ${c.green(c.dim(`${platform}-${arch}`))}${
            archive ? c.gray(' (Cached)') : ''
          }`,
          { icon: icons.arrowR, newLine: true }
        )

        if (!archive) {
          const spinner = new Spinner('Installing...')
          spinner.start()
          process.env.ELECTRON_GET_NO_PROGRESS = 'yes'
          downloadArtifact({
            version: installVersion,
            platform,
            arch,
            artifactName: 'electron',
            mirrorOptions: {
              mirror: _mirror
            },
            downloadOptions: {
              quiet: true,
              getProgressCallback: (progress) => {
                spinner.text = `Installing... ${c.blue(
                  `(${(progress.percent * 100).toFixed(2)}%)`
                )}`
              }
            }
          })
            .then(async (cachePath: string) => {
              if (proxy) {
                const fileName = path.basename(cachePath)
                const dist = getCachePath(name, fileName)
                await moveFile(cachePath, dist)
              }
              const ttl = Math.floor(spinner.timer / 1000).toFixed(0)
              spinner.stop(c.green(`✔ Installed`) + c.gray(` (${ttl}s)`))
              logger.log()
            })
            .catch((e) => {
              spinner.stop('')
              logger.error(
                `download Electron artifact failed: ${(e as Error).message}`,
                { icon: icons.error, newLine: true }
              )
            })
        }
      } else {
        logger.log(c.yellow(`No matching version: ${c.underline(version)}`), {
          icon: icons.warning,
          newLine: true
        })
      }
    }
  } catch (e) {
    logger.error((e as Error).message, { icon: icons.error, newLine: true })
  }
}
