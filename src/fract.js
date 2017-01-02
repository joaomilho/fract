/* globals localStorage */
import { merge, on, scan, stream } from 'flyd'
import mergeAll from 'flyd/module/mergeall'
import { render } from 'react-dom'

export const passingInput = (fn) => (plugin) => ({ input: plugin.input, output: fn(plugin) })

export const withInput = (input, fn) => (plugin) => ({ input: () => input, output: fn(plugin) })

export const run = (plugin) => on(plugin.output, plugin.input())

export const action = (type, plugin) => ({
  input: () => plugin.input().map((payload) => ({type, payload})),
  output: plugin.output
})

const onHashChange = stream()
const hash = () => window.location.hash.substring(1)
export const router = () => ({
  input: () => {
    onHashChange(hash())
    window.onhashchange = onHashChange
    return onHashChange.map(hash)
  }
})

export const group = (plugins) => ({
  input: () => mergeAll(plugins.filter(p => !!p.input).map(p => p.input())),
  output: (...state) => plugins.filter(p => !!p.output).map(p => p.output(...state))
})

export const mapping = (prop, plugin) => ({
  input: plugin.input,
  output: (state) => state[prop].map(plugin.output)
})

export const present = (transformer, plugin) => ({
  input: plugin.input,
  output: (state) => plugin.output(transformer(state))
})

export const conditionally = (condition, pluginIfTrue, pluginIfFalse) => ({
  input: () => merge(pluginIfTrue.input(), pluginIfFalse.input()),
  output: (...state) => {
    const plugin = condition(...state) ? pluginIfTrue : pluginIfFalse
    return plugin.output(...state)
  }
})

export const reactDOM = (root = document.body, plugin) => ({
  input: plugin.input,
  output: (state) => render(plugin.output(state), root)
})

export const reduce = (reducer, plugin) => ({
  input: (initialState) => scan(reducer, initialState, plugin.input()),
  output: plugin.output
})

export const storage = (initialState, plugin) => {
  const state = JSON.parse(localStorage.getItem('todos-fract')) || initialState

  return {
    input: () => plugin.input(state),
    output: (state) => {
      localStorage.setItem('todos-fract', JSON.stringify(state))
      return plugin.output(state)
    }
  }
}
