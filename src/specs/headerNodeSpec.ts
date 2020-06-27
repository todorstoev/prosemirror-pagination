import { NodeSpec, Node } from 'prosemirror-model'

import { rgbToHex } from '../utils'

export const HeaderSpec: NodeSpec = {
  attrs: {
    background: { default: '#efefef' },
    detached: { default: false },
  },
  content: 'block+',
  group: 'header',
  defining: true,
  isolating: true,
  toDOM: (node: Node) => {
    const { background, detached } = node.attrs

    let style: string = ''

    if (background) style += ` background:${background};`

    return ['div', { style, class: 'page-header', ['data-detached']: detached }, 0]
  },
  parseDOM: [
    {
      tag: 'div.page-header',
      getAttrs: (dom: HTMLElement) => {
        if (!dom.classList.contains('page-header')) {
          return
        }

        const { style } = dom

        const [red, green, blue] = style.backgroundColor.replace(/[A-Za-z$-()]/g, '').split(',')

        const background = rgbToHex(Number(red), Number(green), Number(blue))

        const detached = dom.dataset.detached === 'true'

        return { background, detached }
      },
    },
  ],
}
