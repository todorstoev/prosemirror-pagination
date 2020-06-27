import { NodeSpec, Node, DOMOutputSpec } from 'prosemirror-model'
import { rgbToHex } from '../utils'

export const StartNodeSpec: NodeSpec = {
  attrs: {
    width: { default: 20 },
    background: { default: '#f6f8fa' },
    class: { default: 'page-start' },
  },
  atom: true,
  draggable: false,
  defining: true,
  toDOM: (node: Node): DOMOutputSpec => {
    const { class: className, width, background } = node.attrs

    const style: string = `width:${width}mm;background:${background}`

    return ['div', { style, class: className }]
  },
  parseDOM: [
    {
      tag: 'div.page-start',
      getAttrs: (dom: HTMLElement) => {
        const { style } = dom

        const [red, green, blue] = style.backgroundColor.replace(/[A-Za-z$-()]/g, '').split(',')

        const background: string = rgbToHex(Number(red), Number(green), Number(blue))

        const width: number = Number(style.width.replace(/[A-Za-z$-()]/g, '').split(',')[0])

        return { background, width }
      },
    },
  ],
}
