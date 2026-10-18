#!/usr/bin/env node
/**
 * 对照 docs/package-metadata.md 校验包清单与 pnpm catalog。
 *
 * 错误直接失败；私有包的版本偏差只告警，避免在 CD 里程碑之前把这套检查
 * 变成发布策略。
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'

const root = resolve(import.meta.dirname, '..')
const errors = []
const warnings = []

const fail = (file, message) => errors.push(`${file}: ${message}`)
const warn = (file, message) => warnings.push(`${file}: ${message}`)

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'))
}

// 正则无法区分字符串与注释：tsconfig 的 "**/*.ts" 会被误当成块注释，必须按字符扫描。
function stripJsonComments(text) {
  let result = ''
  let inString = false
  let inLineComment = false
  let inBlockComment = false

  for (let index = 0; index < text.length; index += 1) {
    const current = text[index]
    const next = text[index + 1]

    if (inLineComment) {
      if (current === '\n') {
        inLineComment = false
        result += current
      }
      continue
    }
    if (inBlockComment) {
      if (current === '*' && next === '/') {
        inBlockComment = false
        index += 1
      }
      continue
    }
    if (inString) {
      result += current
      if (current === '\\') {
        result += text[index + 1] ?? ''
        index += 1
      } else if (current === '"') {
        inString = false
      }
      continue
    }
    if (current === '"') {
      inString = true
      result += current
      continue
    }
    if (current === '/' && next === '/') {
      inLineComment = true
      index += 1
      continue
    }
    if (current === '/' && next === '*') {
      inBlockComment = true
      index += 1
      continue
    }
    result += current
  }

  return result
}

function readJsonc(relativePath) {
  return JSON.parse(stripJsonComments(readFileSync(resolve(root, relativePath), 'utf8')))
}

function collectManifests() {
  const manifests = [{ path: 'package.json', json: readJson('package.json'), isRoot: true }]
  for (const group of ['apps', 'packages']) {
    const groupDir = resolve(root, group)
    if (!existsSync(groupDir)) continue
    for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const relativePath = `${group}/${entry.name}/package.json`
      if (!existsSync(resolve(root, relativePath))) continue
      manifests.push({ path: relativePath, json: readJson(relativePath), isRoot: false })
    }
  }
  return manifests
}

const workspace = parse(readFileSync(resolve(root, 'pnpm-workspace.yaml'), 'utf8'))
const catalogs = workspace.catalogs ?? {}
const catalogNames = new Set(Object.keys(catalogs))
const manifests = collectManifests()
const depFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
const tsconfigExports = new Set(
  Object.keys(readJson('packages/tsconfig/package.json').exports ?? {}),
)

for (const { path, json, isRoot } of manifests) {
  if (isRoot) {
    if (json.name !== 'inkstack')
      fail(path, `root name must be "inkstack", got ${JSON.stringify(json.name)}`)
  } else if (!/^@inkstack\/[a-z0-9-]+$/.test(json.name ?? '')) {
    fail(path, `name must match @inkstack/<kebab-case>, got ${JSON.stringify(json.name)}`)
  }

  if (json.private !== true) fail(path, 'private must be true')

  const description = typeof json.description === 'string' ? json.description.trim() : ''
  if (!description) {
    fail(path, 'description is required')
  } else {
    if (description.length < 40 || description.length > 120) {
      fail(path, `description must be 40-120 characters, got ${description.length}`)
    }
    if (description === json.name) fail(path, 'description must not repeat the package name')
  }

  if (json.license !== 'ISC')
    fail(path, `license must be "ISC", got ${JSON.stringify(json.license)}`)

  for (const field of depFields) {
    for (const [dependency, specifier] of Object.entries(json[field] ?? {})) {
      if (dependency.startsWith('@inkstack/')) {
        if (specifier !== 'workspace:*') {
          fail(
            path,
            `${field}.${dependency} must use "workspace:*", got ${JSON.stringify(specifier)}`,
          )
        }
        continue
      }
      if (typeof specifier !== 'string' || !specifier.startsWith('catalog:')) {
        fail(
          path,
          `${field}.${dependency} must use catalog:<name>, got ${JSON.stringify(specifier)}`,
        )
        continue
      }
      const catalog = specifier.slice('catalog:'.length)
      if (!catalogNames.has(catalog)) {
        fail(path, `${field}.${dependency} references missing catalog "${catalog}"`)
      }
    }
  }

  if (!isRoot && json.version !== '0.0.0') {
    warn(
      path,
      `private package version is ${JSON.stringify(json.version)}; expected 0.0.0 until a release process exists`,
    )
  }

  if (isRoot) {
    for (const script of ['dev', 'build', 'lint', 'typecheck']) {
      if (!json.scripts?.[script]) fail(path, `root must define script "${script}"`)
    }
  } else {
    const packageDir = resolve(root, path, '..')
    if (existsSync(resolve(packageDir, 'src'))) {
      for (const script of ['build', 'typecheck']) {
        if (!json.scripts?.[script]) fail(path, `package with src/ must define script "${script}"`)
      }
      if (json.type !== 'module') fail(path, 'package with src/ must declare "type": "module"')
    }

    // 导出映射是包对消费者的契约；没有 publint 就只剩运行时才发现目标缺失。
    if (json.exports) {
      if (!json.scripts?.publint) fail(path, 'package with "exports" must define script "publint"')
      if (json.devDependencies?.publint !== 'catalog:dev') {
        fail(
          path,
          'package with "exports" must declare "publint": "catalog:dev" in devDependencies',
        )
      }
    }

    const tsconfigRelative = path.replace(/package\.json$/, 'tsconfig.json')
    if (existsSync(resolve(root, tsconfigRelative))) {
      const tsconfig = readJsonc(tsconfigRelative)
      const extendsValue = tsconfig.extends
      if (typeof extendsValue !== 'string' || !extendsValue.startsWith('@inkstack/tsconfig/')) {
        fail(tsconfigRelative, 'must extend "@inkstack/tsconfig/<preset>.json"')
      } else {
        const subpath = extendsValue.slice('@inkstack/tsconfig'.length)
        if (!tsconfigExports.has(`.${subpath}`)) {
          fail(tsconfigRelative, `extends references missing export "${subpath}"`)
        }
      }
      if (json.devDependencies?.['@inkstack/tsconfig'] !== 'workspace:*') {
        fail(path, 'must declare "@inkstack/tsconfig": "workspace:*" in devDependencies')
      }
    }
  }
}

const packageDocFiles = ['AGENTS.md', 'CLAUDE.md', 'README.md']

function checkPackageDocs(relativeDir) {
  for (const file of packageDocFiles) {
    if (!existsSync(resolve(root, relativeDir, file))) {
      fail(`${relativeDir}/${file}`, 'package documentation is missing')
    }
  }

  const claudePath = resolve(root, relativeDir, 'CLAUDE.md')
  if (existsSync(claudePath) && readFileSync(claudePath, 'utf8').trim() !== '@AGENTS.md') {
    fail(`${relativeDir}/CLAUDE.md`, 'must contain only "@AGENTS.md"')
  }
}

if (existsSync(resolve(root, 'packages'))) {
  checkPackageDocs('packages')
  for (const entry of readdirSync(resolve(root, 'packages'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const relativeDir = `packages/${entry.name}`
    if (existsSync(resolve(root, relativeDir, 'package.json'))) checkPackageDocs(relativeDir)
  }
}

for (const [name, specifier] of Object.entries(catalogs.toolchain ?? {})) {
  if (typeof specifier !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(specifier)) {
    fail(
      'pnpm-workspace.yaml',
      `toolchain.${name} must be an exact version, got ${JSON.stringify(specifier)}`,
    )
  }
}

const rootJson = readJson('package.json')
const nvmrc = existsSync(resolve(root, '.nvmrc'))
  ? readFileSync(resolve(root, '.nvmrc'), 'utf8').trim()
  : ''
const nodeLowerBound = /(?:>=|\^|~)?\s*(\d+\.\d+\.\d+)/.exec(rootJson.engines?.node ?? '')?.[1]

if (!nvmrc) fail('.nvmrc', 'file is missing')
if (!nodeLowerBound)
  fail('package.json', 'engines.node must declare a concrete lower bound like >=26.12.0')
if (nvmrc && nodeLowerBound && nvmrc !== nodeLowerBound) {
  fail('.nvmrc', `version ${nvmrc} does not match engines.node lower bound ${nodeLowerBound}`)
}

const packageManager = /^pnpm@(.+)$/.exec(rootJson.packageManager ?? '')?.[1]
const devEnginesPackageManager = rootJson.devEngines?.packageManager?.version
if (!packageManager) {
  fail('package.json', 'packageManager must be "pnpm@<version>"')
} else if (packageManager !== devEnginesPackageManager) {
  fail(
    'package.json',
    `packageManager ${packageManager} does not match devEngines.packageManager.version ${devEnginesPackageManager}`,
  )
}

for (const warning of warnings) console.warn(`warning: ${warning}`)
if (errors.length > 0) {
  console.error(
    `check-manifests: ${manifests.length} manifest(s) checked, ${errors.length} error(s), ${warnings.length} warning(s)`,
  )
  for (const error of errors) console.error(`  error: ${error}`)
  process.exit(1)
}

console.log(
  `check-manifests: ${manifests.length} manifest(s) checked, 0 errors, ${warnings.length} warning(s)`,
)
