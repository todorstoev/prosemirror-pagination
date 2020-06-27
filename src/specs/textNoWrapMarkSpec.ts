import { MarkSpec, DOMOutputSpec } from 'prosemirror-model'

const NO_WRAP_DOM: DOMOutputSpec = ['nobr', 0]

const TextNoWrapMarkSpec: MarkSpec = {
  parseDOM: [{ tag: 'nobr' }],
  toDOM() {
    return NO_WRAP_DOM
  },
}

export default TextNoWrapMarkSpec
