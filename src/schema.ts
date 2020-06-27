import { Schema } from 'prosemirror-model'
import * as nodeNames from './specs/nodeNames'
import * as markNames from './specs/markNames'
import BlockquoteNodeSpec from './specs/blockquoteNodeSpec'
import BulletListNodeSpec from './specs/bulletListNodeSpec'
import CodeBlockNodeSpec from './specs/codeBlockNodeSpec'
import DocNodeSpec from './specs/docNodeSpec'
import HardBreakNodeSpec from './specs/hardBreakNodeSpec'
import HeadingNode from './specs/headingNodeSpec'
import HorizontalRuleNodeSpec from './specs/horizontalRuleNodeSpec'
import { ImageNode } from './specs/imageNodeSpec'
import ListItemNodeSpec from './specs/listItemNodeSpec'
import OrderedListNodeSpec from './specs/orderedListNodeSpec'
import ParagraphNodeSpec from './specs/paragraphNodeSpec'
import TableNodesSpecs from './specs/tableNodesSpecs'
import TextNodeSpec from './specs/textNodeSpec'
import PageNodeSpec from './specs/pageNodeSpec'
import CodeMarkSpec from './specs/codeMarkSpec'
import EMMarkSpec from './specs/emMarkSpec'
import FontSizeMarkSpec from './specs/fontSizeMarkSpec'
import FontTypeMarkSpec from './specs/fontTypeMarkSpec'
import LinkMarkSpec from './specs/linkMarkSpec'
import SpacerMarkSpec from './specs/spacerMarkSpec'
import StrikeMarkSpec from './specs/strikeMarkSpec'
import StrongMarkSpec from './specs/strongMarkSpec'
import TextColorMarkSpec from './specs/textColorMarkSpec'
import TextHighlightMarkSpec from './specs/textHighlightMarkSpec'
import TextNoWrapMarkSpec from './specs/textNoWrapMarkSpec'
import TextSelectionMarkSpec from './specs/textSelectionMarkSpec'
import TextSuperMarkSpec from './specs/textSuperMarkSpec'
import TextUnderlineMarkSpec from './specs/textUnderlineMarkSpec'
import { BackgroundColorMarkSpec } from './specs/backgroundColorMarkSpec'
import { HeaderSpec } from './specs/headerNodeSpec'
import { FooterSpec } from './specs/footerNodeSpec'
import { BodySpec } from './specs/bodyNodeSpec'
import { EndNodeSpec } from './specs/endNodeSpec'
import { PageCounter } from './specs/pageCounterNodeSpec'
import { StartNodeSpec } from './specs/startNodeSpec'

const marks = {
  [markNames.MARK_LINK]: LinkMarkSpec,
  [markNames.MARK_NO_BREAK]: TextNoWrapMarkSpec,
  [markNames.MARK_CODE]: CodeMarkSpec,
  [markNames.MARK_EM]: EMMarkSpec,
  [markNames.MARK_FONT_SIZE]: FontSizeMarkSpec,
  [markNames.MARK_FONT_FAMILY]: FontTypeMarkSpec,
  [markNames.MARK_SPACER]: SpacerMarkSpec,
  [markNames.MARK_STRIKE]: StrikeMarkSpec,
  [markNames.MARK_STRONG]: StrongMarkSpec,
  [markNames.MARK_SUPER]: TextSuperMarkSpec,
  [markNames.MARK_TEXT_COLOR]: TextColorMarkSpec,
  [markNames.MARK_TEXT_HIGHLIGHT]: TextHighlightMarkSpec,
  [markNames.MARK_BACKGROUND_COLOR]: BackgroundColorMarkSpec,
  [markNames.MARK_TEXT_SELECTION]: TextSelectionMarkSpec,
  [markNames.MARK_UNDERLINE]: TextUnderlineMarkSpec,
}

export const schema = new Schema({
  nodes: {
    [nodeNames.DOC]: DocNodeSpec,
    [nodeNames.PAGE]: PageNodeSpec,
    [nodeNames.PARAGRAPH]: ParagraphNodeSpec,
    [nodeNames.BLOCKQUOTE]: BlockquoteNodeSpec,
    [nodeNames.HORIZONTAL_RULE]: HorizontalRuleNodeSpec,
    [nodeNames.HEADING]: HeadingNode,
    [nodeNames.CODE_BLOCK]: CodeBlockNodeSpec,
    [nodeNames.TEXT]: TextNodeSpec,
    [nodeNames.IMAGE]: ImageNode,
    [nodeNames.HARD_BREAK]: HardBreakNodeSpec,
    [nodeNames.BULLET_LIST]: BulletListNodeSpec,
    [nodeNames.ORDERED_LIST]: OrderedListNodeSpec,
    [nodeNames.LIST_ITEM]: ListItemNodeSpec,
    [nodeNames.HEADER]: HeaderSpec,
    [nodeNames.FOOTER]: FooterSpec,
    [nodeNames.BODY]: BodySpec,
    [nodeNames.END]: EndNodeSpec,
    [nodeNames.START]: StartNodeSpec,
    [nodeNames.PAGE_COUNTER]: PageCounter,
    ...TableNodesSpecs,
  },
  marks,
})
