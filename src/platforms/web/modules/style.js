/* @flow */

import { parseText } from '../../../parser/text-parser'
import { parseStyleText } from '../util'
import {
  getAndRemoveAttr,
  getBindingAttr,
  baseWarn
} from '../../../helpers'

function transformNode (el: ASTElement, options: CompilerOptions) {
  const warn = options.warn || baseWarn
  const staticStyle = getAndRemoveAttr(el, 'style')
  if (staticStyle) {
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production') {
      const res = parseText(staticStyle, options.delimiters)
      if (res) {
        warn(
          `style="${staticStyle}": ` +
          'Interpolation inside attributes has been removed. ' +
          'Use r-bind or the colon shorthand instead. For example, ' +
          'instead of <div style="{{ val }}">, use <div :style="val">.'
        )
      }
    }
    el.staticStyle = JSON.stringify(parseStyleText(staticStyle))
  }

  const styleBinding = getBindingAttr(el, 'style', false /* getStatic */)
  if (styleBinding) {
    el.styleBinding = styleBinding
  }
}

function genData (el: ASTElement): string {
  let data = ''
  if (el.staticStyle && el.styleBinding) {
    if (el.styleBinding[0] === '{') {
      data += `style:({${el.staticStyle.slice(1, -1)},${el.styleBinding.slice(1, -1)}}),`
    } else {
      data += `style:_rs(${el.styleBinding}, ${el.staticStyle}),`
    }
  } else if (el.styleBinding || el.staticStyle) {
    data += `style:(${el.styleBinding ? '_rs(' + el.styleBinding + ')' : e.staticStyle}),`
  }
  return data
}

export default {
  staticKeys: ['staticStyle'],
  transformNode,
  genData
}
