import path from 'node:path'
import semver from 'semver'
import c from 'picocolors'
import prompts from 'prompts'
import { getCacheRoot } from '../cache'
import { getLocalArchives } from '../archives'
import { emptyDir, icons } from '../utils'
import logger, { TableLogger } from '../logger'

export interface RomoveOptions {
  f?: boolean
  force?: boolean
}

export const remove = async (
  version: string,
  options: RomoveOptions
): Promise<void> => {
  logger.log()
  try {
    const range = semver.validRange(version)
    if (range) {
      const cacheRoot = getCacheRoot()
      const archives = await getLocalArchives(cacheRoot)
      const targets = archives
        .filter((a) => semver.satisfies(a.version, range))
        .sort((a, b) => semver.compare(a.version, b.version))

      if (targets.length) {
        const logT = new TableLogger({ columns: 3, align: 'LLR', pending: 2 })

        logT.log(`${icons.arrowR} ${c.cyan('Archive found:')}`)
        logT.row(c.white('Version'), '', c.white('Size'))

        targets.forEach((t) => {
          const remark =
            t.arch !== process.arch || t.platform !== process.platform
              ? `${t.platform} + ${t.arch}`
              : ''
          logT.row(
            c.green(t.version),
            c.gray(remark),
            c.gray(`${(t.size / 1000).toFixed(0)} kB`)
          )
        })

        const size = targets
          .map((t) => t.size)
          .reduce((acc, cur) => acc + cur, 0)

        logT.log(
          c.magenta(c.dim(`\n  ${targets.length}`)) +
            c.gray(` archives, `) +
            c.magenta(c.dim(`${(size / 1000).toFixed(0)}`)) +
            c.gray(` kB`)
        )

        logT.print()

        let result: { confirm?: boolean } = { confirm: options.force }

        if (!options.force) {
          result = await prompts([
            {
              name: 'confirm',
              type: () => 'toggle',
              message: `Are you sure to remove?`,
              initial: false,
              active: 'Yes',
              inactive: 'No'
            }
          ])
        }

        const { confirm = false } = result

        if (confirm) {
          logger.log()
          logger.log(c.bold('Removing...'), { icon: icons.circle })
          const names = targets.map((t) => path.join(cacheRoot, t.name))
          names.forEach(async (name) => emptyDir(name))
          logger.log(
            `${c.magenta(c.dim(`${targets.length}`))} ${c.bold(
              'archives removed'
            )}`,
            { icon: icons.tick, clearLine: true, newLine: true }
          )
        } else {
          logger.log()
          logger.log(c.bold('Cancelled'), { icon: icons.cross, newLine: true })
        }
      } else {
        logger.log(
          c.yellow(`No local archive found matching '${c.underline(range)}'`),
          { icon: icons.warning, newLine: true }
        )
      }
    } else {
      logger.log(c.yellow(`Invalid version: ${c.underline(version)}`), {
        icon: icons.warning,
        newLine: true
      })
    }
  } catch (e) {
    logger.error((e as Error).message, { icon: icons.error, newLine: true })
  }
}
