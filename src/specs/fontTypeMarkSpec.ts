import { Mark, MarkSpec } from 'prosemirror-model'

import { loader as WebFontLoader } from '../utils'

export const FONT_TYPE_NAMES = [
  'Arial',
  'Times New Roman',
  'Courier New',
  'Roboto',
  'Verdana',

  // 'Arial Black',
  // 'Georgia',
  // 'Tahoma',
  // 'Times',
  // 'Verdana',
  // 'Courier New',
  // 'Lucida Console',
  // 'Monaco',
  // 'monospace'
]

const RESOLVED_FONT_NAMES = new Set(FONT_TYPE_NAMES)

const FontTypeMarkSpec: MarkSpec = {
  attrs: {
    name: { default: '' },
  },
  inline: true,
  group: 'inline',
  parseDOM: [
    {
      style: 'font-family',
      getAttrs: (name: string) => {
        return {
          name: name ? name.replace(/[\"\']/g, '') : '',
        }
      },
    },
  ],

  toDOM(node: Mark) {
    const { name } = node.attrs
    const attrs: any = {}
    if (name) {
      if (!RESOLVED_FONT_NAMES.has(name)) {
        // TODO: Cache custom fonts and preload them earlier.
        RESOLVED_FONT_NAMES.add(name)
        // https://github.com/typekit/webfontloader
        WebFontLoader.load({ google: { families: [name] } })
      }
      attrs.style = `font-family: ${name}`
    }
    return ['span', attrs, 0]
  },
}

export default FontTypeMarkSpec
