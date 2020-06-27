import { toCSSLineSpacing } from '../utils'
import { Node, NodeSpec, DOMOutputSpec } from 'prosemirror-model'
import { mmTopxConverter } from '../utils'
// import { PAGE } from './nodeNames'

// This assumes that every 36pt maps to one indent level.
export const INDENT_MARGIN_PT_SIZE = 36 // in case 20px
export const INDENT_MARGIN_SIZE = 20

export const MIN_INDENT_LEVEL = 0
export const MAX_INDENT_LEVEL = 50

export const EMPTY_CSS_VALUE = new Set(['', '0%', '0pt', '0px', 0])

const ALIGN_PATTERN = /(left|right|center|justify)/

const getAttrs = (dom: HTMLElement): any => {
  const { lineHeight, textAlign, direction } = dom.style

  let align = dom.getAttribute('align') || textAlign || ''
  align = ALIGN_PATTERN.test(align) ? align : null

  const lineSpacing = lineHeight ? toCSSLineSpacing(lineHeight) : null

  const id = dom.getAttribute('id') || ''

  const paddingTop = dom.style.paddingTop.replace(/[A-Za-z$-()]/g, '').split(',')

  const paddingBottom = dom.style.paddingBottom.replace(/[A-Za-z$-()]/g, '').split(',')

  return { align, lineSpacing, paddingTop, paddingBottom, id, direction }
}

const toDOM = (node: Node): DOMOutputSpec => {
  const {
    align,
    lineSpacing,
    paddingTop,
    paddingBottom,
    id,
    spellcheck,
    indentLeft,
    indentRight,
    direction,
  } = node.attrs

  const attrs: any = {}

  let style: string = ''

  if (align) {
    style += `text-align: ${align};`
  }

  // attr line-spacing
  if (lineSpacing) {
    const cssLineSpacing = toCSSLineSpacing(lineSpacing)
    style += `line-height: ${cssLineSpacing};`
  }

  if (paddingTop && !EMPTY_CSS_VALUE.has(paddingTop)) {
    style += `padding-top: ${paddingTop}px;`
  }

  if (paddingBottom && !EMPTY_CSS_VALUE.has(paddingBottom)) {
    style += `padding-bottom: ${paddingBottom}px;`
  }

  if (indentLeft) {
    style += `margin-left: ${mmTopxConverter(indentLeft)}px;`
  }

  if (indentRight) {
    style += `padding-right: ${mmTopxConverter(indentRight)}px;`
  }

  if (id) {
    attrs.id = id
  } else {
    attrs.id = `${node.type.name}_${Math.random().toString(36).substr(2, 9)}`
  }

  if (direction) {
    style += `direction:${direction};`
  }

  attrs.spellcheck = spellcheck
  style && (attrs.style = style)

  return ['p', attrs, 0]
}

export const ParagraphNodeSpec: NodeSpec = {
  attrs: {
    align: { default: null },
    color: { default: null },
    direction: { default: null },
    id: { default: null },
    // in mmm
    indentLeft: { default: 0 },
    indentRight: { default: 0 },
    lineSpacing: { default: null },
    spellcheck: { default: true },
    //in px
    paddingBottom: { default: 5 },
    paddingTop: { default: 5 },
  },
  content: 'inline*',
  group: 'block',
  parseDOM: [
    {
      tag: 'p',
      getAttrs,
    },
  ],
  toDOM,
}

export default ParagraphNodeSpec
export const toParagraphDOM = toDOM
export const getParagraphNodeAttrs = getAttrs
