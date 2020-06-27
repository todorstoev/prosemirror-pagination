// @flow

import { MarkSpec, Mark } from 'prosemirror-model'

import { toClosestFontPtSize } from '../utils'

const FontSizeMarkSpec: MarkSpec = {
  attrs: {
    pt: { default: null },
  },
  inline: true,
  group: 'inline',
  parseDOM: [
    {
      style: 'font-size',
      getAttrs: getAttrs,
    },
  ],
  toDOM: (node: Mark) => {
    const { pt } = node.attrs
    const domAttrs = pt
      ? {
          style: `font-size: ${pt}pt;`,
          class: 'czi-font-size-mark ProseMirror-fontSize-mark',
        }
      : null

    return ['span', domAttrs, 0]
  },
}

function getAttrs(fontSize: string): Object {
  const attrs = {}
  if (!fontSize) {
    return attrs
  }

  const ptValue = toClosestFontPtSize(fontSize)
  if (!ptValue) {
    return attrs
  }
  return {
    pt: ptValue,
  }
}

export default FontSizeMarkSpec
