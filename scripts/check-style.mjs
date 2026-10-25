#!/usr/bin/env node
/**
 * 对照 .claude/rules/design-system.md 校验源码与构建产物。
 *
 * `pnpm check:styles` 跑 self-test + 源码/契约检查；
 * `pnpm check:styles:build` 在 production build 之后检查 CSS 产物。
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = join(import.meta.dirname, '..')
const contractFile = '.claude/rules/design-system.md'
const tokenFile = 'packages/ui/styles/globals.css'
const scanDirs = ['apps/shell/src', 'apps/canvas/src', 'packages/ui/src']

const requiredSections = [
  '## 1. 风格定调',
  '## 2. 颜色',
  '## 3. 数值与间距',
  '## 4. 字体',
  '## 5. 布局',
  '## 6. 组件写法',
  '## 7. 签名与动效',
  '## 8. 暗色',
  '## 9. 文案与可访问性',
  '## 10. 变更流程',
]

const ciChecks = new Set([
  'COLOR-01',
  'COLOR-02',
  'COLOR-03',
  'FONT-01',
  'FONT-02',
  'VALUE-01',
  'VALUE-04',
  'SURFACE-01',
  'LAYOUT-01',
  'LAYOUT-03',
  'STATE-01',
  'MOTION-01',
  'SIGNATURE-01',
  'SIGNATURE-02',
  'COMP-01',
  'COMP-02',
  'DARK-01',
  'COPY-04',
  'BUILT-01',
  'BUILT-02',
  'CONTRACT-01',
  'CONTRACT-02',
  'CONTRACT-04',
])

const pageFilePattern =
  /^apps\/shell\/src\/app\/(?:.+\/)?(?:page|not-found|error|global-error|loading|forbidden|unauthorized)\.tsx$/
const componentFilePattern = /^apps\/shell\/src\/app\/_components\/.+\.tsx$/

const allowedKeyframes = new Set(['artboard-in', 'handle-in', 'ink-in', 'brush-reveal'])
const allowedAnimateClasses = new Set(['pulse', 'none'])
const allowedDurationMs = new Set([300, 520, 720, 760])
const allowedDelayMs = new Set([120, 160, 230, 420])
const allowedEasing = '0.22, 1, 0.36, 1'
const brushPath =
  'M2 9C45 2 92 3 132 8C172 13 207 7 238 4L238 9C205 13 169 19 129 14C88 9 45 8 2 16Z'
const animationKeywords = new Set([
  'alternate',
  'alternate-reverse',
  'backwards',
  'both',
  'ease',
  'ease-in',
  'ease-in-out',
  'ease-out',
  'forwards',
  'infinite',
  'inherit',
  'initial',
  'linear',
  'none',
  'normal',
  'paused',
  'reverse',
  'revert',
  'running',
  'step-end',
  'step-start',
  'unset',
  'var',
])

// 豁免必须逐条说明 reason/removeWhen；当前没有需要豁免的写法。
// 令牌文件与 public 资产本来就不在扫描范围，不需要 allowlist。
const allowlist = []

const styleEntries = [
  {
    file: 'apps/shell/src/app/globals.css',
    checks: [
      {
        regex: /@import\s+['"]@inkstack\/ui\/globals\.css['"]/,
        message: '缺少对 @inkstack/ui/globals.css 的导入',
      },
      {
        regex: /@source\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/packages\/ui\/src['"]/,
        message: '缺少指向 packages/ui/src 的 @source',
      },
      {
        regex: /@source\s+['"]\.\.\/\*\*\/\*\.\{ts,tsx\}['"]/,
        message: '缺少指向应用源码的 @source（Turbopack 下会导致页面无样式）',
      },
    ],
  },
  {
    file: 'apps/canvas/src/index.css',
    checks: [
      {
        regex: /@import\s+['"]@inkstack\/ui\/globals\.css['"]/,
        message: '缺少对 @inkstack/ui/globals.css 的导入',
      },
      {
        regex: /@source\s+['"]\.\.\/\.\.\/\.\.\/packages\/ui\/src['"]/,
        message: '缺少指向 packages/ui/src 的 @source',
      },
    ],
  },
]

const namedColors =
  'black|white|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|tomato|gold|gray|grey|brown|navy|maroon|olive|silver|beige|ivory|khaki|coral|salmon|plum|orchid|lavender|turquoise|aqua|magenta|tan|wheat'

const patterns = {
  colorLiteral: /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch|lab|lch|hwb|color)\(/i,
  arbitraryColor: /\[[^\]]*(?:#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch|lab|lch|hwb|color)\()/i,
  arbitraryNamedColor: new RegExp(`\\[(?:${namedColors})\\]`, 'i'),
  inlineStyleColor:
    /style=\{\{[^}]*(?:\b(?:color|backgroundColor|background|backgroundImage|border|borderColor|fill|stroke|textDecorationColor|caretColor|accentColor|outlineColor)\b)\s*:/i,
  cssVarDefinition: /(?:^|[{;\s])--[a-z0-9-]+\s*:/i,
  paletteClass: new RegExp(
    `\\b(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration|accent|caret|ring-offset)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\\b|\\b(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration|accent|caret|ring-offset)-(?:white|black)\\b`,
    'i',
  ),
  cssNamedColor: new RegExp(
    `(?:^|[;{\\s])(?:color|background(?:-color)?|border(?:-color)?|fill|stroke)\\s*:\\s*(?:${namedColors})\\b`,
    'i',
  ),
  nextFont: /next\/font/,
  fontFamily: /font-family\s*:/i,
  fontDisplay: /\bfont-display\b(?!-stack)/,
  fontArbitrary: /\bfont-\[[^\]]+\]/,
  keyframes: /@keyframes\s+([A-Za-z_][\w-]*)/,
  animationName: /\banimation(?:-name)?\s*:\s*([^;]+)/i,
  animateClass: /\banimate-([a-z][a-z-]*)\b/g,
  duration: /(\d+(?:\.\d+)?)(ms|s)\b/g,
  cubicBezier: /cubic-bezier\(([^)]*)\)/g,
  darkSelector: /\.dark\b/,
  darkClassSwitch: /\bclassList\.(?:add|remove|toggle)\(\s*['"]dark['"]/,
  themeToggle: /\b(?:setTheme|ThemeProvider|ModeToggle)\b/,
  motionLine: /\b(?:animation|transition|animationDelay|transitionDelay)\b/,
  tailwindDuration: /\bduration-(\d+)\b/g,
  tailwindDelay: /\bdelay-(\d+)\b/g,
  tailwindEase: /\bease-(?:in|out|in-out|linear)\b/,
  roundedClass: /\brounded-(?!full\b|none\b)(?:[a-z0-9]|\[)|\brounded\b(?![-a-z])/,
  shadowClass: /\bshadow-(?!lg\b|md\b|none\b)(?:[a-z0-9]|\[)|\bshadow\b(?![-a-z])/,
  surfaceEffect:
    /\b(?:bg-gradient-to-[a-z]+|bg-linear-to-[a-z]+|bg-clip-text|backdrop-blur(?:-[a-z0-9]+)?|backdrop-filter|drop-shadow(?:-[a-z0-9]+)?)\b|bg-\[[^\]]*(?:linear|radial|conic)-gradient/i,
  hrefFragment: /href=["']#[^"']*["']/g,
  url: /https?:\/\/[^\s"'<>]+/g,
}

const compiledAllowlist = allowlist.map((entry) => ({
  ...entry,
  regex: new RegExp(entry.pattern),
}))

function violation(file, line, id, message, fix) {
  return { file, line, id, message, fix }
}

function isAllowed(file, line) {
  return compiledAllowlist.some((entry) => entry.file === file && entry.regex.test(line))
}

function stripComments(text, isCss) {
  let result = ''
  let inString = null
  let inLineComment = false
  let inBlockComment = false

  for (let index = 0; index < text.length; index += 1) {
    const current = text[index]
    const next = text[index + 1]

    if (inLineComment) {
      if (current === '\n') {
        inLineComment = false
        result += '\n'
      } else {
        result += ' '
      }
      continue
    }

    if (inBlockComment) {
      if (current === '*' && next === '/') {
        inBlockComment = false
        result += '  '
        index += 1
      } else {
        result += current === '\n' ? '\n' : ' '
      }
      continue
    }

    if (inString) {
      result += current
      if (current === '\\') {
        result += text[index + 1] ?? ''
        index += 1
      } else if (current === inString) {
        inString = null
      }
      continue
    }

    if (current === '"' || current === "'" || (!isCss && current === '`')) {
      inString = current
      result += current
      continue
    }

    if (!isCss && current === '/' && next === '/') {
      inLineComment = true
      result += '  '
      index += 1
      continue
    }

    if (current === '/' && next === '*') {
      inBlockComment = true
      result += '  '
      index += 1
      continue
    }

    result += current
  }

  return result
}

function animationNames(value) {
  const cleaned = value
    .replace(/cubic-bezier\([^)]*\)|steps\([^)]*\)|var\([^)]*\)/g, ' ')
    .replace(/\d+(?:\.\d+)?(?:ms|s)\b/g, ' ')
  return (cleaned.match(/[A-Za-z_][\w-]*/g) ?? []).filter((token) => !animationKeywords.has(token))
}

function toMilliseconds(value, unit) {
  return unit === 's' ? Number(value) * 1000 : Number(value)
}

function checkTimeValue(file, lineNumber, ms, kind, violations) {
  const allowed = kind === 'delay' ? allowedDelayMs : allowedDurationMs
  if (!allowed.has(ms)) {
    violations.push(
      violation(
        file,
        lineNumber,
        'VALUE-01',
        `${kind === 'delay' ? '延迟' : '时长'} ${ms}ms 不在白名单`,
        `时长只使用 ${[...allowedDurationMs].join(' / ')}ms，延迟只使用 ${[...allowedDelayMs].join(' / ')}ms`,
      ),
    )
  }
}

function checkMotion(file, lineNumber, line, violations) {
  const keyframes = line.match(patterns.keyframes)
  if (keyframes && !allowedKeyframes.has(keyframes[1])) {
    violations.push(
      violation(
        file,
        lineNumber,
        'MOTION-01',
        `未列入白名单的 @keyframes：${keyframes[1]}`,
        '只使用 artboard-in / handle-in / ink-in / brush-reveal',
      ),
    )
  }

  const animation = line.match(patterns.animationName)
  if (animation) {
    if (/\bvar\(/.test(animation[1])) {
      violations.push(
        violation(
          file,
          lineNumber,
          'MOTION-01',
          '动画名通过 var() 隐藏',
          '动画名必须显式写在 animation / animation-name 中',
        ),
      )
    }

    for (const name of animationNames(animation[1])) {
      if (name !== 'none' && !allowedKeyframes.has(name)) {
        violations.push(
          violation(
            file,
            lineNumber,
            'MOTION-01',
            `未列入白名单的动画：${name}`,
            '只使用四个入场动画；加载态用 animate-pulse',
          ),
        )
      }
    }
  }

  if (patterns.motionLine.test(line)) {
    const durationDecl = line.match(/\b(?:animation|transition)-duration\s*:\s*([^;]+)/i)
    const delayDecl = line.match(/\b(?:animation|transition)-delay\s*:\s*([^;]+)/i)
    const camelDuration = line.match(
      /\b(?:animationDuration|transitionDuration)\s*:\s*['"]?([^,'"}\s]+)/i,
    )
    const camelDelay = line.match(/\b(?:animationDelay|transitionDelay)\s*:\s*['"]?([^,'"}\s]+)/i)
    const shorthand = line.match(/\b(?:animation|transition)\s*:\s*([^;]+)/i)

    for (const match of (durationDecl?.[1] ?? '').matchAll(patterns.duration)) {
      checkTimeValue(file, lineNumber, toMilliseconds(match[1], match[2]), 'duration', violations)
    }

    for (const match of (delayDecl?.[1] ?? '').matchAll(patterns.duration)) {
      checkTimeValue(file, lineNumber, toMilliseconds(match[1], match[2]), 'delay', violations)
    }

    if (camelDuration) {
      for (const match of camelDuration[1].matchAll(patterns.duration)) {
        checkTimeValue(file, lineNumber, toMilliseconds(match[1], match[2]), 'duration', violations)
      }
    }

    if (camelDelay) {
      for (const match of camelDelay[1].matchAll(patterns.duration)) {
        checkTimeValue(file, lineNumber, toMilliseconds(match[1], match[2]), 'delay', violations)
      }
    }

    if (shorthand && !durationDecl && !delayDecl && !camelDuration && !camelDelay) {
      const times = [...shorthand[1].matchAll(patterns.duration)].map((match) =>
        toMilliseconds(match[1], match[2]),
      )

      times.forEach((ms, index) => {
        checkTimeValue(file, lineNumber, ms, index === 0 ? 'duration' : 'delay', violations)
      })

      if (times.length > 0 && !/cubic-bezier\(/.test(shorthand[1])) {
        violations.push(
          violation(
            file,
            lineNumber,
            'VALUE-01',
            '动画没有使用白名单缓动',
            `显式写 cubic-bezier(${allowedEasing})`,
          ),
        )
      }
    }

    for (const match of line.matchAll(patterns.cubicBezier)) {
      const normalized = match[1].replace(/\s+/g, ' ').trim()
      if (normalized !== allowedEasing) {
        violations.push(
          violation(
            file,
            lineNumber,
            'VALUE-01',
            `未列入白名单的缓动：cubic-bezier(${normalized})`,
            `只使用 cubic-bezier(${allowedEasing})`,
          ),
        )
      }
    }

    for (const match of line.matchAll(patterns.tailwindDuration)) {
      if (!allowedDurationMs.has(Number(match[1]))) {
        violations.push(
          violation(
            file,
            lineNumber,
            'VALUE-01',
            `未列入白名单的 duration-${match[1]}`,
            `只使用 duration-${[...allowedDurationMs].join(' / duration-')}`,
          ),
        )
      }
    }

    for (const match of line.matchAll(patterns.tailwindDelay)) {
      if (!allowedDelayMs.has(Number(match[1]))) {
        violations.push(
          violation(
            file,
            lineNumber,
            'VALUE-01',
            `未列入白名单的 delay-${match[1]}`,
            `只使用 delay-${[...allowedDelayMs].join(' / delay-')}`,
          ),
        )
      }
    }

    if (patterns.tailwindEase.test(line)) {
      violations.push(
        violation(
          file,
          lineNumber,
          'VALUE-01',
          '使用了 Tailwind 的 ease-* 简写',
          `显式写 ease-[cubic-bezier(${allowedEasing})] 或 CSS cubic-bezier`,
        ),
      )
    }
  }

  for (const match of line.matchAll(patterns.animateClass)) {
    if (!allowedAnimateClasses.has(match[1])) {
      violations.push(
        violation(
          file,
          lineNumber,
          'MOTION-01',
          `未列入白名单的 animate 类：${match[1]}`,
          '只使用 animate-pulse / animate-none；共享库动效除外',
        ),
      )
    }
  }

  if (/\banimate-pulse\b/.test(line)) {
    if (!file.endsWith('/loading.tsx')) {
      violations.push(
        violation(
          file,
          lineNumber,
          'MOTION-01',
          'animate-pulse 只允许出现在 loading.tsx',
          '其他页面用白名单入场动画，或改用静态骨架',
        ),
      )
    } else if (!line.includes('motion-reduce:animate-none')) {
      violations.push(
        violation(
          file,
          lineNumber,
          'MOTION-01',
          'animate-pulse 没有配对 motion-reduce:animate-none',
          '为加载动画补 reduced-motion 降级',
        ),
      )
    }
  }
}

function checkText(file, content) {
  const isCss = file.endsWith('.css')
  const isApp = file.startsWith('apps/')
  const isShared = file.startsWith('packages/ui/')
  const lines = stripComments(content, isCss).split('\n')
  const violations = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].replace(patterns.url, ' ').replace(patterns.hrefFragment, ' ')
    const lineNumber = index + 1

    if (isAllowed(file, line)) continue

    if (
      patterns.arbitraryColor.test(line) ||
      patterns.arbitraryNamedColor.test(line) ||
      patterns.inlineStyleColor.test(line) ||
      patterns.cssVarDefinition.test(line)
    ) {
      violations.push(
        violation(
          file,
          lineNumber,
          'COLOR-03',
          '出现任意色值、内联颜色或令牌外的 CSS 变量',
          '改用语义令牌类，变量只定义在令牌文件',
        ),
      )
    } else if (patterns.colorLiteral.test(line) || patterns.cssNamedColor.test(line)) {
      violations.push(
        violation(
          file,
          lineNumber,
          'COLOR-01',
          '出现颜色字面量或 CSS 命名色',
          '改用 bg-background / text-foreground / border-border 等语义类',
        ),
      )
    }

    if (patterns.paletteClass.test(line)) {
      violations.push(
        violation(file, lineNumber, 'COLOR-02', '使用了 Tailwind 调色板类', '改用语义令牌类'),
      )
    }

    if (patterns.nextFont.test(line) || patterns.fontFamily.test(line)) {
      violations.push(
        violation(
          file,
          lineNumber,
          'FONT-01',
          '出现主题外字体或 next/font',
          '字体只从 --font-sans-stack / --font-display-stack / --font-mono-stack 使用',
        ),
      )
    }

    if (patterns.fontDisplay.test(line) || patterns.fontArbitrary.test(line)) {
      violations.push(
        violation(
          file,
          lineNumber,
          'FONT-02',
          '出现 font-display 或任意 font-[…]',
          '只使用 font-heading / font-sans / font-mono',
        ),
      )
    }

    if (isApp && (patterns.darkSelector.test(line) || patterns.darkClassSwitch.test(line))) {
      violations.push(
        violation(
          file,
          lineNumber,
          'DARK-01',
          '应用里出现 .dark 类切换',
          '暗色只跟随 prefers-color-scheme；dark: 变体允许',
        ),
      )
    }

    if (isApp && patterns.themeToggle.test(line)) {
      violations.push(
        violation(
          file,
          lineNumber,
          'DARK-01',
          '应用引用了手动主题切换',
          '不要在应用中使用 setTheme / ThemeProvider / ModeToggle',
        ),
      )
    }

    if (!isShared) checkMotion(file, lineNumber, line, violations)
  }

  return violations
}

function countMatches(text, regex) {
  return [...text.matchAll(regex)].length
}

function lineAt(text, index) {
  return text.slice(0, Math.max(0, index)).split('\n').length
}

function firstLine(text, regex) {
  const match = regex.exec(text)
  return match ? lineAt(text, match.index) : 1
}

function nthLine(text, regex, n) {
  let count = 0
  for (const match of text.matchAll(regex)) {
    count += 1
    if (count === n) return lineAt(text, match.index)
  }
  return 1
}

function classChunks(text) {
  const chunks = []

  for (const match of text.matchAll(
    /(?:className|class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([\s\S]*?)\})/g,
  )) {
    chunks.push({ text: match[1] ?? match[2] ?? match[3] ?? '', index: match.index })
  }

  for (const match of text.matchAll(/\bcn\s*\(([\s\S]*?)\)/g)) {
    chunks.push({ text: match[1], index: match.index })
  }

  for (const match of text.matchAll(/@apply\s+([^;]+);/g)) {
    chunks.push({ text: match[1], index: match.index })
  }

  return chunks
}

function findClassViolation(text, chunks, regex) {
  for (const chunk of chunks) {
    const match = regex.exec(chunk.text)
    if (match) return { line: lineAt(text, chunk.index), sample: match[0] }
  }
  return null
}

function readParams(text, start) {
  let depth = 1
  let index = start
  let inString = null

  while (index < text.length && depth > 0) {
    const current = text[index]

    if (inString) {
      if (current === '\\') {
        index += 1
      } else if (current === inString) {
        inString = null
      }
    } else if (current === '"' || current === "'" || current === '`') {
      inString = current
    } else if (current === '(') {
      depth += 1
    } else if (current === ')') {
      depth -= 1
    }

    index += 1
  }

  return text.slice(start, index - 1).trim()
}

function exportedFunctions(text) {
  const result = []
  const matchers = [
    /\bexport\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*\(/g,
    /\bexport\s+const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s*)?\(/g,
  ]

  for (const regex of matchers) {
    let match
    while ((match = regex.exec(text))) {
      result.push({
        name: match[1],
        params: readParams(text, regex.lastIndex),
        index: match.index,
      })
    }
  }

  for (const match of text.matchAll(/\bexport\s*\{([^}]+)\}/g)) {
    for (const raw of match[1].split(',')) {
      const name = raw
        .trim()
        .split(/\s+as\s+/)[0]
        .trim()
      if (!/^[A-Z]/.test(name) || result.some((item) => item.name === name)) continue

      const declaration = text.match(
        new RegExp(`\\b(?:async\\s+)?function\\s+${name}\\s*(?:<[^>]*>)?\\s*\\(`),
      )

      if (declaration) {
        result.push({
          name,
          params: readParams(text, declaration.index + declaration[0].length),
          index: declaration.index,
        })
      }
    }
  }

  return result
}

function checkPageFile(file, text, violations) {
  const shells = countMatches(text, /<CanvasShell\b/g)
  const artboards = countMatches(text, /<Artboard\b/g)

  if (shells === 0) {
    violations.push(
      violation(
        file,
        1,
        'LAYOUT-03',
        '路由页没有使用 CanvasShell',
        '页面骨架固定为 CanvasShell -> 一个 Artboard',
      ),
    )
  }

  if (artboards !== 1) {
    violations.push(
      violation(
        file,
        artboards > 1 ? nthLine(text, /<Artboard\b/g, 2) : 1,
        'LAYOUT-03',
        `路由页必须恰好一个 Artboard，当前 ${artboards} 个`,
        '把页面内容收进唯一的 Artboard',
      ),
    )
  }

  const rawChrome = text.match(/<(?:header|footer|aside)\b/)
  if (rawChrome) {
    violations.push(
      violation(
        file,
        lineAt(text, rawChrome.index),
        'LAYOUT-03',
        '路由页自建了 header/footer/aside',
        'chrome 由 CanvasShell 提供，aside 用 SidePanel',
      ),
    )
  }

  if (file.endsWith('/global-error.tsx') && (!/<html\b/.test(text) || !/<body\b/.test(text))) {
    violations.push(
      violation(
        file,
        1,
        'LAYOUT-03',
        'global-error 缺少自己的 html/body',
        'global-error 必须自带 <html> 与 <body>',
      ),
    )
  }

  const brushes = countMatches(text, /<BrushStroke\b/g)
  if (brushes > 1) {
    violations.push(
      violation(
        file,
        nthLine(text, /<BrushStroke\b/g, 2),
        'SIGNATURE-01',
        `页面出现 ${brushes} 个 BrushStroke`,
        '每页最多一处笔触',
      ),
    )
  }

  const annotations = countMatches(text, /\bannotation=/g)
  if (annotations > 1) {
    violations.push(
      violation(
        file,
        nthLine(text, /\bannotation=/g, 2),
        'SIGNATURE-01',
        `页面出现 ${annotations} 处竖排题注`,
        '每页最多一处题注',
      ),
    )
  }

  const headings = countMatches(text, /<h1\b/g)
  const isLoading = file.endsWith('/loading.tsx')

  if (isLoading && headings > 0) {
    violations.push(
      violation(
        file,
        firstLine(text, /<h1\b/),
        'COPY-04',
        'loading 不应写 h1',
        'loading 用 role=status 表达状态',
      ),
    )
  } else if (!isLoading && headings !== 1) {
    violations.push(
      violation(
        file,
        headings > 1 ? nthLine(text, /<h1\b/g, 2) : 1,
        'COPY-04',
        `路由页必须恰好一个 h1，当前 ${headings} 个`,
        '每个页面只保留一个主标题',
      ),
    )
  }

  if (!/\bexport default\b/.test(text)) {
    violations.push(
      violation(file, 1, 'COMP-01', '路由页缺少 default export', 'Next 路由页必须 export default'),
    )
  }

  if (
    (file.endsWith('/error.tsx') || file.endsWith('/global-error.tsx')) &&
    !/tone=\{?["']error["']/.test(text)
  ) {
    violations.push(
      violation(file, 1, 'STATE-01', '错误页没有使用 error 画板', 'Artboard 使用 tone="error"'),
    )
  }

  if (isLoading && !/tone=\{?["']loading["']/.test(text)) {
    violations.push(
      violation(
        file,
        1,
        'STATE-01',
        'loading 没有使用 loading 画板',
        'Artboard 使用 tone="loading"',
      ),
    )
  }

  if (isLoading && !/role=\{?["']status["']/.test(text)) {
    violations.push(
      violation(file, 1, 'STATE-01', 'loading 缺少 role=status', '状态区使用 role="status"'),
    )
  }

  if (file.endsWith('/not-found.tsx') && !/href=\{?["']\/["']/.test(text)) {
    violations.push(
      violation(file, 1, 'STATE-01', '404 缺少返回首页入口', '提供 href="/" 的返回动作'),
    )
  }
}

function checkComponentFile(file, text, violations) {
  const defaultExport = /\bexport default\b/.exec(text)
  if (defaultExport) {
    violations.push(
      violation(
        file,
        lineAt(text, defaultExport.index),
        'COMP-01',
        '_components 不允许 default export',
        '改用命名导出',
      ),
    )
  }

  const reactFc = /\bReact\.FC\b|\bFC</.exec(text)
  if (reactFc) {
    violations.push(
      violation(
        file,
        lineAt(text, reactFc.index),
        'COMP-01',
        '使用了 React.FC',
        '直接声明函数组件与 props 类型',
      ),
    )
  }

  for (const { name, params, index } of exportedFunctions(text)) {
    if (!/^[A-Z]/.test(name) || params === '') continue

    const hasType = new RegExp(`\\b(?:type|interface)\\s+${name}Props\\b`).test(text)
    const bindsType = new RegExp(`:\\s*${name}Props\\b`).test(params)

    if (!hasType || !bindsType) {
      violations.push(
        violation(
          file,
          lineAt(text, index),
          'COMP-02',
          `${name} 缺少 ${name}Props 类型或参数没有引用它`,
          `声明 type/interface ${name}Props，并用它标注参数`,
        ),
      )
    }
  }
}

function checkFileRules(file, content) {
  const text = stripComments(content, file.endsWith('.css'))
  const violations = []

  if (file.startsWith('apps/shell/src/') && /\.(?:ts|tsx|css)$/.test(file)) {
    const chunks = classChunks(text)

    const rounded = findClassViolation(text, chunks, patterns.roundedClass)
    if (rounded) {
      violations.push(
        violation(
          file,
          rounded.line,
          'VALUE-04',
          `shell 出现非工作台圆角：${rounded.sample}`,
          '只允许 rounded-full 与 rounded-none',
        ),
      )
    }

    const shadow = findClassViolation(text, chunks, patterns.shadowClass)
    if (shadow) {
      violations.push(
        violation(
          file,
          shadow.line,
          'VALUE-04',
          `shell 出现非工作台阴影：${shadow.sample}`,
          '只允许 shadow-lg（画板）与 shadow-md（浮层）',
        ),
      )
    }

    const surface = findClassViolation(text, chunks, patterns.surfaceEffect)
    if (surface) {
      violations.push(
        violation(
          file,
          surface.line,
          'SURFACE-01',
          `出现渐变、玻璃或发光效果：${surface.sample}`,
          '工作台只用纸面、界线与单色 chrome',
        ),
      )
    }
  }

  if (file.endsWith('/_components/canvas-shell.tsx') && !text.includes(brushPath)) {
    violations.push(
      violation(
        file,
        1,
        'SIGNATURE-02',
        'BrushStroke 的 path 被改动',
        '笔触只使用契约固定的现有 path；改笔触需要单独评审',
      ),
    )
  }

  if (pageFilePattern.test(file)) checkPageFile(file, text, violations)
  if (componentFilePattern.test(file)) checkComponentFile(file, text, violations)

  return violations
}

function checkContract(content) {
  const violations = []
  const seen = new Map()

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      violations.push(
        violation(contractFile, 1, 'CONTRACT-01', `契约缺少章节：${section}`, '补齐十节标题'),
      )
    }
  }

  for (const match of content.matchAll(/\[(CI|REVIEW):([A-Z]+-\d+)\]/g)) {
    const line = content.slice(0, match.index).split('\n').length
    const mode = match[1]
    const id = match[2]

    if (seen.has(id)) {
      violations.push(
        violation(
          contractFile,
          line,
          'CONTRACT-02',
          `规则 ID 重复：${id}`,
          '为每条规则分配唯一 ID',
        ),
      )
    }
    seen.set(id, mode)

    if (mode === 'CI' && !ciChecks.has(id)) {
      violations.push(
        violation(
          contractFile,
          line,
          'CONTRACT-02',
          `[CI:${id}] 没有对应检查`,
          '在 check-style.mjs 增加同名检查，或改为 [REVIEW:<id>]',
        ),
      )
    }
  }

  return violations
}

function validateAllowlist(entries) {
  const violations = []

  entries.forEach((entry, index) => {
    const missing = ['file', 'pattern', 'reason', 'removeWhen'].filter(
      (key) => typeof entry[key] !== 'string' || entry[key].trim() === '',
    )

    if (missing.length > 0) {
      violations.push(
        violation(
          contractFile,
          1,
          'CONTRACT-04',
          `allowlist[${index}] 缺少字段：${missing.join(', ')}`,
          '补齐 file / pattern / reason / removeWhen',
        ),
      )
      return
    }

    if (entry.file.includes('**') || entry.file.endsWith('/') || entry.file === '.') {
      violations.push(
        violation(
          contractFile,
          1,
          'CONTRACT-04',
          `allowlist[${index}] 使用了目录级路径：${entry.file}`,
          '只写精确文件路径',
        ),
      )
    }

    try {
      new RegExp(entry.pattern)
    } catch {
      violations.push(
        violation(
          contractFile,
          1,
          'CONTRACT-04',
          `allowlist[${index}] 的 pattern 不是合法正则：${entry.pattern}`,
          '修正正则或改用精确字符串',
        ),
      )
    }

    if (entry.pattern === '.*' && entry.file !== tokenFile) {
      violations.push(
        violation(
          contractFile,
          1,
          'CONTRACT-04',
          `allowlist[${index}] 使用全文件豁免`,
          '只豁免具体写法；令牌文件是唯一例外',
        ),
      )
    }

    const absolute = join(root, entry.file)
    if (!existsSync(absolute) || statSync(absolute).isDirectory()) {
      violations.push(
        violation(
          contractFile,
          1,
          'CONTRACT-04',
          `allowlist[${index}] 指向的文件不存在或不是文件：${entry.file}`,
          '更新路径或删除过期豁免',
        ),
      )
      return
    }

    if (!new RegExp(entry.pattern).test(readFileSync(absolute, 'utf8'))) {
      violations.push(
        violation(
          contractFile,
          1,
          'CONTRACT-04',
          `allowlist[${index}] 没有命中任何内容：${entry.pattern}`,
          '删除过期豁免，或修正 pattern',
        ),
      )
    }
  })

  return violations
}

function checkStyleContent(file, content, checks) {
  const text = stripComments(content, true)
  return checks
    .filter((check) => !check.regex.test(text))
    .map((check) =>
      violation(file, 1, 'LAYOUT-01', check.message, '补回共享样式入口或 @source 声明'),
    )
}

function checkStyleEntry(entry) {
  const absolute = join(root, entry.file)
  if (!existsSync(absolute)) {
    return [
      violation(
        entry.file,
        1,
        'LAYOUT-01',
        '样式入口不存在',
        '创建入口并导入 @inkstack/ui/globals.css',
      ),
    ]
  }
  return checkStyleContent(entry.file, readFileSync(absolute, 'utf8'), entry.checks)
}

function walk(dir) {
  const absolute = join(root, dir)
  if (!existsSync(absolute)) return []

  const result = []
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.next') {
      continue
    }
    const nextPath = relative(root, join(absolute, entry.name)).split('\\').join('/')
    if (entry.isDirectory()) {
      result.push(...walk(nextPath))
    } else if (/\.(ts|tsx|css)$/.test(entry.name)) {
      result.push(nextPath)
    }
  }
  return result
}

function cssFiles(dir) {
  return walk(dir).filter((file) => file.endsWith('.css'))
}

function checkMarkers(text, markers, { id, dir, label, fix }, violations) {
  for (const [name, regex] of markers) {
    if (!regex.test(text)) {
      violations.push(violation(dir, 1, id, `${label} CSS 缺少 ${name}`, fix))
    }
  }
}

function checkBuilt() {
  const violations = []
  const shellDir = 'apps/shell/.next/static'
  const canvasDir = 'apps/canvas/dist'

  const shellCss = cssFiles(shellDir)
  if (shellCss.length === 0) {
    violations.push(
      violation(
        shellDir,
        1,
        'BUILT-01',
        '找不到 shell 的 CSS 产物',
        '先运行 pnpm build，再运行 pnpm check:styles:build',
      ),
    )
  } else {
    const text = shellCss.map((file) => readFileSync(join(root, file), 'utf8')).join('\n')
    const markers = [
      ['--seal', /--seal\s*:/],
      ['--background', /--background\s*:/],
      ['min-h-dvh', /\.min-h-dvh\b/],
      ['.font-heading', /\.font-heading\b/],
    ]
    checkMarkers(
      text,
      markers,
      {
        id: 'BUILT-01',
        dir: shellDir,
        label: 'shell',
        fix: '确认 shell 导入了共享样式且 @source 覆盖应用源码',
      },
      violations,
    )
  }

  const canvasCss = cssFiles(canvasDir)
  if (canvasCss.length === 0) {
    violations.push(
      violation(
        canvasDir,
        1,
        'BUILT-02',
        '找不到 canvas 的 CSS 产物',
        '先运行 pnpm build，再运行 pnpm check:styles:build',
      ),
    )
  } else {
    const text = canvasCss.map((file) => readFileSync(join(root, file), 'utf8')).join('\n')
    const markers = [
      ['--seal', /--seal\s*:/],
      ['--background', /--background\s*:/],
      ['bg-primary', /\.bg-primary\b/],
    ]
    checkMarkers(
      text,
      markers,
      {
        id: 'BUILT-02',
        dir: canvasDir,
        label: 'canvas',
        fix: '确认 canvas 导入了共享样式且 @source 覆盖 packages/ui/src',
      },
      violations,
    )
  }

  return violations
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function hasId(violations, id) {
  return violations.some((item) => item.id === id)
}

function runSelfTest() {
  const sections = requiredSections.join('\n')
  const cases = [
    [
      '颜色字面量',
      () =>
        assert(
          hasId(checkText('apps/shell/src/app/probe.tsx', 'const x = "#fff"'), 'COLOR-01'),
          '缺少 COLOR-01',
        ),
    ],
    [
      '任意色值',
      () =>
        assert(
          hasId(
            checkText('apps/shell/src/app/probe.tsx', '<div className="bg-[#fff]" />'),
            'COLOR-03',
          ),
          '缺少 COLOR-03',
        ),
    ],
    [
      '内联颜色',
      () =>
        assert(
          hasId(
            checkText('apps/shell/src/app/probe.tsx', '<div style={{ color: "#fff" }} />'),
            'COLOR-03',
          ),
          '缺少 COLOR-03',
        ),
    ],
    [
      '调色板类',
      () =>
        assert(
          hasId(
            checkText('apps/shell/src/app/probe.tsx', '<div className="bg-red-500" />'),
            'COLOR-02',
          ),
          '缺少 COLOR-02',
        ),
    ],
    [
      '令牌外变量',
      () =>
        assert(
          hasId(checkText('apps/shell/src/app/probe.css', ':root { --brand: #fff; }'), 'COLOR-03'),
          '缺少 COLOR-03',
        ),
    ],
    [
      'next/font',
      () =>
        assert(
          hasId(
            checkText('apps/shell/src/app/probe.tsx', "import { Inter } from 'next/font/google'"),
            'FONT-01',
          ),
          '缺少 FONT-01',
        ),
    ],
    [
      'font-family',
      () =>
        assert(
          hasId(
            checkText('apps/shell/src/app/probe.css', 'body { font-family: Arial; }'),
            'FONT-01',
          ),
          '缺少 FONT-01',
        ),
    ],
    [
      'font-display',
      () =>
        assert(
          hasId(
            checkText('apps/shell/src/app/probe.tsx', '<div className="font-display" />'),
            'FONT-02',
          ),
          '缺少 FONT-02',
        ),
    ],
    [
      '任意字体',
      () =>
        assert(
          hasId(
            checkText('apps/shell/src/app/probe.tsx', '<div className="font-[Arial]" />'),
            'FONT-02',
          ),
          '缺少 FONT-02',
        ),
    ],
    [
      '未列 keyframes',
      () =>
        assert(
          hasId(
            checkText('apps/shell/src/app/probe.css', '@keyframes spin { to { opacity: 0; } }'),
            'MOTION-01',
          ),
          '缺少 MOTION-01',
        ),
    ],
    [
      '未列动效数值',
      () =>
        assert(
          hasId(
            checkText(
              'apps/shell/src/app/probe.css',
              '.x { animation: fade 100ms cubic-bezier(0.1, 0.2, 0.3, 0.4); }',
            ),
            'VALUE-01',
          ),
          '缺少 VALUE-01',
        ),
    ],
    [
      '手动暗色',
      () =>
        assert(
          hasId(
            checkText(
              'apps/shell/src/app/probe.tsx',
              "document.documentElement.classList.add('dark')",
            ),
            'DARK-01',
          ),
          '缺少 DARK-01',
        ),
    ],
    [
      '干净源码',
      () =>
        assert(
          checkText(
            'apps/shell/src/app/probe.tsx',
            '<div className="bg-background text-foreground border-border" />',
          ).length === 0,
          '干净样例不应报错',
        ),
    ],
    [
      '加载态 pulse',
      () =>
        assert(
          checkText(
            'apps/shell/src/app/loading.tsx',
            '<div className="animate-pulse motion-reduce:animate-none" />',
          ).length === 0,
          'animate-pulse 不应报错',
        ),
    ],
    [
      '共享库动效',
      () =>
        assert(
          checkText(
            'packages/ui/src/components/probe.tsx',
            '<div className="data-open:animate-in duration-100" />',
          ).length === 0,
          '共享库动效不应报错',
        ),
    ],
    [
      '注释剥离',
      () =>
        assert(
          checkText('apps/shell/src/app/probe.tsx', '// #fff\n/* rgb(1, 2, 3) */\nconst x = 1')
            .length === 0,
          '注释中的颜色不应报错',
        ),
    ],
    [
      '契约缺节',
      () =>
        assert(
          hasId(checkContract('## 1. 颜色\n- [CI:COLOR-01] x'), 'CONTRACT-01'),
          '缺少 CONTRACT-01',
        ),
    ],
    [
      '重复规则 ID',
      () =>
        assert(
          hasId(checkContract(`${sections}\n[CI:COLOR-01] a\n[CI:COLOR-01] b`), 'CONTRACT-02'),
          '缺少 CONTRACT-02',
        ),
    ],
    [
      'CI 规则缺检查',
      () =>
        assert(
          hasId(checkContract(`${sections}\n[CI:UNKNOWN-01] x`), 'CONTRACT-02'),
          '缺少 CONTRACT-02',
        ),
    ],
    [
      '干净契约',
      () =>
        assert(
          checkContract(`${sections}\n[CI:COLOR-01] a\n[REVIEW:COLOR-04] b`).length === 0,
          '干净契约不应报错',
        ),
    ],
    [
      'allowlist 缺字段',
      () => assert(hasId(validateAllowlist([{ file: 'x' }]), 'CONTRACT-04'), '缺少 CONTRACT-04'),
    ],
    [
      'allowlist 目录级路径',
      () =>
        assert(
          hasId(
            validateAllowlist([
              { file: 'apps/shell/src', pattern: '.*', reason: 'x', removeWhen: 'y' },
            ]),
            'CONTRACT-04',
          ),
          '缺少 CONTRACT-04',
        ),
    ],
    [
      '页面缺画板',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/page.tsx',
              'export default function Page() { return <CanvasShell /> }',
            ),
            'LAYOUT-03',
          ),
          '缺少 LAYOUT-03',
        ),
    ],
    [
      '页面自建 chrome',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/page.tsx',
              'export default function Page() { return <CanvasShell><header /></CanvasShell> }',
            ),
            'LAYOUT-03',
          ),
          '缺少 LAYOUT-03',
        ),
    ],
    [
      'global-error 缺 html',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/global-error.tsx',
              'export default function GlobalError() { return <CanvasShell><Artboard><h1>x</h1></Artboard></CanvasShell> }',
            ),
            'LAYOUT-03',
          ),
          '缺少 LAYOUT-03',
        ),
    ],
    [
      '两个笔触',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/page.tsx',
              'export default function Page() { return <CanvasShell><Artboard><h1>x</h1><BrushStroke /><BrushStroke /></Artboard></CanvasShell> }',
            ),
            'SIGNATURE-01',
          ),
          '缺少 SIGNATURE-01',
        ),
    ],
    [
      '两个 h1',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/page.tsx',
              'export default function Page() { return <CanvasShell><Artboard><h1>a</h1><h1>b</h1></Artboard></CanvasShell> }',
            ),
            'COPY-04',
          ),
          '缺少 COPY-04',
        ),
    ],
    [
      '页面缺 default export',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/page.tsx',
              'function Page() { return <CanvasShell><Artboard><h1>x</h1></Artboard></CanvasShell> }',
            ),
            'COMP-01',
          ),
          '缺少 COMP-01',
        ),
    ],
    [
      '工作台圆角',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/page.tsx',
              'export default function Page() { return <CanvasShell><Artboard><div className="rounded-lg" /></Artboard></CanvasShell> }',
            ),
            'VALUE-04',
          ),
          '缺少 VALUE-04',
        ),
    ],
    [
      '工作台阴影',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/page.tsx',
              'export default function Page() { return <CanvasShell><Artboard><div className="shadow-xl" /></Artboard></CanvasShell> }',
            ),
            'VALUE-04',
          ),
          '缺少 VALUE-04',
        ),
    ],
    [
      '玻璃与渐变',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/page.tsx',
              'export default function Page() { return <CanvasShell><Artboard><div className="backdrop-blur-sm bg-gradient-to-r" /></Artboard></CanvasShell> }',
            ),
            'SURFACE-01',
          ),
          '缺少 SURFACE-01',
        ),
    ],
    [
      '组件默认导出',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/_components/probe.tsx',
              'export default function Probe() { return null }',
            ),
            'COMP-01',
          ),
          '缺少 COMP-01',
        ),
    ],
    [
      '组件缺 Props 类型',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/_components/probe.tsx',
              'export function Probe({ label }: { label: string }) { return <span>{label}</span> }',
            ),
            'COMP-02',
          ),
          '缺少 COMP-02',
        ),
    ],
    [
      '干净页面',
      () =>
        assert(
          checkFileRules(
            'apps/shell/src/app/page.tsx',
            'export default function Page() { return <CanvasShell><Artboard><h1>x</h1></Artboard></CanvasShell> }',
          ).length === 0,
          '干净页面不应报错',
        ),
    ],
    [
      '干净组件',
      () =>
        assert(
          checkFileRules(
            'apps/shell/src/app/_components/probe.tsx',
            'type ProbeProps = { label: string }\nexport function Probe({ label }: ProbeProps) { return <span>{label}</span> }',
          ).length === 0,
          '干净组件不应报错',
        ),
    ],
    [
      '非 loading pulse',
      () =>
        assert(
          hasId(
            checkText(
              'apps/shell/src/app/probe.tsx',
              '<div className="animate-pulse motion-reduce:animate-none" />',
            ),
            'MOTION-01',
          ),
          '缺少 MOTION-01',
        ),
    ],
    [
      'pulse 缺 reduced-motion',
      () =>
        assert(
          hasId(
            checkText('apps/shell/src/app/loading.tsx', '<div className="animate-pulse" />'),
            'MOTION-01',
          ),
          '缺少 MOTION-01',
        ),
    ],
    [
      '秒单位时长',
      () =>
        assert(
          hasId(
            checkText(
              'apps/shell/src/app/probe.tsx',
              '<div style={{ animation: "artboard-in 1s" }} />',
            ),
            'VALUE-01',
          ),
          '缺少 VALUE-01',
        ),
    ],
    [
      'Tailwind 时长',
      () =>
        assert(
          hasId(
            checkText(
              'apps/shell/src/app/probe.tsx',
              '<div className="transition-all duration-1000" />',
            ),
            'VALUE-01',
          ),
          '缺少 VALUE-01',
        ),
    ],
    [
      'Tailwind 缓动',
      () =>
        assert(
          hasId(
            checkText('apps/shell/src/app/probe.tsx', '<div className="transition ease-in-out" />'),
            'VALUE-01',
          ),
          '缺少 VALUE-01',
        ),
    ],
    [
      '内联 var 颜色',
      () =>
        assert(
          hasId(
            checkText('apps/shell/src/app/probe.tsx', "<div style={{ color: 'var(--seal)' }} />"),
            'COLOR-03',
          ),
          '缺少 COLOR-03',
        ),
    ],
    [
      '行内延迟不再短路',
      () =>
        assert(
          hasId(
            checkText(
              'apps/shell/src/app/page.tsx',
              "<span style={{ animationDelay: '120ms', color: '#fff' }} />",
            ),
            'COLOR-03',
          ),
          '缺少 COLOR-03',
        ),
    ],
    [
      'CSS 命名色',
      () =>
        assert(
          hasId(checkText('apps/shell/src/app/probe.css', '.x { color: tomato; }'), 'COLOR-01'),
          '缺少 COLOR-01',
        ),
    ],
    [
      'href 片段不误报',
      () =>
        assert(
          checkText('apps/shell/src/app/probe.tsx', '<a href="#abc">x</a>').length === 0,
          'href 片段不应报颜色',
        ),
    ],
    [
      'font-display-stack 不误报',
      () =>
        assert(
          checkText(
            'apps/shell/src/app/probe.tsx',
            '<div className="font-heading" style={{ fontFamily: \'var(--font-display-stack)\' }} />',
          ).length === 0,
          'font-display-stack 不应报 FONT-02',
        ),
    ],
    [
      '正文提到类名不误报',
      () =>
        assert(
          checkFileRules(
            'apps/shell/src/app/page.tsx',
            'export default function Page() { return <CanvasShell><Artboard><h1>x</h1><p>不要在界面里使用 rounded-lg 或 shadow-xl。</p></Artboard></CanvasShell> }',
          ).length === 0,
          '正文提到类名不应报 VALUE-04',
        ),
    ],
    [
      '工具函数不误报',
      () =>
        assert(
          checkFileRules(
            'apps/shell/src/app/_components/probe.tsx',
            'export function formatProbeLabel(value: string) { return value.trim() }',
          ).length === 0,
          '工具函数不应报 COMP-02',
        ),
    ],
    [
      '箭头组件缺 Props',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/_components/probe.tsx',
              'export const Probe = ({ label }: { label: string }) => <span>{label}</span>',
            ),
            'COMP-02',
          ),
          '缺少 COMP-02',
        ),
    ],
    [
      '箭头组件带 Props',
      () =>
        assert(
          checkFileRules(
            'apps/shell/src/app/_components/probe.tsx',
            'type ProbeProps = { label: string }\nexport const Probe = ({ label }: ProbeProps) => <span>{label}</span>',
          ).length === 0,
          '箭头组件带 Props 不应报错',
        ),
    ],
    [
      'interface Props',
      () =>
        assert(
          checkFileRules(
            'apps/shell/src/app/_components/probe.tsx',
            'interface ProbeProps { label: string }\nexport function Probe({ label }: ProbeProps) { return <span>{label}</span> }',
          ).length === 0,
          'interface Props 不应报错',
        ),
    ],
    [
      '嵌套组件默认导出',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/_components/nested/probe.tsx',
              'export default function Probe() { return null }',
            ),
            'COMP-01',
          ),
          '缺少 COMP-01',
        ),
    ],
    [
      '注释掉的样式入口',
      () =>
        assert(
          hasId(
            checkStyleContent(
              'apps/shell/src/app/globals.css',
              "/* @import '@inkstack/ui/globals.css'; */",
              styleEntries[0].checks,
            ),
            'LAYOUT-01',
          ),
          '缺少 LAYOUT-01',
        ),
    ],
    [
      'allowlist 全文件豁免',
      () =>
        assert(
          hasId(
            validateAllowlist([
              {
                file: 'apps/shell/src/app/page.tsx',
                pattern: '.*',
                reason: 'x',
                removeWhen: 'y',
              },
            ]),
            'CONTRACT-04',
          ),
          '缺少 CONTRACT-04',
        ),
    ],
    [
      'allowlist 过期',
      () =>
        assert(
          hasId(
            validateAllowlist([
              {
                file: 'apps/shell/src/app/page.tsx',
                pattern: 'never-matches-xyz',
                reason: 'x',
                removeWhen: 'y',
              },
            ]),
            'CONTRACT-04',
          ),
          '缺少 CONTRACT-04',
        ),
    ],
    [
      'error 缺 tone',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/error.tsx',
              'export default function Error() { return <CanvasShell><Artboard><h1>x</h1></Artboard></CanvasShell> }',
            ),
            'STATE-01',
          ),
          '缺少 STATE-01',
        ),
    ],
    [
      'loading 缺 role',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/loading.tsx',
              'export default function Loading() { return <CanvasShell><Artboard tone="loading"><span>loading</span></Artboard></CanvasShell> }',
            ),
            'STATE-01',
          ),
          '缺少 STATE-01',
        ),
    ],
    [
      '404 缺返回入口',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/not-found.tsx',
              'export default function NotFound() { return <CanvasShell><Artboard><h1>x</h1></Artboard></CanvasShell> }',
            ),
            'STATE-01',
          ),
          '缺少 STATE-01',
        ),
    ],
    [
      '笔触 path 被改动',
      () =>
        assert(
          hasId(
            checkFileRules(
              'apps/shell/src/app/_components/canvas-shell.tsx',
              'export function BrushStroke() { return null }',
            ),
            'SIGNATURE-02',
          ),
          '缺少 SIGNATURE-02',
        ),
    ],
    [
      '文件级报错行号',
      () => {
        const errors = checkFileRules(
          'apps/shell/src/app/page.tsx',
          'import { CanvasShell } from "./x"\n\nexport default function Page() {\n  return <CanvasShell><header /></CanvasShell>\n}',
        )
        assert(
          errors.some(
            (error) =>
              error.id === 'LAYOUT-03' && error.message.includes('自建') && error.line === 4,
          ),
          'LAYOUT-03 没有指向实际行',
        )
      },
    ],
    [
      '产物标记缺失',
      () => {
        const errors = []
        checkMarkers(
          '',
          [['--seal', /--seal\s*:/]],
          { id: 'BUILT-01', dir: 'probe', label: 'probe', fix: 'x' },
          errors,
        )
        assert(hasId(errors, 'BUILT-01'), '缺少 BUILT-01')
      },
    ],
    [
      '产物标记齐全',
      () => {
        const errors = []
        checkMarkers(
          '--seal: 1; --background: 2;',
          [
            ['--seal', /--seal\s*:/],
            ['--background', /--background\s*:/],
          ],
          { id: 'BUILT-01', dir: 'probe', label: 'probe', fix: 'x' },
          errors,
        )
        assert(errors.length === 0, '产物标记齐全不应报错')
      },
    ],
    [
      '样式入口缺 @source',
      () =>
        assert(
          hasId(
            checkStyleContent(
              'apps/shell/src/app/globals.css',
              "@import '@inkstack/ui/globals.css';",
              styleEntries[0].checks,
            ),
            'LAYOUT-01',
          ),
          '缺少 LAYOUT-01',
        ),
    ],
  ]

  let passed = 0
  for (const [name, test] of cases) {
    try {
      test()
      passed += 1
    } catch (error) {
      console.error(`self-test: ${name} 失败：${error.message}`)
    }
  }

  console.log(`self-test: ${passed}/${cases.length} passed`)
  if (passed !== cases.length) process.exit(1)
}

function report(errors, label) {
  for (const error of errors) {
    console.error(`${error.file}:${error.line} [${error.id}] ${error.message}`)
    console.error(`  fix: ${error.fix}`)
  }
  console.log(`check-style: ${label}, ${errors.length} error(s)`)
}

function main() {
  const args = new Set(process.argv.slice(2))

  if (args.has('--self-test')) {
    runSelfTest()
    return
  }

  if (args.has('--built')) {
    const errors = checkBuilt()
    report(errors, 'built CSS')
    process.exit(errors.length > 0 ? 1 : 0)
  }

  const errors = []
  errors.push(...validateAllowlist(allowlist))

  const contractPath = join(root, contractFile)
  if (!existsSync(contractPath)) {
    errors.push(
      violation(
        contractFile,
        1,
        'CONTRACT-01',
        '缺少样式契约文件',
        '创建 .claude/rules/design-system.md',
      ),
    )
  } else {
    errors.push(...checkContract(readFileSync(contractPath, 'utf8')))
  }

  for (const entry of styleEntries) {
    errors.push(...checkStyleEntry(entry))
  }

  let scanned = 0
  for (const dir of scanDirs) {
    for (const file of walk(dir)) {
      if (file === tokenFile) continue
      scanned += 1
      const content = readFileSync(join(root, file), 'utf8')
      errors.push(...checkText(file, content))
      errors.push(...checkFileRules(file, content))
    }
  }

  report(errors, `${scanned} source file(s)`)
  process.exit(errors.length > 0 ? 1 : 0)
}

main()
