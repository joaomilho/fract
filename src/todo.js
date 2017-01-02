/** @jsx h */
import { h } from 'react-flyd'
import { map, stream } from 'flyd'
import filter from 'flyd/module/filter'
import R from 'ramda'
import { passingInput, withInput } from './fract'

export const model = {todos: []}

const onTodos = R.over(R.lensProp('todos'))
const updateTodo = R.curry((idx, update, state) => R.over(R.lensPath(['todos', idx]), R.evolve(update), state))
const actions = {
  toggle: updateTodo(R.__, { complete: R.not }),
  edit: updateTodo(R.__, { editing: R.T }),
  edited: ({idx, title}, state) => updateTodo(idx, { editing: R.F, title: R.always(title) }, state),
  clear: R.flip(onTodos(R.reject(R.prop('complete')))),
  destroy: (idx, state) => onTodos(R.remove(idx, 1), state),
  new: (title, state) => onTodos(R.prepend({title, editing: false, complete: false}), state),
  route: R.assoc('route')
}

export const reducer = (state, {type, payload}) =>
  actions[type] ? actions[type](payload, state) : state

const filters = {
  '': R.identity,
  active: R.filter(R.propEq('complete', false)),
  completed: R.filter(R.prop('complete'))
}

export const presenter = ({todos, route}) => ({
  route,
  count: filters.active(todos).length,
  todos: filters[R.drop(1, route) || ''](todos)
})

export const root = passingInput((plugin) => (...state) => (
  <div>{ plugin.output(...state) }</div>
))

const keyDown$ = stream()
const valueOnEnter = R.pipe(filter(R.propEq('keyCode', 13)), map(R.path(['target', 'value'])))
export const header = withInput(valueOnEnter(keyDown$), () => () => (
  <main className='header'>
    <h1>todos</h1>
    <input className='new-todo' placeholder='What needs to be done?' onKeyDown={stream(keyDown$)} autoFocus />
  </main>
))

export const main = passingInput((plugin) => (state) => (
  <section className='main'>
    <input className='toggle-all' type='checkbox' />
    <ul className='todo-list'>{plugin.output(state)}</ul>
  </section>
))

export const todo = passingInput((plugin) => (todo, idx) => (
  <li className={'editing'}>{plugin.output(todo, idx)}</li>
))

const clear$ = stream()
export const footer = withInput(clear$, () => (state) => (
  <footer className='footer'>
    <span className='todo-count'>
      <strong>{state.count}</strong> todo{state.count === 1 ? '' : 's'} left
    </span>
    <ul className='filters'>
      <li><a href='#/' className={state.route === '/' && 'selected'}>All</a></li>
      <li><a href='#/active' className={state.route === '/active' && 'selected'}>Active</a></li>
      <li><a href='#/completed' className={state.route === '/completed' && 'selected'}>Completed</a></li>
    </ul>
    <button className='clear-completed' onClick={stream(clear$)}>Clear completed</button>
  </footer>
))

const destroy$ = stream()
export const destroy = withInput(destroy$, (plugins) => (_, idx) => (
  <button className='destroy' onClick={() => destroy$(idx)} />
))

const edit$ = stream()
export const edit = withInput(edit$, () => (todo, idx) => (
  <label onDoubleClick={() => edit$(idx)}>{todo.title}</label>
))

const onSubmit$ = stream()
export const editor = withInput(onSubmit$, () => (todo, idx) => (
  <form onSubmit={(e) => { e.preventDefault(); onSubmit$({title: e.target.title.value, idx}) }}>
    <input name='title' className='edit' defaultValue={todo.title} />
  </form>
))

const toggle$ = stream()
export const toggle = withInput(toggle$, () => (todo, idx) => (
  <input className='toggle' type='checkbox' checked={todo.complete} onChange={() => toggle$(idx)} />
))
