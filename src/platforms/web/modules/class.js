/* @flow */

import { parseText } from '../../../parser/text-parser'
import {
  getAndRemoveAttr,
  getBindingAttr,
  baseWarn
} from '../../../helpers'

function transformNode (el: ASTElement, options: CompilerOptions) {
  const warn = options.warn || baseWarn
  const staticClass = getAndRemoveAttr(el, 'class')
  if (process.env.NODE_ENV !== 'production' && staticClass) {
    const res = parseText(staticClass, options.delimiters)
    if (res) {
      warn(
        `class="${staticClass}": ` +
        'Interpolation inside attributes has been removed. ' +
        'Use r-bind or the colon shorthand instead. For example, ' +
        'instead of <div class="{{ val }}">, use <div :class="val">.'
      )
    }
  }
  if (staticClass) {
    el.staticClass = JSON.stringify(staticClass)
  }
  const classBinding = getBindingAttr(el, 'class', false /* getStatic */)
  if (classBinding) {
    el.classBinding = classBinding
  }
}

function genData (el: ASTElement): string {
  let data = ''
  const attrName = el.tag.includes('-') ? 'class' : 'className'

  if (el.staticClass && el.classBinding) {
    data += `${attrName}:_rc(${el.classBinding},${el.staticClass}),`
  } else if (el.staticClass || el.classBinding) {
    data += `${attrName}:${el.classBinding ? '_rc(' + el.classBinding + ')' : el.staticClass},`
  }
  return data
}

export default {
  staticKeys: ['staticClass'],
  transformNode,
  genData
}
