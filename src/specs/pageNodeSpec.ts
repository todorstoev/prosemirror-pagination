import { Node, NodeSpec } from 'prosemirror-model'
import { HEADER, BODY, FOOTER, PAGE_COUNTER, END, START } from './nodeNames'
import { rgbToHex } from '../utils'

const PageDragNodeSpec: NodeSpec = {
  attrs: {
    class: { default: 'editor-page' },
    height: { default: 298 },
    width: { default: 211 },
    margin: { default: 'auto' },
    background: { default: '#ffffff' },
    orientation: { default: 'portrait' },
    indentLeft: { default: 20 },
    indentRight: { default: 20 },
    indentTop: { default: 10 },
    indentBottom: { default: 10 },
    direction: { default: 'ltr' },
    rectoVerso: { default: false },
  },

  content: `${START}? ${HEADER}? ${BODY} ${FOOTER}? ${END}? ${PAGE_COUNTER}?`,
  parseDOM: [
    {
      tag: 'div.editor-page',
      getAttrs: (dom: HTMLElement) => {
        const { style, dataset } = dom

        const height = Number(style.height.replace(/[A-Za-z$-()]/g, '').split(',')[0])

        const width = Number(style.width.replace(/[A-Za-z$-()]/g, '').split(',')[0])

        const margin = 'auto'

        const [red, green, blue] = style.backgroundColor.replace(/[A-Za-z$-()]/g, '').split(',')

        const background = rgbToHex(Number(red), Number(green), Number(blue))

        const orientation = dataset.orientation

        const direction = dataset.direction

        const indentLeft = Number(style.paddingLeft.replace(/[A-Za-z$-()]/g, '').split(',')[0])

        const indentRight = Number(style.paddingRight.replace(/[A-Za-z$-()]/g, '').split(',')[0])

        const indentTop = Number(style.paddingTop.replace(/[A-Za-z$-()]/g, '').split(',')[0])

        const indentBottom = Number(style.paddingBottom.replace(/[A-Za-z$-()]/g, '').split(',')[0])

        const rectoVerso = JSON.parse(dataset.rectoverso)

        return {
          height,
          width,
          margin,
          background,
          orientation,
          direction,
          indentBottom,
          indentTop,
          indentLeft,
          indentRight,
          rectoVerso,
        }
      },
    },
  ],

  toDOM: (node: Node) => {
    const {
      indentLeft,
      indentRight,
      indentBottom,
      indentTop,
      height,
      width,
      orientation,
      background,
      direction,
      rectoVerso,
    } = node.attrs

    const attrs = {
      ['data-rectoverso']: rectoVerso,
      ['data-direction']: direction,
      ['data-orientation']: orientation,

      class: node.attrs.class,
      style: `direction:${direction};padding-left:${indentLeft}mm; padding-right:${indentRight}mm;padding-top:${indentTop}mm;padding-bottom:${indentBottom}mm;background-color:${background};`,
    }

    if (orientation === 'portrait') {
      attrs.style += `width:${width}mm;height:${height}mm`
    } else {
      attrs.style += `width:${height}mm;height:${width}mm`
    }

    return ['div', attrs, 0]
  },
}

export default PageDragNodeSpec
