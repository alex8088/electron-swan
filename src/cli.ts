#!/usr/bin/env node

import { cac } from 'cac'
import { list } from './commands/list'
import { remove } from './commands/remove'
import { check } from './commands/check'
import { install } from './commands/install'
import { version } from '../package.json'
import { icons } from './utils'
import logger from './logger'

const cli = cac('swan')

cli
  .command('list', 'list downloaded Electron release artifacts')
  .alias('ls')
  .option('-a, --arch <arch>', `[string] specify architecture`)
  .option('-p, --platform <platform>', `[string] specify platform`)
  .option('-d, --detail', `[boolean] show all archives (default: false)`)
  .action(list)

cli
  .command('remove <version>', 'remove downloaded Electron release artifacts')
  .alias('rm')
  .option('-f, --force', `[boolean] remove directly`)
  .action(remove)

cli
  .command('check [version]', 'check the latest Electron version')
  .option('--tag <arch>', `[string] beta | alpha, check with tag`)
  .action(check)

cli
  .command('install [version]', 'download Electron release artifacts')
  .alias('i')
  .alias('add')
  .option('-a, --arch <arch>', `[string] specify architecture`)
  .option('-p, --platform <platform>', `[string] specify platform`)
  .option(
    '--mirror <mirror>',
    '[string] specify mirrors to download Electron release artifacts (default: npm mirror)'
  )
  .action(install)

cli.help()
cli.version(version)

try {
  cli.parse()
} catch (e) {
  logger.error((e as Error).message, { icon: icons.error, newLine: true })
}
