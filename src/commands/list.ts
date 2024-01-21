import c from 'picocolors'
import semver from 'semver'
import { getCacheRoot } from '../cache'
import { getLocalArchives } from '../archives'
import { groupByToMap, icons } from '../utils'
import logger, { TableLogger } from '../logger'
import type { Archive } from '../types'

export interface ListOptions {
  a?: string
  arch?: string
  d?: boolean | string
  detail?: boolean | string
  p?: string
  platform?: string
}

export const list = async (options: ListOptions): Promise<void> => {
  logger.log()
  const { platform, arch, detail } = options
  try {
    const cacheRoot = getCacheRoot()
    let archives = await getLocalArchives(cacheRoot)

    if (platform) {
      archives = archives.filter((a) => a.platform === platform)
    }
    if (arch) {
      archives = archives.filter((a) => a.arch === arch)
    }

    if (archives.length === 0) {
      logger.log(c.magenta(c.dim('0')) + c.gray(' archives found'), {
        icon: icons.tick,
        newLine: true
      })
      return
    }

    const data = groupByToMap<Archive, string>(
      archives,
      ({ platform, arch }) => `${platform} + ${arch}`
    )

    const logT = new TableLogger(
      detail
        ? { columns: 2, align: 'LR', pending: 2 }
        : { columns: 4, align: 'LRLR' }
    )

    const host = `${process.platform} + ${process.arch}`

    for (const [key, value] of data) {
      const hostMark = key === host ? c.gray('Host') : ''

      logT.log(`${icons.arrowR}${c.cyan(` ${key} `)}${hostMark}`)

      const _list = groupByToMap<Archive, string>(
        value,
        ({ version, tag }) =>
          `${version.split('.')[0]}.x.y${tag === 'latest' ? '' : `-${tag}.z`}`
      )

      const sortList = [..._list].sort()
      const listMap = new Map(sortList)

      let archiveCount: number = 0
      let sizeCount: number = 0

      if (detail) {
        logT.row(c.white('Version'), c.white(`Size`))

        for (const value of listMap.values()) {
          value
            .sort((a, b) => semver.compare(a.version, b.version))
            .forEach((v) => {
              archiveCount += 1
              sizeCount += v.size
              logT.row(
                c.green(v.version),
                c.gray(`${(v.size / 1000).toFixed(0)} kB`)
              )
            })
        }
      } else {
        logT.row(
          c.white('Version'),
          c.white('Archives'),
          c.white('Local Latest'),
          c.white(`Total Size`)
        )
        for (const [key, value] of listMap) {
          let versions = value.map((v) => v.version)
          versions = versions.sort((a, b) =>
            b.localeCompare(a, undefined, { numeric: true })
          )

          const size = value
            .map((v) => v.size)
            .reduce((acc, cur) => acc + cur, 0)

          archiveCount += value.length
          sizeCount += size

          logT.row(
            c.green(key),
            c.yellow(`${value.length}`),
            c.blue(`${versions[0]}`),
            c.gray(`${(size / 1000).toFixed(0)} kB`)
          )
        }
      }

      logT.log(
        c.magenta(c.dim(`\n  ${archiveCount}`)) +
          c.gray(` archives, `) +
          c.magenta(c.dim(`${(sizeCount / 1000).toFixed(0)}`)) +
          c.gray(` kB`)
      )
    }

    logT.print()
  } catch (e) {
    logger.error((e as Error).message, { icon: icons.error, newLine: true })
  }
}
