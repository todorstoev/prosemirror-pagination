import { MarkSpec, Mark } from 'prosemirror-model'

const TextSelectionMarkSpec: MarkSpec = {
  attrs: {
    id: {
      default: '',
    },
  },
  inline: true,
  group: 'inline',
  parseDOM: [
    {
      tag: 'czi-text-selection',
    },
  ],

  toDOM: (_node: Mark) => {
    return ['czi-text-selection', { class: 'czi-text-selection' }, 0]
  },
}

export default TextSelectionMarkSpec
