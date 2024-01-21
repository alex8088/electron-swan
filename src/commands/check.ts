import c from 'picocolors'
import semver from 'semver'
import { DIST_TAGS } from '../constants'
import { icons } from '../utils'
import logger from '../logger'
import { getAllVersions } from '../npm'
import { getCacheRoot } from '../cache'
import { getLocalArchives } from '../archives'

interface CheckOptions {
  tag?: string
}

export const check = async (
  version: string,
  options: CheckOptions
): Promise<void> => {
  logger.log()
  const tag = options.tag || ''
  if (tag && !DIST_TAGS.includes(tag)) {
    logger.log(
      c.yellow(
        `Invalid tag name: ${c.underline(tag)} ${c.gray('(beta/alpha)')}`
      ),
      {
        icon: icons.warning,
        newLine: true
      }
    )
    return
  }

  logger.info(c.cyan('Checking for updates'), { icon: icons.arrowR })

  try {
    const versions = await getAllVersions()
    if (versions.length) {
      const cacheRoot = getCacheRoot()
      const archives = await getLocalArchives(cacheRoot)
      let localVersions = archives.map((a) => a.version)
      localVersions = localVersions.sort((a, b) => semver.compare(a, b))

      const p1: (v: string) => boolean = (v) =>
        v.startsWith(version) && (tag ? v.includes(tag) : !v.includes('-'))

      const p2: (v: string) => boolean = (v) =>
        tag ? v.includes(tag) : !v.includes('-')

      const remoteVer = versions.findLast(version ? p1 : p2)

      if (remoteVer) {
        const localVer = localVersions.findLast(version ? p1 : p2)
        if (localVer) {
          const update = semver.lt(localVer, remoteVer)
          logger.info(c.cyan(update ? 'New version to update' : 'No updates'), {
            icon: icons.tick,
            clearLine: true,
            newLine: true
          })
          logger.log(
            c.gray(localVer) +
              `  ${c.gray(update ? '→' : '=')}  ` +
              c.blue(remoteVer),
            { newLine: true, indent: true }
          )
        } else {
          logger.info(c.cyan('Cache miss, new version to update'), {
            icon: icons.tick,
            clearLine: true,
            newLine: true
          })
          logger.log(c.gray('-') + `  ${c.gray('→')}  ` + c.blue(remoteVer), {
            newLine: true,
            indent: true
          })
        }
      } else {
        logger.log(c.red(`No matching version: ${c.underline(version)}`), {
          icon: icons.cross,
          clearLine: true,
          newLine: true
        })
      }
    } else {
      logger.log(c.red(`Failed to get Electron versions`), {
        icon: icons.cross,
        clearLine: true,
        newLine: true
      })
    }
  } catch (e) {
    logger.error((e as Error).message, { icon: icons.error, newLine: true })
  }
}
