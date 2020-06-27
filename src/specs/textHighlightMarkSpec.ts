import { MarkSpec, Mark } from 'prosemirror-model'

import { isTransparent, toCSSColor } from '../utils/toCSSColor'

const TextHighlightMarkSpec: MarkSpec = {
  attrs: {
    highlightColor: {
      default: '',
    },
  },
  inline: true,
  group: 'inline',
  parseDOM: [
    {
      tag: 'span[style*=background-color]',
      getAttrs: (dom: HTMLElement) => {
        const { backgroundColor } = dom.style
        const color = toCSSColor(backgroundColor)
        return {
          highlightColor: isTransparent(color) ? '' : color,
        }
      },
    },
  ],

  toDOM: (node: Mark) => {
    const { highlightColor } = node.attrs
    let style = ''
    if (highlightColor) {
      style += `background-color: ${highlightColor};`
    }
    return ['span', { style }, 0]
  },
}

export default TextHighlightMarkSpec
