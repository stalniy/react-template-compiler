/* @flow */

/**
 * Cross-platform code generation for component r-model
 */
export function genComponentModel (
  el: ASTElement,
  value: string,
  modifiers: ?ASTModifiers
): ?boolean {
  const { number, trim } = modifiers || {}

  const baseValueExpression = '$$v'
  let valueExpression = baseValueExpression
  if (trim) {
    valueExpression =
      `(typeof ${baseValueExpression} === 'string'` +
      `? ${baseValueExpression}.trim()` +
      `: ${baseValueExpression})`
  }
  if (number) {
    valueExpression = `_n(${valueExpression})`
  }
  const assignment = genAssignmentCode(value, valueExpression)

  el.model = {
    value: `(${value})`,
    expression: `"${value}"`,
    callback: `function (${baseValueExpression}) {${assignment}}`
  }
}

/**
 * Cross-platform codegen helper for generating r-model value assignment code.
 */
export function genAssignmentCode (
  value: string,
  assignment: string
): string {
  const res = parseModel(value)
  if (res.tokens.length === 1) {
    return `${value}=${assignment}`
  } else if (value.startsWith('state.')) {
    return `$set(state, [${res.tokens.slice(1).join(',')}], ${assignment})`
  } else {
    return `$set(${res.exp}, ${res.tokens[res.tokens.length - 1]}, ${assignment})`
  }
}

/**
 * Parse a r-model expression into a base path and a final key segment.
 * Handles both dot-path and possible square brackets.
 *
 * Possible cases:
 *
 * - test
 * - test[key]
 * - test[test1[key]]
 * - test["a"][key]
 * - xxx.test[a[a].test1[key]]
 * - test.xxx.a["asa"][test1[key]]
 *
 */

type ModelParseResult = {
  exp: string,
  tokens: [string]
}

export function parseModel (val: string): ModelParseResult {
  const value = val.trim()

  if (!value.includes('[') && !value.includes(']') && !value.includes('.')) {
    return {
      exp: value,
      tokens: [value]
    }
  }

  const tokens = []
  let start = 0
  let depth = 0

  for (let i = 0, len = value.length; i < len; i++) {
    if (value[i] === '.') {
      if (value[i - 1] !== ']') {
        tokens.push(`"${value.slice(start, i)}"`)
      }

      start = i + 1
    } else if (value[i] === '[') {
      if (depth === 0) {
        if (start !== i) {
          const quote = value[i - 1] === ']' ? '' : '"'
          tokens.push(quote + value.slice(start, i) + quote)
        }

        start = i + 1
      }

      depth++
    } else if (value[i] === ']') {
      depth--

      if (depth === 0) {
        tokens.push(value.slice(start, i))
        start = i + 1
      }
    }
  }

  if (start < value.length) {
    tokens.push(`"${value.slice(start)}"`)
  }

  let lastTokenLength = tokens[tokens.length - 1].length

  if (value.endsWith(']')) {
    lastTokenLength += 2
  } else {
    lastTokenLength--
  }

  return {
    tokens,
    exp: value.slice(0, -lastTokenLength)
  }
}
