/**
 * Verifies that every Tailwind utility used in the source is present in the
 * built stylesheet.
 *
 * Run after "npm run build":
 *
 *   node scripts/css-coverage-check.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'src'
const DIST = 'dist'

/** Collect every file below a directory. */
function walk(directory) {
  const files = []

  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry)

    if (statSync(full).isDirectory()) {
      files.push(...walk(full))
    } else if (/\.(jsx?|css)$/.test(entry)) {
      files.push(full)
    }
  }

  return files
}

const candidates = new Set()

for (const file of walk(SRC)) {
  const content = readFileSync(file, 'utf8')

  // Collect class names from className="..." and className={`...`} templates.
  for (const match of content.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    const value = match[1] ?? match[2] ?? ''

    for (const token of value.split(/\s+/)) {
      if (token) {
        candidates.add(token)
      }
    }
  }
}

const cssFile = readdirSync(join(DIST, 'assets')).find((name) => name.endsWith('.css'))

if (!cssFile) {
  console.error('No built stylesheet found. Run "npm run build" first.')
  process.exit(1)
}

const css = readFileSync(join(DIST, 'assets', cssFile), 'utf8')
const cssClasses = extractCssClasses(css)

/**
 * Classes that are not Tailwind utilities: hand written component classes and
 * tokens that are produced by the cx() helper at runtime.
 */
const IGNORED = new Set(['card-shadow', 'antialiased'])

/**
 * Extract every class selector from a stylesheet.
 *
 * Tailwind escapes the characters that are special inside a CSS selector
 * (":", ".", "/", "[", "]", "%", "(" and ")") with a backslash. This function
 * collects the class names and unescapes them, so they can be compared with
 * the class names used in the source.
 */
function extractCssClasses(css) {
  const classes = new Set()

  // Match a class selector: a dot followed by escaped or plain characters.
  const pattern = /\.((?:[a-zA-Z0-9_-]|\\[^a-zA-Z0-9_-])+)/g

  for (const match of css.matchAll(pattern)) {
    // Unescape: a backslash before a character means the literal character.
    classes.add(match[1].replace(/\\(.)/g, '$1'))
  }

  return classes
}

/**
 * A token is treated as a class name when it only contains the characters that
 * Tailwind uses in utility names. This filters out fragments of template
 * literal expressions such as "tones.default}".
 */
function isClassName(token) {
  return /^[a-zA-Z0-9:_./[\]%-]+$/.test(token)
}

const missing = []

for (const token of candidates) {
  if (IGNORED.has(token)) {
    continue
  }

  if (!isClassName(token)) {
    continue
  }

  if (!cssClasses.has(token)) {
    missing.push(token)
  }
}

console.log(`Checked ${candidates.size} class names from ${SRC}/ against ${cssFile}`)

if (missing.length > 0) {
  console.error(`\n${missing.length} class(es) missing from the built CSS:`)
  for (const token of missing.sort()) {
    console.error(`  ${token}`)
  }
  process.exit(1)
}

console.log('Every class used in the source is present in the built CSS.')
