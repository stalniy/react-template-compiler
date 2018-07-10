import { compile } from '../../src/platforms/web'
import { getAndRemoveAttr } from '../../src/helpers'

describe('compile options', () => {
  it('compiles custom directive', () => {
    const { render, staticRenderFns, errors } = compile(`
      <div>
        <input type="text" r-model="msg" required max="8" r-validate:field1.group1.group2>
      </div>
    `, {
      directives: {
        validate (el, dir) {
          if (dir.name === 'validate' && dir.arg) {
            el.validate = {
              field: dir.arg,
              groups: dir.modifiers ? Object.keys(dir.modifiers) : []
            }
          }
        }
      },
      modules: [
        {
          transformNode (el) {
            el.validators = el.validators || []
            const validators = ['required', 'min', 'max', 'pattern', 'maxlength', 'minlength']
            validators.forEach(name => {
              const rule = getAndRemoveAttr(el, name)
              if (rule !== undefined) {
                el.validators.push({ name, rule })
              }
            })
          },
          genData (el) {
            let data = ''
            if (el.validate) {
              data += `validate:${JSON.stringify(el.validate)},`
            }
            if (el.validators) {
              data += `validators:${JSON.stringify(el.validators)},`
            }
            return data
          },
          transformCode (el, code) {
            // check
            if (!el.validate || !el.validators) {
              return code
            }
            // setup validation result props
            const result = { dirty: false } // define something other prop
            el.validators.forEach(validator => {
              result[validator.name] = null
            })
            // generate code
            return `_c('validate',{props:{` +
              `field:${JSON.stringify(el.validate.field)},` +
              `groups:${JSON.stringify(el.validate.groups)},` +
              `validators:${JSON.stringify(el.validators)},` +
              `result:${JSON.stringify(result)},` +
              `child:${code}}` +
            `})`
          }
        }
      ]
    })

    expect(render).toBe(`with(this){return _c('div',_c('validate',{props:{field:"field1",groups:["group1","group2"],validators:[{"name":"required","rule":""},{"name":"max","rule":"8"}],result:{"dirty":false,"required":null,"max":null},child:_c('input',{directives:[{name:"model",rawName:"r-model",value:(msg),expression:"msg"}],validate:{"field":"field1","groups":["group1","group2"]},validators:[{"name":"required","rule":""},{"name":"max","rule":"8"}],attrs:{"type":"text"},"value":(msg),"onChange":function($event){if($event.target.composing)return;msg=$event.target.value}})}}))}`)
    expect(staticRenderFns).toEqual([])
    expect(errors).toEqual([])
  })

  it('collects errors', () => {
    let compiled = compile('hello')
    expect(compiled.errors.length).toBe(1)
    expect(compiled.errors[0]).toContain('root element')

    compiled = compile('<div r-if="a----">{{ b++++ }}</div>')
    expect(compiled.errors.length).toBe(2)
    expect(compiled.errors[0]).toContain('Raw expression: r-if="a----"')
    expect(compiled.errors[1]).toContain('Raw expression: {{ b++++ }}')
  })
})
