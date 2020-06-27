import { NodeSpec, Node } from 'prosemirror-model'

import { rgbToHex } from '../utils'

export const FooterSpec: NodeSpec = {
  attrs: {
    background: { default: '#efefef' },
    detached: { default: false },
  },
  content: 'block+',
  group: 'footer',
  toDOM: (node: Node) => {
    const { background, detached } = node.attrs

    let style: string = ''

    if (background) style += ` background:${background};`

    return ['div', { style, class: 'page-footer', ['data-detached']: detached }, 0]
  },
  parseDOM: [
    {
      tag: 'div.page-footer',
      getAttrs: (dom: HTMLElement) => {
        if (!dom.classList.contains('page-footer')) {
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
