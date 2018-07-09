import { parse } from '../../src/parser/index'
import { optimize } from '../../src/optimizer'
import { generate } from '../../src/codegen'
import { extend } from '../../src/util'
import { isReservedTag } from '../../src/platforms/web/util'
import { baseOptions } from '../../src/platforms/web/options'

function assertCodegen (template, generatedCode, ...args) {
  let staticRenderFnCodes = []
  let generateOptions = baseOptions
  let proc = null
  let len = args.length
  while (len--) {
    const arg = args[len]
    if (Array.isArray(arg)) {
      staticRenderFnCodes = arg
    } else if (arg && typeof arg === 'object') {
      generateOptions = arg
    } else if (typeof arg === 'function') {
      proc = arg
    }
  }
  const ast = parse(template, baseOptions)
  optimize(ast, baseOptions)
  proc && proc(ast)
  const res = generate(ast, generateOptions)
  expect(res.render).toBe(generatedCode)
  expect(res.staticRenderFns).toEqual(staticRenderFnCodes)
}

/* eslint-disable quotes */
describe('codegen', () => {
  it('generate directive', () => {
    assertCodegen(
      '<p r-custom1:arg1.modifier="value1" r-custom2></p>',
      `with(this){return _c('p',{directives:[{name:"custom1",rawName:"r-custom1:arg1.modifier",value:(value1),expression:"value1",arg:"arg1",modifiers:{"modifier":true}},{name:"custom2",rawName:"r-custom2"}]})}`
    )
  })

  it('generate filters', () => {
    assertCodegen(
      '<div :id="a | b | c">{{ d | e | f }}</div>',
      `with(this){return _c('div',{attrs:{"id":_f("c")(_f("b")(a))}},_s(_f("f")(_f("e")(d))))}`
    )
  })

  it('generate filters with no arguments', () => {
    assertCodegen(
      '<div>{{ d | e }}</div>',
      `with(this){return _c('div',_s(_f("e")(d)))}`
    )
  })

  it('generate r-for directive', () => {
    assertCodegen(
      '<div><li r-for="item in items" :key="item.uid"></li></div>',
      `with(this){return _c('div',_l((items),function(item){return _c('li',{key:item.uid})}))}`
    )
    // iterator syntax
    assertCodegen(
      '<div><li r-for="(item, i) in items"></li></div>',
      `with(this){return _c('div',_l((items),function(item,i){return _c('li')}))}`
    )
    assertCodegen(
      '<div><li r-for="(item, key, index) in items"></li></div>',
      `with(this){return _c('div',_l((items),function(item,key,index){return _c('li')}))}`
    )
    // destructuring
    assertCodegen(
      '<div><li r-for="{ a, b } in items"></li></div>',
      `with(this){return _c('div',_l((items),function({ a, b }){return _c('li')}))}`
    )
    assertCodegen(
      '<div><li r-for="({ a, b }, key, index) in items"></li></div>',
      `with(this){return _c('div',_l((items),function({ a, b },key,index){return _c('li')}))}`
    )
    // r-for with extra element
    assertCodegen(
      '<div><p></p><li r-for="item in items"></li></div>',
      `with(this){return _c('div',_c('p'),_l((items),function(item){return _c('li')}),2)}`
    )
  })

  it('generate r-if directive', () => {
    assertCodegen(
      '<p r-if="show">hello</p>',
      `with(this){return (show)?_c('p',"hello"):_e()}`
    )
  })

  it('generate r-else directive', () => {
    assertCodegen(
      '<div><p r-if="show">hello</p><p r-else>world</p></div>',
      `with(this){return _c('div',(show)?_c('p',"hello"):_c('p',"world"))}`
    )
  })

  it('generate r-else-if directive', () => {
    assertCodegen(
      '<div><p r-if="show">hello</p><p r-else-if="hide">world</p></div>',
      `with(this){return _c('div',(show)?_c('p',"hello"):(hide)?_c('p',"world"):_e())}`
    )
  })

  it('generate r-else-if with r-else directive', () => {
    assertCodegen(
      '<div><p r-if="show">hello</p><p r-else-if="hide">world</p><p r-else>bye</p></div>',
      `with(this){return _c('div',(show)?_c('p',"hello"):(hide)?_c('p',"world"):_c('p',"bye"))}`
    )
  })

  it('generate multi r-else-if with r-else directive', () => {
    assertCodegen(
      '<div><p r-if="show">hello</p><p r-else-if="hide">world</p><p r-else-if="3">elseif</p><p r-else>bye</p></div>',
      `with(this){return _c('div',(show)?_c('p',"hello"):(hide)?_c('p',"world"):(3)?_c('p',"elseif"):_c('p',"bye"))}`
    )
  })

  it('generate ref', () => {
    assertCodegen(
      '<p ref="component1"></p>',
      `with(this){return _c('p',{ref:"component1"})}`
    )
  })

  it('generate ref on r-for', () => {
    assertCodegen(
      '<ul><li r-for="item in items" ref="component1"></li></ul>',
      `with(this){return _c('ul',_l((items),function(item){return _c('li',{ref:"component1",refInFor:true})}))}`
    )
  })

  it('generate r-bind directive', () => {
    assertCodegen(
      '<p r-bind="test"></p>',
      `with(this){return _c('p',_b({},'p',test,false))}`
    )
  })

  it('generate r-bind with prop directive', () => {
    assertCodegen(
      '<p r-bind.prop="test"></p>',
      `with(this){return _c('p',_b({},'p',test,true))}`
    )
  })

  it('generate r-bind directive with sync modifier', () => {
    assertCodegen(
      '<p r-bind.sync="test"></p>',
      `with(this){return _c('p',_b({},'p',test,false,true))}`
    )
  })

  it('generate template tag', () => {
    assertCodegen(
      '<div><template><p>{{hello}}</p></template></div>',
      `with(this){return _c('div',_c('p',_s(hello)),2)}`
    )
  })

  it('generate single slot', () => {
    assertCodegen(
      '<div><slot></slot></div>',
      `with(this){return _c('div',_t("default"),2)}`
    )
  })

  it('generate named slot', () => {
    assertCodegen(
      '<div><slot name="one"></slot></div>',
      `with(this){return _c('div',_t("one"),2)}`
    )
  })

  it('generate slot fallback content', () => {
    assertCodegen(
      '<div><slot><div>hi</div></slot></div>',
      `with(this){return _c('div',_t("default",_c('div',"hi")),2)}`
    )
  })

  it('generate slot target', () => {
    assertCodegen(
      '<p slot="one">hello world</p>',
      `with(this){return _c('p',{attrs:{"slot":"one"},slot:"one"},"hello world")}`
    )
  })

  it('generate scoped slot', () => {
    assertCodegen(
      '<foo><template slot-scope="bar">{{ bar }}</template></foo>',
      `with(this){return _c('foo',{scopedSlots:_u([{key:"default",fn:function(bar){return _s(bar)}}])})}`
    )
    assertCodegen(
      '<foo><div slot-scope="bar">{{ bar }}</div></foo>',
      `with(this){return _c('foo',{scopedSlots:_u([{key:"default",fn:function(bar){return _c('div',{},_s(bar))}}])})}`
    )
  })

  it('generate named scoped slot', () => {
    assertCodegen(
      '<foo><template slot="foo" slot-scope="bar">{{ bar }}</template></foo>',
      `with(this){return _c('foo',{scopedSlots:_u([{key:"foo",fn:function(bar){return _s(bar)}}])})}`
    )
    assertCodegen(
      '<foo><div slot="foo" slot-scope="bar">{{ bar }}</div></foo>',
      `with(this){return _c('foo',{scopedSlots:_u([{key:"foo",fn:function(bar){return _c('div',{},_s(bar))}}])})}`
    )
  })

  it('generate class binding', () => {
    // static
    assertCodegen(
      '<p class="class1">hello world</p>',
      `with(this){return _c('p',{staticClass:"class1"},"hello world")}`,
    )
    // dynamic
    assertCodegen(
      '<p :class="class1">hello world</p>',
      `with(this){return _c('p',{class:class1},"hello world")}`
    )
  })

  it('generate style binding', () => {
    assertCodegen(
      '<p :style="error">hello world</p>',
      `with(this){return _c('p',{style:(error)},"hello world")}`
    )
  })

  it('generate r-show directive', () => {
    assertCodegen(
      '<p r-show="shown">hello world</p>',
      `with(this){return _c('p',{directives:[{name:"show",rawName:"r-show",value:(shown),expression:"shown"}]},"hello world")}`
    )
  })

  it('generate DOM props with r-bind directive', () => {
    // input + value
    assertCodegen(
      '<input :value="msg">',
      `with(this){return _c('input',{"value":msg})}`
    )
    // non input
    assertCodegen(
      '<p :value="msg"/>',
      `with(this){return _c('p',{attrs:{"value":msg}})}`
    )
  })

  it('generate attrs with r-bind directive', () => {
    assertCodegen(
      '<input :name="field1">',
      `with(this){return _c('input',{attrs:{"name":field1}})}`
    )
  })

  it('generate static attrs', () => {
    assertCodegen(
      '<input name="field1">',
      `with(this){return _c('input',{attrs:{"name":"field1"}})}`
    )
  })

  it('generate events with r-on directive', () => {
    assertCodegen(
      '<input @input="onInput">',
      `with(this){return _c('input',{"onInput":onInput})}`
    )
  })

  it('generate events with method call', () => {
    assertCodegen(
      '<input @input="onInput($event);">',
      `with(this){return _c('input',{"onInput":function($event){onInput($event);}})}`
    )
    // empty arguments
    assertCodegen(
      '<input @input="onInput();">',
      `with(this){return _c('input',{"onInput":function($event){onInput();}})}`
    )
    // without semicolon
    assertCodegen(
      '<input @input="onInput($event)">',
      `with(this){return _c('input',{"onInput":function($event){onInput($event)}})}`
    )
    // multiple args
    assertCodegen(
      '<input @input="onInput($event, \'abc\', 5);">',
      `with(this){return _c('input',{"onInput":function($event){onInput($event, 'abc', 5);}})}`
    )
    // expression in args
    assertCodegen(
      '<input @input="onInput($event, 2+2);">',
      `with(this){return _c('input',{"onInput":function($event){onInput($event, 2+2);}})}`
    )
    // tricky symbols in args
    assertCodegen(
      '<input @input="onInput(\');[\'());\');">',
      `with(this){return _c('input',{"onInput":function($event){onInput(');[\'());');}})}`
    )
  })

  it('generate events with multiple statements', () => {
    // normal function
    assertCodegen(
      '<input @input="onInput1();onInput2()">',
      `with(this){return _c('input',{"onInput":function($event){onInput1();onInput2()}})}`
    )
    // function with multiple args
    assertCodegen(
      '<input @input="onInput1($event, \'text\');onInput2(\'text2\', $event)">',
      `with(this){return _c('input',{"onInput":function($event){onInput1($event, 'text');onInput2('text2', $event)}})}`
    )
  })

  it('generate events with keycode', () => {
    assertCodegen(
      '<input @input.enter="onInput">',
      `with(this){return _c('input',{"onInput":function($event){if(!('button' in $event)&&_k($event.keyCode,"enter",13,$event.key,"Enter"))return null;return onInput($event)}})}`
    )
    // multiple keycodes (delete)
    assertCodegen(
      '<input @input.delete="onInput">',
      `with(this){return _c('input',{"onInput":function($event){if(!('button' in $event)&&_k($event.keyCode,"delete",[8,46],$event.key,["Backspace","Delete"]))return null;return onInput($event)}})}`
    )
    // multiple keycodes (chained)
    assertCodegen(
      '<input @keydown.enter.delete="onInput">',
      `with(this){return _c('input',{"onKeydown":function($event){if(!('button' in $event)&&_k($event.keyCode,"enter",13,$event.key,"Enter")&&_k($event.keyCode,"delete",[8,46],$event.key,["Backspace","Delete"]))return null;return onInput($event)}})}`
    )
    // number keycode
    assertCodegen(
      '<input @input.13="onInput">',
      `with(this){return _c('input',{"onInput":function($event){if(!('button' in $event)&&$event.keyCode!==13)return null;return onInput($event)}})}`
    )
    // custom keycode
    assertCodegen(
      '<input @input.custom="onInput">',
      `with(this){return _c('input',{"onInput":function($event){if(!('button' in $event)&&_k($event.keyCode,"custom",undefined,$event.key,undefined))return null;return onInput($event)}})}`
    )
  })

  it('generate events with generic modifiers', () => {
    assertCodegen(
      '<input @input.stop="onInput">',
      `with(this){return _c('input',{"onInput":function($event){$event.stopPropagation();return onInput($event)}})}`
    )
    assertCodegen(
      '<input @input.prevent="onInput">',
      `with(this){return _c('input',{"onInput":function($event){$event.preventDefault();return onInput($event)}})}`
    )
    assertCodegen(
      '<input @input.self="onInput">',
      `with(this){return _c('input',{"onInput":function($event){if($event.target !== $event.currentTarget)return null;return onInput($event)}})}`
    )
  })

  it('generate events with generic modifiers and keycode correct order', () => {
    assertCodegen(
      '<input @keydown.enter.prevent="onInput">',
      `with(this){return _c('input',{"onKeydown":function($event){if(!('button' in $event)&&_k($event.keyCode,"enter",13,$event.key,"Enter"))return null;$event.preventDefault();return onInput($event)}})}`
    )

    assertCodegen(
      '<input @keydown.enter.stop="onInput">',
      `with(this){return _c('input',{"onKeydown":function($event){if(!('button' in $event)&&_k($event.keyCode,"enter",13,$event.key,"Enter"))return null;$event.stopPropagation();return onInput($event)}})}`
    )
  })

  it('generate events with mouse event modifiers', () => {
    assertCodegen(
      '<input @click.ctrl="onClick">',
      `with(this){return _c('input',{"onClick":function($event){if(!$event.ctrlKey)return null;return onClick($event)}})}`
    )
    assertCodegen(
      '<input @click.shift="onClick">',
      `with(this){return _c('input',{"onClick":function($event){if(!$event.shiftKey)return null;return onClick($event)}})}`
    )
    assertCodegen(
      '<input @click.alt="onClick">',
      `with(this){return _c('input',{"onClick":function($event){if(!$event.altKey)return null;return onClick($event)}})}`
    )
    assertCodegen(
      '<input @click.meta="onClick">',
      `with(this){return _c('input',{"onClick":function($event){if(!$event.metaKey)return null;return onClick($event)}})}`
    )
    assertCodegen(
      '<input @click.exact="onClick">',
      `with(this){return _c('input',{"onClick":function($event){if($event.ctrlKey||$event.shiftKey||$event.altKey||$event.metaKey)return null;return onClick($event)}})}`
    )
    assertCodegen(
      '<input @click.ctrl.exact="onClick">',
      `with(this){return _c('input',{"onClick":function($event){if(!$event.ctrlKey)return null;if($event.shiftKey||$event.altKey||$event.metaKey)return null;return onClick($event)}})}`
    )
  })

  it('generate events with multiple modifiers', () => {
    assertCodegen(
      '<input @input.stop.prevent.self="onInput">',
      `with(this){return _c('input',{"onInput":function($event){$event.stopPropagation();$event.preventDefault();if($event.target !== $event.currentTarget)return null;return onInput($event)}})}`
    )
  })

  it('generate events with capture modifier', () => {
    assertCodegen(
      '<input @input.capture="onInput">',
      `with(this){return _c('input',{"onInputCapture":function($event){return onInput($event)}})}`
    )
  })

  it('generate events with once modifier', () => {
    assertCodegen(
      '<input @input.once="onInput">',
      `with(this){return _c('input',{"onInputOnce":function($event){return onInput($event)}})}`
    )
  })

  it('generate events with capture and once modifier', () => {
    assertCodegen(
      '<input @input.capture.once="onInput">',
      `with(this){return _c('input',{"onInputCaptureOnce":function($event){return onInput($event)}})}`
    )
  })

  it('generate events with once and capture modifier', () => {
    assertCodegen(
      '<input @input.once.capture="onInput">',
      `with(this){return _c('input',{"onInputCaptureOnce":function($event){return onInput($event)}})}`
    )
  })

  it('generate events with inline statement', () => {
    assertCodegen(
      '<input @input="current++">',
      `with(this){return _c('input',{"onInput":function($event){current++}})}`
    )
  })

  it('generate events with inline function expression', () => {
    // normal function
    assertCodegen(
      '<input @input="function () { current++ }">',
      `with(this){return _c('input',{"onInput":function () { current++ }})}`
    )
    // arrow with no args
    assertCodegen(
      '<input @input="()=>current++">',
      `with(this){return _c('input',{"onInput":()=>current++})}`
    )
    // arrow with parens, single arg
    assertCodegen(
      '<input @input="(e) => current++">',
      `with(this){return _c('input',{"onInput":(e) => current++})}`
    )
    // arrow with parens, multi args
    assertCodegen(
      '<input @input="(a, b, c) => current++">',
      `with(this){return _c('input',{"onInput":(a, b, c) => current++})}`
    )
    // arrow with destructuring
    assertCodegen(
      '<input @input="({ a, b }) => current++">',
      `with(this){return _c('input',{"onInput":({ a, b }) => current++})}`
    )
    // arrow single arg no parens
    assertCodegen(
      '<input @input="e=>current++">',
      `with(this){return _c('input',{"onInput":e=>current++})}`
    )
    // with modifiers
    assertCodegen(
      `<input @keyup.enter="e=>current++">`,
      `with(this){return _c('input',{"onKeyup":function($event){if(!('button' in $event)&&_k($event.keyCode,"enter",13,$event.key,"Enter"))return null;return (e=>current++)($event)}})}`
    )
  })

  it('should not treat handler with unexpected whitespace as inline statement', () => {
    assertCodegen(
      '<input @input=" onInput ">',
      `with(this){return _c('input',{"onInput":onInput})}`
    )
  })

  it('generate unhandled events', () => {
    assertCodegen(
      '<input @input="current++">',
      `with(this){return _c('input',{"onInput":function(){}})}`,
      ast => {
        ast.events.input = undefined
      }
    )
  })

  it('generate multiple event handlers', () => {
    assertCodegen(
      '<input @input="current++" @input.stop="onInput">',
      `with(this){return _c('input',{"onInput":_p(function($event){current++},function($event){$event.stopPropagation();return onInput($event)})})}`
    )
  })

  it('generate component', () => {
    assertCodegen(
      '<my-component name="mycomponent1" :msg="msg" @notify="onNotify"><div>hi</div></my-component>',
      `with(this){return _c('my-component',{attrs:{"name":"mycomponent1","msg":msg},"onNotify":onNotify},_c('div',"hi"))}`
    )
  })

  it('generate svg component with children', () => {
    assertCodegen(
      '<svg><my-comp><circle :r="10"></circle></my-comp></svg>',
      `with(this){return _c('svg',_c('my-comp',_c('circle',{attrs:{"r":10}})),1)}`
    )
  })

  it('generate is attribute', () => {
    assertCodegen(
      '<div is="component1"></div>',
      `with(this){return _c("component1",{tag:"div"})}`
    )
    assertCodegen(
      '<div :is="component1"></div>',
      `with(this){return _c(component1,{tag:"div"})}`
    )
  })

  it('generate component with inline-template', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    // have "inline-template'"
    assertCodegen(
      '<my-component inline-template><p><span>hello world</span></p></my-component>',
      `with(this){return _c('my-component',{inlineTemplate:{render:function(){with(this){return _m(0)}},staticRenderFns:[function(){with(this){return _c('p',_c('span',"hello world"))}}]}})}`
    )
    // "have inline-template attrs, but not having exactly one child element
    assertCodegen(
      '<my-component inline-template><hr><hr></my-component>',
      `with(this){return _c('my-component',{inlineTemplate:{render:function(){with(this){return _c('hr')}},staticRenderFns:[]}})}`
    )
    try {
      assertCodegen(
        '<my-component inline-template></my-component>',
        ''
      )
    } catch (e) {}
    expect(console.error.mock.calls[0][0]).toContain('Inline-template components must have exactly one child element.')
    expect(console.error.mock.calls.length).toBe(2)
  })

  it('generate static trees inside r-for', () => {
    assertCodegen(
      `<div><div r-for="i in 10"><p><span></span></p></div></div>`,
      `with(this){return _c('div',_l((10),function(i){return _c('div',_m(0,true))}))}`,
      [`with(this){return _c('p',_c('span'))}`]
    )
  })

  it('generate component with r-for', () => {
    // normalize type: 2
    assertCodegen(
      '<div><child></child><template r-for="item in list">{{ item }}</template></div>',
      `with(this){return _c('div',_c('child'),_l((list),function(item){return _s(item)}),2)}`
    )
  })

  it('generate component with comment', () => {
    const options = extend({
      comments: true
    }, baseOptions)
    const template = '<div><!--comment--></div>'
    const generatedCode = `with(this){return _c('div',_e("comment"))}`

    const ast = parse(template, options)
    optimize(ast, options)
    const res = generate(ast, options)
    expect(res.render).toBe(generatedCode)
  })

  it('generate comments with special characters', () => {
    const options = extend({
      comments: true
    }, baseOptions)
    const template = '<div><!--\n\'comment\'\n--></div>'
    const generatedCode = `with(this){return _c('div',_e("\\n'comment'\\n"))}`

    const ast = parse(template, options)
    optimize(ast, options)
    const res = generate(ast, options)
    expect(res.render).toBe(generatedCode)
  })

  it('not specified ast type', () => {
    const res = generate(null, baseOptions)
    expect(res.render).toBe(`with(this){return _c("div")}`)
    expect(res.staticRenderFns).toEqual([])
  })

  it('not specified directives option', () => {
    assertCodegen(
      '<p r-if="show">hello world</p>',
      `with(this){return (show)?_c('p',"hello world"):_e()}`,
      { isReservedTag }
    )
  })
})
/* eslint-enable quotes */
