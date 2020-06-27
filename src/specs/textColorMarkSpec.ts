import { MarkSpec, Mark } from 'prosemirror-model'

import toCSSColor from '../utils/toCSSColor'

const TextColorMarkSpec: MarkSpec = {
  attrs: {
    color: {
      default: '',
    },
  },
  inline: true,
  group: 'inline',
  parseDOM: [
    {
      style: 'color',
      getAttrs: color => {
        return {
          color: toCSSColor(color),
        }
      },
    },
  ],
  toDOM: (node: Mark) => {
    const { color } = node.attrs
    let style = ''
    if (color) {
      style += `color: ${color};`
    }
    return ['span', { style }, 0]
  },
}

export default TextColorMarkSpec
