import { NodeSpec, Node } from 'prosemirror-model'

export const PageCounter: NodeSpec = {
  attrs: {
    top: { default: 0 },
    left: { default: 0 },
    mode: { default: 'full' },
  },
  content: `block?`,
  group: 'block',
  toDOM: (node: Node) => {
    const { top, left, mode } = node.attrs

    const attrs: any = {}

    attrs.style = 'position:absolute;min-width:10px;min-height:10px;background:red;'

    if (top) attrs.style += `top:${top}mm;`

    if (left) attrs.style += `left:${left}mm;`

    if (mode) attrs['data-mode'] = mode

    attrs.class = 'page-counter'

    return ['div', attrs, 0]
  },
  parseDOM: [
    {
      tag: 'div.page-counter',
      getAttrs: (dom: HTMLElement) => {
        if (!dom.classList.contains('page-counter')) {
          return
        }

        const { style } = dom

        const top = style.top.replace(/[A-Za-z$-()]/g, '').split(',')

        const left = style.left.replace(/[A-Za-z$-()]/g, '').split(',')

        return { top, left }
      },
    },
  ],
}
