import { Node, NodeSpec, DOMOutputSpec } from 'prosemirror-model'

export const ATTRIBUTE_LIST_STYLE_TYPE = 'data-list-style-type'

const ALIGN_PATTERN = /(left|right|center|justify)/

function getAttrs(dom: HTMLElement) {
  const attrs: any = {}
  const { textAlign } = dom.style
  let align = dom.getAttribute('data-align') || textAlign || ''
  let font = dom.getAttribute('data-font')
  let fontFamily = dom.getAttribute('data-font-family')

  align = ALIGN_PATTERN.test(align) ? align : null

  if (align) {
    attrs.align = align
  }

  if (font) attrs.font = Number(font)

  if (fontFamily) attrs.fontFamily = fontFamily

  return attrs
}

const ListItemNodeSpec: NodeSpec = {
  attrs: {
    align: { default: null },
    font: { default: null },
    fontFamily: { default: null },
  },

  // NOTE:
  // This spec does not support nested lists (e.g. `'paragraph block*'`)
  // as content because of the complexity of dealing with indentation
  // (context: https://github.com/ProseMirror/prosemirror/issues/92).
  content: 'paragraph',

  parseDOM: [{ tag: 'li', getAttrs }],

  // NOTE:
  // This method only defines the minimum HTML attributes needed when the node
  // is serialized to HTML string. Usually this is called when user copies
  // the node to clipboard.
  // The actual DOM rendering logic is defined at `src/ui/ListItemNodeView.js`.
  toDOM(node: Node): DOMOutputSpec {
    const attrs: any = {}
    const { align, font, fontFamily } = node.attrs
    if (align) {
      attrs['data-align'] = align
    }
    if (font) {
      attrs['data-font'] = font
      attrs.style = `--list-font:${font}pt`
    }

    if (fontFamily) {
      attrs['data-font-family'] = fontFamily
    }
    return ['li', attrs, 0]
  },
}

export default ListItemNodeSpec
