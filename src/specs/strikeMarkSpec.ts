import { MarkSpec } from 'prosemirror-model'

const StrikeMarkSpec: MarkSpec = {
  parseDOM: [
    {
      style: 'text-decoration',
      getAttrs: value => {
        return value === 'line-through' && null
      },
    },
  ],
  toDOM: () => {
    const style = 'text-decoration: line-through'
    return ['span', { style }, 0]
  },
}

export default StrikeMarkSpec
