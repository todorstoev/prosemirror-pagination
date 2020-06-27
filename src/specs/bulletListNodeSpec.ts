import { Node, NodeSpec } from 'prosemirror-model'

import { ATTRIBUTE_LIST_STYLE_TYPE } from './listItemNodeSpec'
import { LIST_ITEM } from './nodeNames'
// import { MIN_INDENT_LEVEL } from './paragraphNodeSpec'

const AUTO_LIST_STYLE_TYPES = ['disc', 'square', 'circle']

const BulletListNodeSpec: NodeSpec = {
  attrs: {
    id: { default: null },
    indent: { default: 0 },
    listStyleType: { default: null },
  },
  group: 'block',
  content: LIST_ITEM + '+',
  parseDOM: [
    {
      tag: 'ul',
      getAttrs(dom: HTMLElement) {
        const listStyleType = dom.getAttribute(ATTRIBUTE_LIST_STYLE_TYPE) || null

        return {
          listStyleType,
        }
      },
    },
  ],

  toDOM(node: Node) {
    const { indent, listStyleType } = node.attrs
    const attrs: any = {}

    if (listStyleType) {
      attrs[ATTRIBUTE_LIST_STYLE_TYPE] = listStyleType
    }

    let htmlListStyleType = listStyleType

    if (!htmlListStyleType || htmlListStyleType === 'disc') {
      htmlListStyleType = AUTO_LIST_STYLE_TYPES[indent % AUTO_LIST_STYLE_TYPES.length]
    }

    attrs.type = htmlListStyleType
    return ['ul', attrs, 0]
  },
}

export default BulletListNodeSpec
