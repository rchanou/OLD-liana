import { types, getParent } from 'mobx-state-tree'

export const makeContextModel = Model => {
  if (typeof Model.name !== 'string') {
    throw new Error('Name required for context model type!')
  }

  const Key = `__${Model.name}_`

  const getContext = node => {
    const context = node[Key]

    if (context) {
      return context
    }

    const parent = getParent(node)
    if (parent) {
      return getContext(parent)
    }

    return null
  }

  const ContextRef = types.optional(
    types.reference(Model, {
      set(val) {
        return 0
      }, get(identifier, parent) {
        return getContext(parent)
      }
    }), 0)

  const ContextMixin = {
    [Key]: Model
  }

  return { Key, Model, ContextRef, ContextMixin }
}
