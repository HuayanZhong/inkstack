#!/usr/bin/env node
/**
 * 校验 Agent 指引文件的结构、预算与事实。
 *
 * 与前缀检查分开：check-manifests 管包清单，本脚本管 AGENTS.md / CLAUDE.md。
 * 规则归属见 .claude/rules/agent-docs.md。
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const isSelfTest = process.argv.includes('--self-test')

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.turbo',
  '.next',
  'dist',
  'build',
  'coverage',
  'openspec',
  '.agents',
  '.claude',
])
const PROJECT_PREFIX =
  /^(src|apps|packages|docs|scripts|openspec|test|infra|public|\.claude|\.agents|\.github)\//
const KNOWN_FILES = new Set([
  '.env.example',
  'module-federation.config.ts',
  'nest-cli.json',
  'next.config.ts',
  'package.json',
  'rspack.config.ts',
  'tsconfig.json',
  'turbo.json',
])
const BUILTIN_PNPM = new Set([
  'add',
  'approve-builds',
  'create',
  'dedupe',
  'deploy',
  'dlx',
  'doctor',
  'env',
  'exec',
  'fetch',
  'import',
  'init',
  'install',
  'link',
  'list',
  'ls',
  'outdated',
  'pack',
  'patch',
  'patch-commit',
  'prune',
  'publish',
  'rebuild',
  'remove',
  'root',
  'setup',
  'store',
  'uninstall',
  'unlink',
  'update',
  'why',
])
// 常驻规则在启动时加载；其余规则必须声明 paths。每条常驻都必须写明理由。
const ALWAYS_ON_RULES = new Map([
  ['cli-first.md', '决定所有任务使用哪个 CLI，必须先于任何文件读取'],
  ['git.md', '决定是否允许改工作区/分支/历史，必须先于任何 git 操作'],
  ['comments.md', '适用于所有代码编辑，且篇幅很短，按路径 scoping 几乎等于常驻'],
])

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

function readText(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

/** 手写区：跳过 BEGIN/END 标记块，行只算非空行，字符去掉所有空白。 */
function handArea(text) {
  const lines = []
  let inside = false
  for (const line of text.split('\n')) {
    if (/^<!--\s*BEGIN:/.test(line)) {
      inside = true
      continue
    }
    if (/^<!--\s*END:/.test(line)) {
      inside = false
      continue
    }
    if (!inside) lines.push(line)
  }
  return {
    lines: lines.filter((line) => line.trim().length > 0).length,
    chars: lines.join('\n').replace(/\s/g, '').length,
  }
}

function firstHeading(text) {
  const match = /^#\s+(.+)$/m.exec(text)
  return match ? match[1].trim() : null
}

function headingList(text) {
  return [...text.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim())
}

function stripFencedBlocks(text) {
  let inside = false
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inside = !inside
        return ''
      }
      return inside ? '' : line
    })
    .join('\n')
}

function fencedBlocks(text) {
  const blocks = []
  let current = null
  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line)) {
      if (current) {
        blocks.push(current)
        current = null
      } else {
        current = []
      }
      continue
    }
    if (current) current.push(line)
  }
  return blocks
}

function parseRootTree(text) {
  const lines = text.split('\n')
  const headingIndex = lines.findIndex((line) => /^##\s+目录\s*$/.test(line))
  if (headingIndex < 0) return null
  const fenceIndex = lines.findIndex((line, index) => index > headingIndex && /^\s*```/.test(line))
  if (fenceIndex < 0) return null

  const block = []
  for (let index = fenceIndex + 1; index < lines.length; index += 1) {
    if (/^\s*```/.test(lines[index])) break
    block.push(lines[index])
  }

  const result = { apps: [], packages: [] }
  let group = null
  for (const line of block) {
    const trimmed = line.trim()
    const indented = line.length !== line.trimStart().length
    if (!indented && /^[a-z0-9-]+\/$/.test(trimmed)) {
      group = trimmed === 'apps/' ? 'apps' : trimmed === 'packages/' ? 'packages' : null
      continue
    }
    if (!group || !indented) continue
    const match = /^([a-z0-9-]+)\//.exec(trimmed)
    if (match) result[group].push(match[1])
  }
  return result
}

function parsePackagesIndex(text) {
  const dirs = []
  for (const line of text.split('\n')) {
    if (!/^\s*\|/.test(line)) continue
    for (const match of line.matchAll(/\]\(([a-z0-9-]+)\/\)/g)) dirs.push(match[1])
  }
  return dirs
}

function diffIndex(expected, actual) {
  const expectedSet = new Set(expected)
  const actualSet = new Set(actual)
  return {
    missing: [...expectedSet].filter((item) => !actualSet.has(item)),
    extra: [...actualSet].filter((item) => !expectedSet.has(item)),
  }
}

function matchesExport(keys, subpath) {
  const normalized = subpath.replace(/^\.?\//, '')
  for (const key of keys) {
    const target = key.replace(/^\.\//, '')
    if (target === normalized) return true
    if (target.endsWith('/*') && normalized.startsWith(target.slice(0, -1))) return true
  }
  return false
}

function extractCommands(text) {
  const commands = []
  for (const block of fencedBlocks(text)) {
    for (const raw of block) {
      const line = raw.replace(/\s+#.*$/, '').trim()
      const filter = /^pnpm --filter (@inkstack\/[a-z0-9-]+) ([a-z][a-z0-9:_-]*)\b/.exec(line)
      if (filter) {
        commands.push({ kind: 'filter', name: filter[1], command: filter[2] })
        continue
      }
      const rootCommand = /^pnpm ([a-z][a-z0-9:_-]*)\b/.exec(line)
      if (rootCommand && !BUILTIN_PNPM.has(rootCommand[1])) {
        commands.push({ kind: 'root', command: rootCommand[1] })
      }
    }
  }
  return commands
}

function extractPortDeclarations(text) {
  const declarations = []
  for (const match of text.matchAll(/`([A-Z][A-Z0-9_]*)`[^（\n]{0,20}（默认 `:(\d+)`）/g)) {
    const name = match[1]
    if (name !== 'PORT' && !name.endsWith('_PORT')) continue
    declarations.push({ name, declared: match[2] })
  }
  return declarations
}

function evaluateReadmeH1({ heading, expected }) {
  return heading === expected
    ? []
    : [
        {
          level: 'error',
          message: `README H1 must be ${JSON.stringify(expected)}, got ${JSON.stringify(heading)}`,
        },
      ]
}

function evaluateReadmeSections({ type, headings, hasScripts }) {
  const normalized = headings.map((heading) => heading.replace(/[`*]/g, '').trim())
  const has = (names) => names.some((name) => normalized.includes(name))
  const issues = []

  if (type === 'root') {
    for (const section of ['目录', '开发', '文档']) {
      if (!normalized.includes(section)) {
        issues.push({ level: 'error', message: `README is missing section "${section}"` })
      }
    }
  }

  if (type === 'package') {
    if (hasScripts && !normalized.includes('命令')) {
      issues.push({ level: 'error', message: 'package README is missing section "命令"' })
    }
    if (!has(['使用', '消费', '消费方式', '创建客户端'])) {
      issues.push({ level: 'error', message: 'package README is missing a usage section' })
    }
  }

  if (type === 'app') {
    for (const section of ['运行', '相关文档']) {
      if (!normalized.includes(section)) {
        issues.push({ level: 'error', message: `app README is missing section "${section}"` })
      }
    }
  }

  return issues
}

function emptySections(text) {
  const empty = []
  let current = null
  for (const line of text.split('\n')) {
    const match = /^##\s+(.+)$/.exec(line)
    if (match) {
      if (current && !current.hasContent) empty.push(current.title)
      current = { title: match[1].trim(), hasContent: false }
      continue
    }
    if (current && line.trim() && !line.trim().startsWith('<!--')) current.hasContent = true
  }
  if (current && !current.hasContent) empty.push(current.title)
  return empty
}

function hasPlaceholder(text) {
  return /\b(?:TODO|TBD)\b/.test(text)
}

function collectAgentsFiles(directory = root, depth = 0) {
  const found = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (depth >= 3 || SKIP_DIRS.has(entry.name)) continue
      found.push(...collectAgentsFiles(full, depth + 1))
    } else if (entry.name === 'AGENTS.md') {
      found.push(full)
    }
  }
  return found.sort((left, right) => left.localeCompare(right))
}

function collectReadmeFiles(directory = root, depth = 0) {
  const found = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (depth >= 3 || SKIP_DIRS.has(entry.name)) continue
      found.push(...collectReadmeFiles(full, depth + 1))
    } else if (entry.name === 'README.md') {
      found.push(full)
    }
  }
  return found.sort((left, right) => left.localeCompare(right))
}

function classifyReadme(file) {
  const rel = relative(root, file).replaceAll('\\', '/')
  if (rel === 'README.md') return 'root'
  if (rel === 'packages/README.md') return 'packages-index'
  if (/^packages\/[^/]+\/README\.md$/.test(rel)) return 'package'
  if (/^apps\/[^/]+\/README\.md$/.test(rel)) return 'app'
  return 'docs'
}

function collectRuleFiles(directory = join(root, '.claude/rules'), depth = 0) {
  if (!existsSync(directory)) return []
  const found = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (depth >= 3) continue
      found.push(...collectRuleFiles(full, depth + 1))
    } else if (entry.name.endsWith('.md')) {
      found.push(full)
    }
  }
  return found.sort((left, right) => left.localeCompare(right))
}

/** 读取文件头部的 YAML frontmatter；解析失败显式返回错误，避免坏配置被静默忽略。 */
function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)
  if (!match) return { data: {}, error: null }
  try {
    return { data: parseYaml(match[1]) ?? {}, error: null }
  } catch (error) {
    return { data: {}, error: error.message }
  }
}

function evaluateRuleScope({ parseError, hasPathsKey, paths, allowlistReason }) {
  const issues = []
  if (parseError) {
    issues.push({ level: 'error', message: `invalid frontmatter: ${parseError}` })
    return issues
  }
  if (hasPathsKey && paths.length === 0) {
    issues.push({ level: 'error', message: '"paths" must be a non-empty string array' })
    return issues
  }
  if (paths.length > 0) return issues
  if (allowlistReason === undefined) {
    issues.push({
      level: 'error',
      message: 'rule must declare non-empty "paths" or be listed in ALWAYS_ON_RULES',
    })
    return issues
  }
  if (!allowlistReason.trim()) {
    issues.push({ level: 'error', message: 'always-on rule must document a reason' })
  }
  return issues
}

function evaluateRuleDiscoverability({ paths, linked }) {
  if (paths.length === 0) return []
  return linked
    ? []
    : [{ level: 'error', message: 'path-scoped rule must be linked from an AGENTS.md' }]
}

function clauseKey(line) {
  return line
    .replace(/^[-*]\s+/, '')
    .replace(/^#+\s+/, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*|]/g, '')
    .replace(/[\s，。；：、,.;:!?！？]/g, '')
    .toLowerCase()
}

function normalizeBullet(line) {
  return line
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/^-\s*/, '')
    .replace(/[\s，。；：、,.;:!?！？]/g, '')
}

function sectionBullets(text, heading) {
  const lines = text.split('\n')
  const start = lines.findIndex((line) => line.trim().startsWith(heading))
  if (start < 0) return []
  const bullets = []
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s/.test(lines[index])) break
    if (lines[index].trim().startsWith('- **')) bullets.push(lines[index])
  }
  return bullets
}

function evaluateBudget({ isRoot, lines, chars }) {
  const limit = isRoot ? { lines: 70, chars: 3200 } : { lines: 25, chars: 1000 }
  const issues = []
  if (lines > limit.lines) {
    issues.push({ level: 'error', message: `hand area has ${lines} lines, limit ${limit.lines}` })
  }
  if (chars > limit.chars) {
    issues.push({ level: 'error', message: `hand area has ${chars} chars, limit ${limit.chars}` })
  }
  return issues
}

function evaluateBridge({ isRoot, hasClaude, claudeText }) {
  if (!hasClaude) {
    return [{ level: 'error', message: 'CLAUDE.md is missing' }]
  }
  if (isRoot) {
    return claudeText.includes('@AGENTS.md')
      ? []
      : [{ level: 'error', message: 'root CLAUDE.md must import @AGENTS.md' }]
  }
  return claudeText.trim() === '@AGENTS.md'
    ? []
    : [{ level: 'error', message: 'CLAUDE.md must contain only "@AGENTS.md"' }]
}

function evaluateOpening({ isRoot, text }) {
  if (isRoot) return []
  return text.slice(0, 300).includes('补充根文件的规则')
    ? []
    : [{ level: 'error', message: 'missing opening line "补充根文件的规则"' }]
}

function evaluateVersion({ label, declared, actual }) {
  const clean = (value) => value.replace(/^[><=^~\s]+/, '').trim()
  if (!declared) return []
  return clean(declared) === clean(actual)
    ? []
    : [{ level: 'error', message: `${label} is ${declared}, repository pins ${actual}` }]
}

function evaluateLink({ target, exists }) {
  return exists ? [] : [{ level: 'error', message: `link target missing: ${target}` }]
}

function evaluateCommand({ command, available }) {
  return available ? [] : [{ level: 'error', message: `script "${command}" does not exist` }]
}

function evaluatePort({ name, declared, actual }) {
  if (!actual) return [{ level: 'error', message: `${name} is not defined in .env.example` }]
  return declared === actual
    ? []
    : [
        {
          level: 'error',
          message: `${name} default ${declared} does not match .env.example ${actual}`,
        },
      ]
}

function evaluateCompletion({ isRoot, text }) {
  const issues = []
  if (/完成(?:前|标准)[^\n]*`pnpm typecheck`/.test(text)) {
    issues.push({ level: 'error', message: 'completion gate must be "pnpm verify", not typecheck' })
  }
  if (isRoot && !text.includes('完成前跑 `pnpm verify`')) {
    issues.push({ level: 'error', message: 'root must define completion gate as "pnpm verify"' })
  }
  return issues
}

function evaluateShadcn({ commandFiles, cwdViolations }) {
  const issues = []
  if (commandFiles.length !== 1) {
    issues.push({
      level: 'error',
      message: `shadcn add command must appear in exactly one AGENTS.md, found ${commandFiles.length}`,
    })
  } else if (!commandFiles[0].text.includes('-c apps/shell')) {
    issues.push({
      level: 'error',
      message: 'shadcn command must use "-c apps/shell" from repo root',
    })
  }
  if (cwdViolations.length > 0) {
    issues.push({
      level: 'error',
      message: 'shadcn command must not instruct running from the app directory',
    })
  }
  return issues
}

function evaluateInvariants({ designBullets, rootBullets }) {
  if (designBullets.length !== rootBullets.length) {
    return [
      {
        level: 'error',
        message: `root has ${rootBullets.length} invariants, DESIGN-RECORD has ${designBullets.length}`,
      },
    ]
  }
  const issues = []
  for (let index = 0; index < designBullets.length; index += 1) {
    if (normalizeBullet(designBullets[index]) !== normalizeBullet(rootBullets[index])) {
      issues.push({ level: 'error', message: `invariant #${index + 1} differs from DESIGN-RECORD` })
    }
  }
  return issues
}

function findDuplicateClauses(docs) {
  const map = new Map()
  for (const doc of docs) {
    for (const raw of doc.text.split('\n')) {
      const line = raw.trim()
      if (!line || line.startsWith('<!--')) continue
      if (line.includes('补充根文件的规则')) continue
      const key = clauseKey(line)
      if (key.length < 16) continue
      // 一句摘要 + 链接属于允许的指针式复述。
      if (line.includes('](') && key.length < 60) continue
      if (!map.has(key)) map.set(key, { line, files: new Set() })
      map.get(key).files.add(doc.file)
    }
  }
  return [...map.values()].filter((entry) => entry.files.size > 1)
}

function loadFacts() {
  const rootPackage = readJson(join(root, 'package.json'))
  const workspace = parseYaml(readText(join(root, 'pnpm-workspace.yaml')))
  const catalogs = workspace.catalogs ?? {}
  const env = new Map()
  for (const line of readText(join(root, '.env.example')).split('\n')) {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line.trim())
    if (match) env.set(match[1], match[2].trim())
  }
  const packages = new Map()
  const packageDirs = { apps: new Set(), packages: new Set() }
  for (const group of ['apps', 'packages']) {
    const groupDir = join(root, group)
    if (!existsSync(groupDir)) continue
    for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const manifestPath = join(groupDir, entry.name, 'package.json')
      if (!existsSync(manifestPath)) continue
      const manifest = readJson(manifestPath)
      packages.set(manifest.name, {
        dir: `${group}/${entry.name}`,
        scripts: new Set(Object.keys(manifest.scripts ?? {})),
        exports: new Set(Object.keys(manifest.exports ?? {})),
      })
      packageDirs[group].add(entry.name)
    }
  }
  return {
    node: readText(join(root, '.nvmrc')).trim(),
    pnpm: (rootPackage.packageManager ?? '').replace(/^pnpm@/, ''),
    typescript: catalogs.toolchain?.typescript ?? '',
    openspec: catalogs.toolchain?.['@fission-ai/openspec'] ?? '',
    rootScripts: new Set(Object.keys(rootPackage.scripts ?? {})),
    packages,
    packageDirs,
    env,
    design: readText(join(root, 'docs/architecture/DESIGN-RECORD.md')),
  }
}

function evaluateReferences({ text, dir, facts }) {
  const issues = []

  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1]
    if (/^(https?:|mailto:|#)/.test(target)) continue
    const clean = target.split('#')[0].split('?')[0]
    if (!clean) continue
    issues.push(...evaluateLink({ target: clean, exists: existsSync(resolve(dir, clean)) }))
  }

  for (const match of text.matchAll(/`([^`]+)`/g)) {
    const target = match[1]
    if (/[\s<>*$|{}:]/.test(target)) continue
    if (/^(https?:|@|\/|~\/)/.test(target)) continue
    if (!target.includes('/') && !KNOWN_FILES.has(target)) continue
    if (/^(src|test|dist|openwiki|interactive|images)\/?$/.test(target)) continue
    if (!PROJECT_PREFIX.test(target) && !KNOWN_FILES.has(target)) continue
    // 子树文档里的 docs/、openspec/ 等路径按仓库根书写的，先查文件目录再回退根。
    const exists = existsSync(resolve(dir, target)) || existsSync(resolve(root, target))
    issues.push(...evaluateLink({ target, exists }))
  }

  for (const match of text.matchAll(/`pnpm --filter (@inkstack\/[a-z0-9-]+) ([^`]+)`/g)) {
    const [, name, expression] = match
    const pkg = facts.packages.get(name)
    for (const command of expression.split('|').map((part) => part.trim())) {
      if (!command || /[<*>$]/.test(command)) continue
      issues.push(
        ...evaluateCommand({
          command: `${name} ${command}`,
          available: Boolean(pkg?.scripts.has(command)),
        }),
      )
    }
  }

  for (const match of text.matchAll(/`pnpm ([a-z][a-z0-9:_-]*)`/g)) {
    const command = match[1]
    if (BUILTIN_PNPM.has(command)) continue
    issues.push(...evaluateCommand({ command, available: facts.rootScripts.has(command) }))
  }

  return issues
}

function checkReadme(file, text, facts) {
  const dir = dirname(file)
  const label = relative(root, file).replaceAll('\\', '/')
  const relDir = relative(root, dir).replaceAll('\\', '/')
  const type = classifyReadme(file)
  const issues = []
  const add = (list) => issues.push(...list.map((issue) => ({ ...issue, file: label })))

  add(evaluateReferences({ text: stripFencedBlocks(text), dir, facts }))

  for (const command of extractCommands(text)) {
    if (command.kind === 'filter') {
      const pkg = facts.packages.get(command.name)
      if (!pkg?.scripts.has(command.command)) {
        add([
          { level: 'error', message: `script "${command.name} ${command.command}" does not exist` },
        ])
      }
    } else if (!facts.rootScripts.has(command.command)) {
      add([{ level: 'error', message: `script "${command.command}" does not exist` }])
    }
  }

  for (const { name, declared } of extractPortDeclarations(stripFencedBlocks(text))) {
    add(evaluatePort({ name, declared, actual: facts.env.get(name) }))
  }

  const headings = headingList(text)
  const pkgEntry = [...facts.packages.entries()].find(([, info]) => info.dir === relDir)
  const pkgName = pkgEntry?.[0]
  const pkg = pkgEntry?.[1]

  add(evaluateReadmeSections({ type, headings, hasScripts: Boolean(pkg && pkg.scripts.size > 0) }))

  if (type === 'package' || type === 'app') {
    if (!pkgName) {
      add([{ level: 'error', message: `no package.json found for ${relDir}` }])
    } else {
      add(evaluateReadmeH1({ heading: firstHeading(text), expected: pkgName }))
    }
  }

  for (const title of emptySections(text)) {
    add([{ level: 'error', message: `section "${title}" is empty` }])
  }

  if (hasPlaceholder(text)) {
    add([{ level: 'error', message: 'README contains a TODO/TBD placeholder' }])
  }

  if (type === 'root') {
    const tree = parseRootTree(text)
    if (!tree) {
      add([{ level: 'error', message: 'root README is missing a parsable "## 目录" tree' }])
    } else {
      for (const group of ['apps', 'packages']) {
        const expected = [...facts.packageDirs[group]]
        const diff = diffIndex(expected, tree[group])
        for (const name of diff.missing) {
          add([{ level: 'error', message: `root README ${group} tree is missing "${name}"` }])
        }
        for (const name of diff.extra) {
          add([{ level: 'error', message: `root README ${group} tree lists unknown "${name}"` }])
        }
      }
    }
  }

  if (type === 'packages-index') {
    const diff = diffIndex([...facts.packageDirs.packages], parsePackagesIndex(text))
    for (const name of diff.missing) {
      add([{ level: 'error', message: `packages/README.md index is missing "${name}"` }])
    }
    for (const name of diff.extra) {
      add([{ level: 'error', message: `packages/README.md index lists unknown "${name}"` }])
    }
  }

  if (type === 'package') {
    const inline = stripFencedBlocks(text)
    for (const match of inline.matchAll(/`(@inkstack\/[a-z0-9-]+)\/([^`\s]+)`/g)) {
      const [, name, subpath] = match
      if (/[<>]/.test(subpath)) continue
      const info = facts.packages.get(name)
      if (!info) continue
      if (!matchesExport(info.exports, subpath)) {
        add([{ level: 'error', message: `documented export "${name}/${subpath}" does not exist` }])
      }
    }
  }

  return issues
}

function checkFile(file, text, facts) {
  const isRoot = file === join(root, 'AGENTS.md')
  const dir = dirname(file)
  const label = relative(root, file).replaceAll('\\', '/')
  const issues = []
  const add = (list) => issues.push(...list.map((issue) => ({ ...issue, file: label })))

  const claudePath = join(dir, 'CLAUDE.md')
  add(
    evaluateBridge({
      isRoot,
      hasClaude: existsSync(claudePath),
      claudeText: readText(claudePath),
    }),
  )
  add(evaluateOpening({ isRoot, text }))
  add(evaluateBudget({ isRoot, ...handArea(text) }))
  add(evaluateCompletion({ isRoot, text }))

  add(evaluateReferences({ text, dir, facts }))

  const versionChecks = [
    ['Node', /Node\s*`([^`]+)`/g, facts.node],
    ['pnpm', /pnpm\s+`(\d+\.\d+\.\d+)`/g, facts.pnpm],
    ['TypeScript', /TypeScript\s*`(\d+\.\d+\.\d+)`/g, facts.typescript],
    ['openspec', /openspec[^\n。]*?`(\d+\.\d+\.\d+)`/g, facts.openspec],
  ]
  for (const [label, pattern, actual] of versionChecks) {
    for (const match of text.matchAll(pattern)) {
      add(evaluateVersion({ label, declared: match[1], actual }))
    }
  }

  for (const match of text.matchAll(/`([A-Z][A-Z0-9_]*PORT)`（默认 `:(\d+)`）/g)) {
    add(evaluatePort({ name: match[1], declared: match[2], actual: facts.env.get(match[1]) }))
  }

  return issues
}

function runSelfTest() {
  const results = []
  const check = (name, condition) => {
    results.push({ name, ok: Boolean(condition) })
  }
  const area = handArea(`a\n<!-- BEGIN:x -->\n${'b'.repeat(5000)}\n<!-- END:x -->\nc`)
  check('marker block excluded', area.lines === 2 && area.chars === 2)
  check(
    'root budget boundary ok',
    evaluateBudget({ isRoot: true, lines: 70, chars: 3200 }).length === 0,
  )
  check(
    'subtree char overflow',
    evaluateBudget({ isRoot: false, lines: 10, chars: 1001 }).length === 1,
  )
  check(
    'subtree line overflow',
    evaluateBudget({ isRoot: false, lines: 26, chars: 10 }).length === 1,
  )
  check(
    'bridge missing',
    evaluateBridge({ isRoot: false, hasClaude: false, claudeText: '' }).length === 1,
  )
  check(
    'bridge impure',
    evaluateBridge({ isRoot: false, hasClaude: true, claudeText: '@AGENTS.md\nx' }).length === 1,
  )
  check(
    'root bridge ok',
    evaluateBridge({ isRoot: true, hasClaude: true, claudeText: '# CLAUDE\n\n@AGENTS.md' })
      .length === 0,
  )
  check('opening missing', evaluateOpening({ isRoot: false, text: '# x' }).length === 1)
  check('opening ok', evaluateOpening({ isRoot: false, text: '补充根文件的规则。' }).length === 0)
  check(
    'version mismatch',
    evaluateVersion({ label: 'Node', declared: '>=20.0.0', actual: '26.12.0' }).length === 1,
  )
  check(
    'version normalized',
    evaluateVersion({ label: 'Node', declared: '>=26.12.0', actual: '26.12.0' }).length === 0,
  )
  check('link missing', evaluateLink({ target: 'x.md', exists: false }).length === 1)
  check('link ok', evaluateLink({ target: 'x.md', exists: true }).length === 0)
  check('command missing', evaluateCommand({ command: 'dev', available: false }).length === 1)
  check('command ok', evaluateCommand({ command: 'dev', available: true }).length === 0)
  check('port mismatch', evaluatePort({ name: 'A_PORT', declared: '1', actual: '2' }).length === 1)
  check(
    'completion typecheck',
    evaluateCompletion({ isRoot: false, text: '完成前跑 `pnpm typecheck`' }).length === 1,
  )
  check(
    'completion verify',
    evaluateCompletion({ isRoot: true, text: '完成前跑 `pnpm verify`' }).length === 0,
  )
  const duplicates = findDuplicateClauses([
    { file: 'a.md', text: '- 依赖只通过 catalog 引用，禁止裸 semver。' },
    { file: 'b.md', text: '- 依赖只通过 catalog 引用，禁止裸 semver。' },
  ])
  check('duplicate detected', duplicates.length === 1)
  const pointers = findDuplicateClauses([
    { file: 'a.md', text: '- 预算见 [`agent-docs.md`](../x.md)。' },
    { file: 'b.md', text: '- 预算见 [`agent-docs.md`](../x.md)。' },
  ])
  check('pointer not duplicate', pointers.length === 0)
  check('shadcn missing', evaluateShadcn({ commandFiles: [], cwdViolations: [] }).length === 1)
  check(
    'shadcn duplicated',
    evaluateShadcn({
      commandFiles: [{ text: 'x -c apps/shell' }, { text: 'y -c apps/shell' }],
      cwdViolations: [],
    }).length === 1,
  )
  check(
    'shadcn wrong cwd',
    evaluateShadcn({
      commandFiles: [{ text: 'x -c apps/shell' }],
      cwdViolations: ['a.md'],
    }).length === 1,
  )
  check(
    'shadcn ok',
    evaluateShadcn({
      commandFiles: [{ text: 'x -c apps/shell' }],
      cwdViolations: [],
    }).length === 0,
  )
  check(
    'invariant mismatch',
    evaluateInvariants({ designBullets: ['- **A**：x'], rootBullets: ['- **B**：x'] }).length === 1,
  )
  check(
    'invariant ok',
    evaluateInvariants({ designBullets: ['- **A**：x'], rootBullets: ['- **A**：x'] }).length === 0,
  )

  check(
    'rule paths ok',
    evaluateRuleScope({
      parseError: null,
      hasPathsKey: true,
      paths: ['**/*.ts'],
      allowlistReason: undefined,
    }).length === 0,
  )
  check(
    'rule missing scope',
    evaluateRuleScope({
      parseError: null,
      hasPathsKey: false,
      paths: [],
      allowlistReason: undefined,
    }).length === 1,
  )
  check(
    'rule empty paths',
    evaluateRuleScope({
      parseError: null,
      hasPathsKey: true,
      paths: [],
      allowlistReason: undefined,
    }).length === 1,
  )
  check(
    'rule allowlisted',
    evaluateRuleScope({
      parseError: null,
      hasPathsKey: false,
      paths: [],
      allowlistReason: 'workflow rule',
    }).length === 0,
  )
  check(
    'rule allowlist reason missing',
    evaluateRuleScope({
      parseError: null,
      hasPathsKey: false,
      paths: [],
      allowlistReason: '   ',
    }).length === 1,
  )
  check(
    'rule frontmatter broken',
    evaluateRuleScope({
      parseError: 'bad yaml',
      hasPathsKey: false,
      paths: [],
      allowlistReason: undefined,
    }).length === 1,
  )
  check(
    'rule scoped linked',
    evaluateRuleDiscoverability({ paths: ['**/*.ts'], linked: true }).length === 0,
  )
  check(
    'rule scoped unlinked',
    evaluateRuleDiscoverability({ paths: ['**/*.ts'], linked: false }).length === 1,
  )
  check(
    'rule always-on unlinked',
    evaluateRuleDiscoverability({ paths: [], linked: false }).length === 0,
  )
  const frontmatter = parseFrontmatter('---\npaths:\n  - "**/*.test.ts"\n---\n# x')
  check(
    'frontmatter paths',
    Array.isArray(frontmatter.data.paths) && frontmatter.data.paths[0] === '**/*.test.ts',
  )
  check('frontmatter broken yaml', parseFrontmatter('---\npaths: [\n---\n').error !== null)

  check('readme classification root', classifyReadme(join(root, 'README.md')) === 'root')
  check(
    'readme classification package',
    classifyReadme(join(root, 'packages/api-client/README.md')) === 'package',
  )
  check('readme classification app', classifyReadme(join(root, 'apps/shell/README.md')) === 'app')
  check(
    'readme classification docs',
    classifyReadme(join(root, 'docs/architecture/README.md')) === 'docs',
  )

  const missingIndex = diffIndex(['api-client', 'config'], ['config'])
  check(
    'index missing detected',
    missingIndex.missing.length === 1 && missingIndex.missing[0] === 'api-client',
  )
  const extraIndex = diffIndex(['config'], ['config', 'ghost'])
  check('index extra detected', extraIndex.extra.length === 1 && extraIndex.extra[0] === 'ghost')
  const equalIndex = diffIndex(['config'], ['config'])
  check('index equal', equalIndex.missing.length === 0 && equalIndex.extra.length === 0)

  const tree = parseRootTree(
    '# x\n\n## 目录\n\n```text\napps/\n  shell/\npackages/\n  config/\n```\n',
  )
  check('root tree parsed', tree?.apps[0] === 'shell' && tree?.packages[0] === 'config')

  const table = parsePackagesIndex('| [`config`](config/) | x |\n| [`ui`](ui/) | y |')
  check('packages index parsed', table.length === 2 && table[1] === 'ui')

  check('readme h1 mismatch', evaluateReadmeH1({ heading: '@x', expected: '@y' }).length === 1)
  check('readme h1 match', evaluateReadmeH1({ heading: '@y', expected: '@y' }).length === 0)

  check(
    'readme package missing command section',
    evaluateReadmeSections({ type: 'package', headings: ['使用'], hasScripts: true }).length === 1,
  )
  check(
    'readme app missing run section',
    evaluateReadmeSections({ type: 'app', headings: ['相关文档'], hasScripts: false }).length === 1,
  )
  check(
    'readme sections complete',
    evaluateReadmeSections({ type: 'package', headings: ['使用', '命令'], hasScripts: true })
      .length === 0,
  )

  check('empty section detected', emptySections('## A\n\n## B\nx').length === 1)
  check('placeholder detected', hasPlaceholder('TODO: fill this'))
  check('placeholder absent', !hasPlaceholder('已完成'))

  const commands = extractCommands('```bash\npnpm --filter @inkstack/bff dev # url\npnpm dev\n```')
  check(
    'fenced filter command extracted',
    commands.some(
      (command) =>
        command.kind === 'filter' && command.name === '@inkstack/bff' && command.command === 'dev',
    ),
  )
  check(
    'fenced root command extracted',
    commands.some((command) => command.kind === 'root' && command.command === 'dev'),
  )

  const ports = extractPortDeclarations('`CANVAS_PORT` 控制（默认 `:4002`）')
  check(
    'port declaration extracted',
    ports.length === 1 && ports[0].name === 'CANVAS_PORT' && ports[0].declared === '4002',
  )

  check('export exact match', matchesExport(new Set(['./globals.css']), 'globals.css'))
  check('export wildcard match', matchesExport(new Set(['./components/*']), 'components/button'))
  check('export missing', !matchesExport(new Set(['./components/*']), 'lib/x'))

  const failed = results.filter((result) => !result.ok)
  for (const result of failed) console.error(`self-test failed: ${result.name}`)
  console.log(`self-test: ${results.length - failed.length}/${results.length} passed`)
  if (failed.length > 0) process.exit(1)
}

if (isSelfTest) {
  runSelfTest()
} else {
  const facts = loadFacts()
  const agentsFiles = collectAgentsFiles()
  const readmeFiles = collectReadmeFiles()
  const docs = agentsFiles.map((file) => ({
    file: relative(root, file).replaceAll('\\', '/'),
    text: readText(file),
  }))
  const issues = []
  const ruleFiles = collectRuleFiles()
  const agentsCorpus = docs.map((doc) => doc.text).join('\n')
  const ruleStats = { alwaysOn: 0, scoped: 0 }
  for (const ruleFile of ruleFiles) {
    const label = relative(join(root, '.claude/rules'), ruleFile).replaceAll('\\', '/')
    const parsed = parseFrontmatter(readText(ruleFile))
    const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : {}
    const rawPaths = data.paths
    const paths = Array.isArray(rawPaths)
      ? rawPaths.filter((value) => typeof value === 'string' && value.trim().length > 0)
      : []
    const hasPathsKey = Object.hasOwn(data, 'paths')
    const allowlistReason = ALWAYS_ON_RULES.get(label)
    for (const issue of evaluateRuleScope({
      parseError: parsed.error,
      hasPathsKey,
      paths,
      allowlistReason,
    })) {
      issues.push({ ...issue, file: `.claude/rules/${label}` })
    }
    const linked = agentsCorpus.includes(`.claude/rules/${label}`)
    for (const issue of evaluateRuleDiscoverability({ paths, linked })) {
      issues.push({ ...issue, file: `.claude/rules/${label}` })
    }
    if (paths.length > 0) ruleStats.scoped += 1
    else if (allowlistReason !== undefined) ruleStats.alwaysOn += 1
  }

  for (const doc of docs) {
    issues.push(...checkFile(join(root, doc.file), doc.text, facts))
  }

  for (const file of readmeFiles) {
    issues.push(...checkReadme(file, readText(file), facts))
  }

  const commandFiles = docs.filter((doc) => doc.text.includes('shadcn@latest add'))
  const cwdViolations = docs
    .filter((doc) => /shadcn[^\n]*(应用目录|cd apps\/shell)/.test(doc.text))
    .map((doc) => doc.file)
  for (const issue of evaluateShadcn({ commandFiles, cwdViolations })) {
    issues.push({ ...issue, file: commandFiles[0]?.file ?? 'AGENTS.md' })
  }

  const designBullets = sectionBullets(facts.design, '## 3.')
  const rootText = readText(join(root, 'AGENTS.md'))
  const rootBullets = sectionBullets(rootText, '## 架构不变量')
  for (const issue of evaluateInvariants({ designBullets, rootBullets })) {
    issues.push({ ...issue, file: 'AGENTS.md' })
  }

  const duplicates = findDuplicateClauses(docs)
  for (const duplicate of duplicates) {
    issues.push({
      level: 'warning',
      file: [...duplicate.files].join(', '),
      message: `duplicate clause: ${duplicate.line.slice(0, 60)}`,
    })
  }

  const errors = issues.filter((issue) => issue.level === 'error')
  const warnings = issues.filter((issue) => issue.level === 'warning')
  for (const issue of errors) console.error(`error: ${issue.file}: ${issue.message}`)
  for (const issue of warnings) console.warn(`warning: ${issue.file}: ${issue.message}`)
  console.log(
    `check-agent-docs: ${agentsFiles.length} AGENTS file(s), ${readmeFiles.length} README file(s) checked, ${ruleFiles.length} rule(s) (${ruleStats.alwaysOn} always-on, ${ruleStats.scoped} scoped), ${errors.length} error(s), ${warnings.length} warning(s)`,
  )
  if (errors.length > 0) process.exit(1)
}
