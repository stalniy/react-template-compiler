/* @flow */

import { baseOptions } from './options'
import { createCompiler } from '../../index'

const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions }
