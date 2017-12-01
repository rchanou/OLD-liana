import { types, getParent } from 'mobx-state-tree'

export const makeContextModel = (name, ...rest) => {
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
