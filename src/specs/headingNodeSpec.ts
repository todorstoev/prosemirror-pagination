import { Node, NodeSpec, DOMOutputSpec } from 'prosemirror-model'
import ParagraphNodeSpec from './paragraphNodeSpec'
import { getParagraphNodeAttrs, toParagraphDOM } from './paragraphNodeSpec'

export const HEADING_LEVELS = {
  N: 'Normal',
  H1: 'Heading 1',
  H2: 'Heading 2',
  H3: 'Heading 3',
  H4: 'Heading 4',
  H5: 'Heading 5',
  H6: 'Heading 6',
}

const HeadingNode: NodeSpec = {
  ...ParagraphNodeSpec,
  attrs: {
    ...ParagraphNodeSpec.attrs,

    level: { default: 'Normal' },
  },
  defining: true,
  parseDOM: [
    { tag: 'h1', getAttrs },
    { tag: 'h2', getAttrs },
    { tag: 'h3', getAttrs },
    { tag: 'h4', getAttrs },
    { tag: 'h5', getAttrs },
    { tag: 'h6', getAttrs },
  ],
  toDOM: (node: Node): DOMOutputSpec => {
    const dom = toParagraphDOM(node)
    const level = node.attrs.level || HEADING_LEVELS['N']
    // const { paddingBottom, paddingTop } = node.attrs

    if (level === HEADING_LEVELS['N']) {
      dom[0] = 'p'
    } else {
      dom[0] = typeof level === 'string' ? level.toLowerCase() : `h${level}`
    }

    return dom
  },
}

function getAttrs(dom: HTMLElement): Object {
  const attrs: any = getParagraphNodeAttrs(dom)

  const level = dom.nodeName || 'N'
  attrs.level = level

  return attrs
}

export default HeadingNode
