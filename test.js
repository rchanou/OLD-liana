const assert = require('assert')
const { types, getParent } = require("mobx-state-tree");

const contextModelType = (name, ...rest) => {
  if (typeof name !== 'string') {
    throw new Error('Name required for context model type!')
  }

  const Model = types.model(name, ...rest)
  const contextKey = `__${Model}_`
  Model.Key = contextKey

  const getContext = node => {
    const context = node[contextKey]

    if (context) {
      return context
    }

    const parent = getParent(node)
    if (parent) {
      return getContext(parent)
    }

    return null
  }

  Model.Ref = types.optional(
    types.reference(Model, {
      set(val) {
        return 0
      }, get(identifier, parent) {
        return getContext(parent)
      }
    }), 0)

  return Model
}

const ContextUser = contextModelType('User', {
  username: types.string
})


const Card = types.model('Card', {
  context: ContextUser.Ref,
  id: types.identifier(types.number),
  body: types.string
})
  .views(self => ({
    get message() {
      return `${self.body} From ${self.context.username}`
    }
  }))

const List = types.model('List', {
  // [Context.Key]: types.maybe(Context),
  name: types.string,
  cards: types.array(Card)
})

const App = types.model('App', {
  [ContextUser.Key]: ContextUser,
  lists: types.array(List),
  selectedCard: types.reference(Card)
})

const example = App.create({
  [ContextUser.Key]: {
    username: 'testname'
  },
  selectedCard: 1,
  lists: [
    {
      name: 'Greetings',
      cards: [{ id: 1, body: 'Happy Birthday!' }, { id: 0, body: 'Merry Holidays!' }]
    },
    {
      name: 'Motivation',
      cards: [{
        id: 0,
        body: 'Doing great!'
      }, { id: 1, body: 'Keep it up!' }]
    }
  ]
})


assert.equal(example.lists[1].cards[0].message, 'Doing great! From testname')