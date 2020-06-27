import { MarkSpec } from 'prosemirror-model'

const CodeMarkSpec: MarkSpec = {
  parseDOM: [{ tag: 'code' }],
  toDOM: () => ['code', 0],
}

export default CodeMarkSpec
