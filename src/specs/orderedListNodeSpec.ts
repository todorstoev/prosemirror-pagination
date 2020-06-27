import { Node, NodeSpec } from 'prosemirror-model'

import { ATTRIBUTE_LIST_STYLE_TYPE } from './listItemNodeSpec'
import { LIST_ITEM } from './nodeNames'
import { INDENT_MARGIN_SIZE, MIN_INDENT_LEVEL } from './paragraphNodeSpec'

export const ATTRIBUTE_COUNTER_RESET = 'data-counter-reset'
export const ATTRIBUTE_FOLLOWING = 'data-following'
const AUTO_LIST_STYLE_TYPES = ['decimal', 'lower-alpha', 'lower-roman']

const OrderedListNodeSpec: NodeSpec = {
  attrs: {
    id: { default: null },
    counterReset: { default: null },
    indent: { default: MIN_INDENT_LEVEL },
    following: { default: null },
    listStyleType: { default: null },
    name: { default: null },
    start: { default: 1 },
  },
  group: 'block',
  content: LIST_ITEM + '+',
  parseDOM: [
    {
      tag: 'ol',
      getAttrs(dom: HTMLElement) {
        const listStyleType = dom.getAttribute(ATTRIBUTE_LIST_STYLE_TYPE)
        const counterReset = dom.getAttribute(ATTRIBUTE_COUNTER_RESET) || undefined

        const start = dom.hasAttribute('start') ? parseInt(dom.getAttribute('start'), 10) : 1

        const name = dom.getAttribute('name') || undefined

        const following = dom.getAttribute(ATTRIBUTE_FOLLOWING) || undefined

        return {
          counterReset,
          following,
          listStyleType,
          name,
          start,
        }
      },
    },
  ],
  toDOM: (node: Node): any => {
    const { start, indent, listStyleType, counterReset, following, name } = node.attrs

    const attrs: any = {}

    if (counterReset === 'none') {
      attrs[ATTRIBUTE_COUNTER_RESET] = counterReset
    }

    if (following) {
      attrs[ATTRIBUTE_FOLLOWING] = following
    }

    if (listStyleType) {
      attrs[ATTRIBUTE_LIST_STYLE_TYPE] = listStyleType
    }

    if (start !== 1) {
      attrs.start = start
    }

    if (name) {
      attrs.name = name
    }

    let htmlListStyleType = listStyleType

    if (!htmlListStyleType || htmlListStyleType === 'decimal') {
      htmlListStyleType = AUTO_LIST_STYLE_TYPES[indent % AUTO_LIST_STYLE_TYPES.length]
    }

    const cssCounterName = `czi-counter-${indent}`

    attrs.style =
      `--stylus-counter-name: ${cssCounterName};` +
      `--stylus-counter-reset: ${following ? 'none' : start - 1};` +
      `--stylus-list-style-type: ${htmlListStyleType}` +
      `margin-left: ${indent * INDENT_MARGIN_SIZE}px`

    attrs.type = htmlListStyleType

    return ['ol', attrs, 0]
  },
}

export default OrderedListNodeSpec
