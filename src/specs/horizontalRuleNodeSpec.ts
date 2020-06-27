import { Node, NodeSpec, DOMOutputSpec } from 'prosemirror-model'

const DOM_ATTRIBUTE_PAGE_BREAK = 'data-page-break'

function getAttrs(dom: HTMLElement) {
  const attrs: any = {}
  if (dom.getAttribute(DOM_ATTRIBUTE_PAGE_BREAK) || dom.style.pageBreakBefore === 'always') {
    // Google Doc exports page break as HTML:
    // `<hr style="page-break-before:always;display:none; />`.
    attrs.pageBreak = true
  }

  return attrs
}

const HorizontalRuleNode: NodeSpec = {
  attrs: {
    pageBreak: { default: null },
  },

  group: 'block',

  parseDOM: [{ tag: 'hr', getAttrs }],

  toDOM: (node: Node): DOMOutputSpec => {
    const domAttrs = {}
    if (node.attrs.pageBreak) {
      domAttrs[DOM_ATTRIBUTE_PAGE_BREAK] = 'true'
    }
    return ['hr', domAttrs]
  },
}

export default HorizontalRuleNode
