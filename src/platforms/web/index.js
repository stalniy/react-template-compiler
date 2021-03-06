/* @flow */

import { baseOptions } from './options'
import { createCompiler } from '../../index'

const { compile, compileToFunctions } = createCompiler(baseOptions)

export * from '../../sfc/parser'
export { normalizeStyleBinding } from './util'
export { compile, compileToFunctions }
