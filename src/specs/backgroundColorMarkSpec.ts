import { MarkSpec, DOMOutputSpec, Mark } from 'prosemirror-model'

import { isTransparent, toCSSColor } from '../utils'

export const BackgroundColorMarkSpec: MarkSpec = {
  attrs: {
    backgroundColor: { default: '' },
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
          backgroundColor: isTransparent(color) ? '' : color,
        }
      },
    },
  ],

  toDOM: (node: Mark): DOMOutputSpec => {
    const { backgroundColor } = node.attrs
    let style = ''
    if (backgroundColor) {
      style += `background-color: ${backgroundColor};`
    }
    return ['span', { style }, 0]
  },
}
