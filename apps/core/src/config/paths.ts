import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const isPackaged = !!(process as any).pkg

// src/config/paths.ts -> build 后 dist/config/paths.js
// distRoot = apps/core/dist
export const DIST_ROOT = path.join(__dirname, '..')

// coreRoot = apps/core
export const CORE_ROOT = isPackaged
  ? path.dirname(process.execPath)
  : path.join(DIST_ROOT, '..')

// workspaceRoot = monorepo 根目录（包含 apps/）
export const WORKSPACE_ROOT = isPackaged
  ? path.dirname(process.execPath)
  : path.resolve(DIST_ROOT, '..', '..', '..')

function findLegacy(): string {
  const inDist = path.join(DIST_ROOT, 'legacy')
  if (fs.existsSync(inDist)) return inDist
  // dev 模式: apps/core/legacy
  return path.join(CORE_ROOT, 'legacy')
}

export const LEGACY_DIR = findLegacy()

// dist/main.js
export const MAIN_ENTRY = path.join(DIST_ROOT, 'main.js')

export function legacyRequire<T = any>(subpath: string): T {
  return require(path.join(LEGACY_DIR, subpath))
}

export function resolveWebDist(): string {
  const candidates = [
    // monorepo / docker: <workspace>/apps/web/dist
    path.join(WORKSPACE_ROOT, 'apps', 'web', 'dist'),
    // fallback: <workspace>/web/dist（如果未来拆分）
    path.join(WORKSPACE_ROOT, 'web', 'dist'),
    // pkg/单体分发时可能把 web 放到 core 下
    path.join(CORE_ROOT, 'web', 'dist'),
  ]
  return candidates.find(p => fs.existsSync(p)) ?? ''
}
