# React Template Compiler

Compiles Vue templates into React render function

This will allow to write React components in a Single Component File, similar to how we do for Vue

```html
<template>
  <ul>
    <li r-for="name in state.names">{{ name }}</li>
  </ul>

  <template r-if="state.isVisible">
    <div>{{ message }}</div>
  </template>
  <input :value="state.message" @change="updateMessage">
</template>

<script>
  export default {
    data: () => ({
      isVisible: false,
      names: ['John', 'Sergii', 'Lena']
    }),
    methods: {
      updateMessage(event) {
        this.setState({ message: event.target.value })
      }
    }
  }
</script>

<style scoped>
  li {
    color: red;
  }
</style>
```

**Under development**, see [Issues](https://github.com/stalniy/react-template-compiler/issues) to check the progress

**Current Limitations**:
* React doesn't support `passive` handlers thus I will either skip their support in the first release or find a way how to add them in runtime

## Credits

Inspired by:
* [Vue](https://github.com/vuejs/vue)
* [vue-loader](https://github.com/vuejs/vue-loader)

Big thanks to Evan You @yyx990803 for creating Vue!

## License

[MIT License](http://www.opensource.org/licenses/MIT)
