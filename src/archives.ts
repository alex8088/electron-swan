import { promises as fs, lstatSync } from 'node:fs'
import { join, parse } from 'node:path'
import type { Archive } from './types'

export const getLocalArchives = async (
  cacheRoot: string
): Promise<Archive[]> => {
  const list: Archive[] = []
  const names = await fs.readdir(cacheRoot)
  for (const name of names) {
    const cachePath = join(cacheRoot, name)
    if (lstatSync(cachePath).isDirectory() && /^[0-9a-f]{64}/.test(name)) {
      const archives = await fs.readdir(cachePath)
      for (const archive of archives) {
        const archivePath = join(cachePath, archive)
        const stat = lstatSync(archivePath)
        if (
          stat.isFile() &&
          archive.startsWith('electron') &&
          archive.endsWith('zip')
        ) {
          const parts = parse(archive).name.split('-')
          const prerelease = parts.length > 4
          const version =
            parts[1].replace('v', '') + (prerelease ? `-${parts[2]}` : '')
          const platform = prerelease ? parts[3] : parts[2]
          const arch = prerelease ? parts[4] : parts[3]
          const tag = prerelease ? parts[2].split('.')[0] : 'latest'
          list.push({
            name,
            size: stat.size,
            platform,
            arch,
            path: archivePath,
            version,
            tag
          })
        }
      }
    }
  }
  return list
}
