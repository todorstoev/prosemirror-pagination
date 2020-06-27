import { NodeSpec, Node } from 'prosemirror-model'
import { rgbToHex } from '../utils'

export const BodySpec: NodeSpec = {
  attrs: {
    background: { default: '#e6e6e6' },
    indentLeft: { default: 5 },
    indentRight: { default: 5 },
    indentTop: { default: 5 },
    indentBottom: { default: 5 },
  },

  content: 'block+',
  toDOM: (node: Node) => {
    const { indentLeft, indentRight, indentBottom, indentTop, background } = node.attrs
    let style: string = `display:block; position:relative;clear:both;margin-left:${indentLeft}mm; margin-right:${indentRight}mm;margin-top:${indentTop}mm;margin-bottom:${indentBottom}mm;`

    if (background) style += ` background:${background};`

    return ['div', { style, class: 'page-body' }, 0]
  },
  parseDOM: [
    {
      tag: 'div.page-body',
      getAttrs: (dom: HTMLElement) => {
        const { style } = dom

        const [red, green, blue] = style.backgroundColor.replace(/[A-Za-z$-()]/g, '').split(',')

        const background = rgbToHex(Number(red), Number(green), Number(blue))

        const indentLeft = Number(style.marginLeft.replace(/[A-Za-z$-()]/g, '').split(',')[0])

        const indentRight = Number(style.marginRight.replace(/[A-Za-z$-()]/g, '').split(',')[0])

        const indentTop = Number(style.marginTop.replace(/[A-Za-z$-()]/g, '').split(',')[0])

        const indentBottom = Number(style.marginBottom.replace(/[A-Za-z$-()]/g, '').split(',')[0])

        return { background, indentLeft, indentRight, indentTop, indentBottom }
      },
    },
  ],
}
