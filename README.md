# React Template Compiler

Compiles Vue templates into React render function

## Motivation

* Easy syntax that's similar to HTML, supported by most IDEs
* Utilize Web Components standard (single component file, slots, CSS4) knowledge instead of custom solutions
* Clear separation of presentation and logic - zero HTML in component logic
* Declarative coding ensures that the HTML that you write and the HTML you inspect look nearly identical.
* Performance: exclude static trees from diffing algorithms
* Reduce boilerplate when working with forms
* Reduce boilerplate passing event handlers and binding methods to `this`

## Why not use JSX?

Some love JSX, some don't. I don't. More specifically, it seems that JSX is only a good fit for components with very little HTML inside.

## Value

Compiler allows to write React components in a Single Component File, similar to how it's done for Vue

```html
<template>
  <ul>
    <li r-for="name in state.names">{{ name }}</li>
  </ul>

  <template r-if="state.isVisible">
    <div>{{ message }}</div>
  </template>
  <input :value="state.message" @change="updateMessage">
  <button @click="toggleMessage">toggle message</button>
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
      },
      toggleMessage() {
        this.setState((prevState) => ({
          isVisible: !prevState.isVisible
        }))
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

See [react-webpack-loader](https://github.com/stalniy/react-webpack-loader) for details

**Current Limitations**:
* React doesn't support `passive` handlers thus I will either skip their support in the first release or find a way how to add them in runtime

## Credits

Inspired by:
* [Vue](https://github.com/vuejs/vue)
* [vue-loader](https://github.com/vuejs/vue-loader)

Big thanks to Evan You @yyx990803 for creating Vue!

## License

[MIT License](http://www.opensource.org/licenses/MIT)
