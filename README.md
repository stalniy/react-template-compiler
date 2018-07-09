# React Template Compiler

Compiles Vue templates into React render function

```html
<div>
  <button @click="toggleVisible">toggle</button>
  <template r-if="state.isVisible">
    {{ state.message }}
  </template>

  <input :value="state.message" @change="updateMessage">
</div>
```


