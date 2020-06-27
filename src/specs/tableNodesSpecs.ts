import toCSSColor from '../utils/toCSSColor'
import { Node } from 'prosemirror-model'
import { tableNodes } from 'prosemirror-tables'

const NO_VISIBLE_BORDER_WIDTH = new Set(['0pt', '0px'])

const TableNodesSpecs = tableNodes({
  tableGroup: 'block',
  cellContent: 'block+',
  cellAttributes: {
    borderColor: {
      default: null,
      getFromDOM(dom: HTMLElement) {
        const { borderColor, borderWidth } = dom.style

        if (NO_VISIBLE_BORDER_WIDTH.has(borderWidth)) {
          return 'transparent'
        }

        return (borderColor && toCSSColor(borderColor)) || null
      },
      setDOMAttr(value, attrs) {
        if (value) {
          attrs.style = (attrs.style || '') + `border-color: ${value};`
        }
      },
    },
    background: {
      default: null,
      // TODO: Move these to a table helper.
      getFromDOM(dom: HTMLElement) {
        return dom.style.backgroundColor || null
      },
      setDOMAttr(value, attrs) {
        if (value) {
          attrs.style = (attrs.style || '') + `background-color: ${value};`
        }
        // if (attrs['data-colwidth']) {
        // 	att
        // }
      },
    },
    align: {
      default: null,
      // TODO: Move these to a table helper.
      getFromDOM(dom: HTMLTableCellElement) {
        return dom.align || null
      },
      setDOMAttr(value, attrs) {
        if (value) {
          attrs.align = (attrs.align || '') + value
        }
        // if (attrs['data-colwidth']) {
        // 	att
        // }
      },
    },
    valign: {
      default: null,
      // TODO: Move these to a table helper.
      getFromDOM(dom: HTMLTableCellElement) {
        return dom.vAlign || null
      },
      setDOMAttr(value, attrs) {
        if (value) {
          attrs.vAlign = (attrs.vAlign || '') + value
        }
        // if (attrs['data-colwidth']) {
        // 	att
        // }
      },
    },
    class: {
      default: '',
      // TODO: Move these to a table helper.
      getFromDOM(dom: HTMLElement) {
        return (dom.className = '')
      },
      setDOMAttr(value, attrs) {
        if (value) {
          attrs.class = value
        }
      },
    },
    borderWidth: {
      default: 1,
      // TODO: Move these to a table helper.
      getFromDOM(dom: HTMLElement) {
        let { borderWidth } = dom.style

        const bwidth = Number(borderWidth.replace(/[A-Za-z$-()]/g, ''))

        return bwidth
      },
      setDOMAttr(value, attrs) {
        if (value) {
          attrs.style = (attrs.style || '') + `border-width: ${value}px;`
        }
      },
    },
  },
})

// Override the default table node spec to support custom attributes.
const TableNodeSpec = Object.assign({}, TableNodesSpecs.table, {
  attrs: {
    marginLeft: { default: null },
  },
  parseDOM: [
    {
      tag: 'table',
      getAttrs(dom: HTMLElement): Object {
        const { marginLeft } = dom.style
        if (marginLeft && /\d+px/.test(marginLeft)) {
          return { marginLeft: parseFloat(marginLeft) }
        }
        return undefined
      },
    },
  ],
  toDOM(node: Node): Array<any> {
    // Normally, the DOM structure of the table node is rendered by
    // `TableNodeView`. This method is only called when user selects a
    // table node and copies it, which triggers the "serialize to HTML" flow
    //  that calles this method.

    const { marginLeft } = node.attrs
    const domAttrs: any = {}
    if (marginLeft) {
      domAttrs.style = `margin-left: ${marginLeft}px`
    }

    return ['table', domAttrs, 0]
  },
})
Object.assign(TableNodesSpecs, { table: TableNodeSpec })

export default TableNodesSpecs
