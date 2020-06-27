import { PAGE } from './nodeNames'
import { NodeSpec } from 'prosemirror-model'

export const LAYOUT = {
  US_LETTER_LANDSCAPE: 'us_letter_landscape',
  US_LETTER_PORTRAIT: 'us_letter_portrait',
  A4_FORMAT: 'a4_format',
}

export const ATTRIBUTE_LAYOUT = 'data-layout'

const DocNodeSpec: NodeSpec = {
  attrs: {
    counterTop: { default: 10 },
    counterLeft: { default: 10 },
    counterContent: { default: 'Page' },
    counterMode: { default: 'full' },
    zoom: { default: 1 },
    direction: { default: 'ltr' },
    layout: { default: 'document' },
  },
  content: `${PAGE}+`,
}
export default DocNodeSpec
