import { run, action, router, mapping, group, present, conditionally, reactDOM, reduce, storage } from './fract'
import * as T from './todo'
import R from 'ramda'

const root = document.getElementById('root')

const view = present(T.presenter,
  T.root(
    group([
      action('new', T.header()),
      T.main(
        mapping('todos',
          T.todo(
            conditionally(R.prop('editing'),
              action('edited', T.editor()),
              group([
                action('toggle', T.toggle()),
                action('edit', T.edit()),
                action('destroy', T.destroy())
              ])
            )
          )
        )
      ),
      action('clear', T.footer())
    ])
  )
)

run(
  storage(T.model,
    reduce(T.reducer,
      group([
        action('route', router()),
        reactDOM(root, view)
      ])
    )
  )
)
