import { NodeSpec, DOMOutputSpec } from 'prosemirror-model'

const BR_DOM: DOMOutputSpec = ['br']

const HardBreakNodeSpec: NodeSpec = {
  inline: true,
  group: 'inline',
  selectable: false,
  parseDOM: [{ tag: 'br' }],
  toDOM() {
    return BR_DOM
  },
}

export default HardBreakNodeSpec
