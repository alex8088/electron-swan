import { existsSync, lstatSync, promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import os from 'node:os'
import pacote from 'pacote'
import semver from 'semver'

type Cache = { cacheTime: number; versions: string[] }

const cacheDir = resolve(os.tmpdir(), 'swan')
const cachePath = resolve(cacheDir, 'cache.json')
const cacheTTL = 30 * 60_000 // 30min

function ttl(n: number): number {
  return +new Date() - n
}

async function loadCache(): Promise<Cache | null> {
  if (existsSync(cachePath) && ttl(lstatSync(cachePath).mtimeMs) < cacheTTL) {
    return JSON.parse(await fs.readFile(cachePath, 'utf-8')) as Cache
  }
  return null
}

async function dumpCache(cache: Cache): Promise<void> {
  try {
    await fs.mkdir(cacheDir, { recursive: true })
    await fs.writeFile(cachePath, JSON.stringify(cache), 'utf-8')
  } catch (err) {
    // Failed to save cache
  }
}

export async function getAllVersions(): Promise<string[]> {
  try {
    const cache = await loadCache()
    if (cache) {
      return cache.versions
    } else {
      const data = await pacote.packument('electron', { fullMetadata: false })
      if (data) {
        const versions = Object.keys(data.versions || {}).sort((a, b) =>
          semver.compare(a, b)
        )
        dumpCache({ cacheTime: +new Date(), versions })
        return versions
      }
    }
  } catch (err) {
    // Failed to get Electron versions
  }
  return []
}
