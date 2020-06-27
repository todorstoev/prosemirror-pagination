import { Plugin, PluginSpec, EditorState, Transaction, PluginKey } from 'prosemirror-state'

import { findParentDomRefOfType, setTextSelection } from 'prosemirror-utils'
import { PAGE, BODY, FOOTER, HEADER, PAGE_COUNTER, PARAGRAPH, TABLE, END, START } from './specs/nodeNames'
import { EditorView } from 'prosemirror-view'
import { Schema, Slice, Node, Fragment, MarkType, Mark } from 'prosemirror-model'
import { ReplaceStep } from 'prosemirror-transform'

import { splitPage } from './utils'
import { isNullOrUndefined } from './utils'
import { ptToPx } from './utils'
import { MARK_FONT_SIZE } from './specs/markNames'

const PARAGRAPH_DEPTH = 3
// const TABLE_DEPTH = 5

export const key = new PluginKey('pagingPlugin')

export const paginationPlugin = (): Plugin => {
  return new Plugin({
    key: key,
    state: {
      init: () => {
        return { bodyHeight: null, bodyBoundaries: null, posAtBodyEnd: null }
      },
      apply: (tr, prev) => {
        const maxHeight: number = tr.getMeta('splitPage')

        const bodyBoundaries: DOMRect = tr.getMeta('bodyBoundaries')

        const posAtBodyEnd: any = tr.getMeta('posAtBodyEnd')

        let next = { ...prev }

        if (maxHeight) next.bodyHeight = maxHeight

        if (bodyBoundaries) next.bodyBoundaries = bodyBoundaries

        if (posAtBodyEnd) next.posAtBodyEnd = posAtBodyEnd

        if (!posAtBodyEnd || !maxHeight || !bodyBoundaries)
          next = { bodyHeight: null, bodyBoundaries: null, posAtBodyEnd: null }

        // console.log(next)

        return next
      },
    },
    view: () => {
      return {
        update: (view: EditorView, prevState: EditorState) => {
          const { selection, schema, tr } = view.state

          if (view.state.doc.eq(prevState.doc)) return

          const domAtPos = view.domAtPos.bind(view)

          const pageDOM = findParentDomRefOfType(schema.nodes[PAGE], domAtPos)(selection)

          const pageBody = (pageDOM as HTMLElement).querySelector('.page-body')

          if (pageBody.scrollHeight > pageBody.clientHeight) {
            const bodyBoundaries = pageBody.getBoundingClientRect()

            const posAtBodyEnd = view.posAtCoords({ left: bodyBoundaries.left, top: bodyBoundaries.bottom })

            view.dispatch(
              tr
                .setMeta('splitPage', pageBody.clientHeight)
                .setMeta('bodyBoundaries', bodyBoundaries)
                .setMeta('posAtBodyEnd', posAtBodyEnd)
            )
          }
        },
      }
    },
    appendTransaction([_newTr], _prevState, state) {
      let { tr, schema } = state

      const { bodyHeight } = this.getState(state)

      let prevSelectionPos: number | null

      if (!bodyHeight) return

      if (
        state.selection.$head.node(1) === state.doc.lastChild &&
        state.selection.$head.node(2).lastChild === state.selection.$head.node(3) &&
        state.selection.$head.node(3).type === schema.nodes[TABLE]
      ) {
        tr = tr.step(new ReplaceStep(tr.selection.head - 2, tr.selection.head, Slice.empty))

        return splitPage(tr, tr.selection.head, tr.selection.$head.depth, null, schema)
      }

      prevSelectionPos = state.selection.head

      tr = removeHeadersAndFooters(tr, schema)

      tr = joinDocument(tr)

      tr = addHeadersAndFooters(tr, schema)

      tr = splitDocument(tr, state)

      tr = skipFooterInSelection(tr, schema, prevSelectionPos)

      return tr
    },
  } as PluginSpec)
}

function skipFooterInSelection(tr: Transaction, schema: Schema, prevSelectionPos: number): Transaction {
  const newTr = setTextSelection(prevSelectionPos)(tr)

  if (newTr.selection.$head.node(2).type !== schema.nodes[BODY]) {
    return skipFooterInSelection(newTr, schema, prevSelectionPos + 1)
  }

  return newTr
}

function removeHeadersAndFooters(tr: Transaction, schema: Schema): Transaction {
  tr.doc.descendants((node, pos) => {
    const mappedPos = tr.mapping.map(pos)

    if (node.type === schema.nodes[FOOTER]) {
      tr = tr.step(new ReplaceStep(mappedPos, mappedPos + node.nodeSize, Slice.empty))
      return false
    }

    if (node.type === schema.nodes[HEADER]) {
      tr = tr.step(new ReplaceStep(mappedPos, mappedPos + node.nodeSize, Slice.empty))
      return false
    }

    if (node.type === schema.nodes[PAGE_COUNTER]) {
      tr = tr.step(new ReplaceStep(mappedPos, mappedPos + node.nodeSize, Slice.empty))
      return false
    }

    if (node.type === schema.nodes[END]) {
      tr = tr.step(new ReplaceStep(mappedPos, mappedPos + node.nodeSize, Slice.empty))
      return false
    }

    if (node.type === schema.nodes[START]) {
      tr = tr.step(new ReplaceStep(mappedPos, mappedPos + node.nodeSize, Slice.empty))
      return false
    }

    if (node.type === schema.nodes[BODY]) {
      return false
    }
  })

  return tr
}

function joinDocument(tr: Transaction): Transaction {
  while (tr.doc.content.childCount > 1) {
    tr.join(tr.doc.content.firstChild.nodeSize, 2)
  }

  return tr
}

function addHeadersAndFooters(tr: Transaction, schema: Schema): Transaction {
  const cachedHeader = JSON.parse(sessionStorage.getItem('header'))

  const cachedFooter = JSON.parse(sessionStorage.getItem('footer'))

  const header = cachedHeader ? Node.fromJSON(schema, cachedHeader) : schema.nodes[HEADER].createAndFill({}, null)

  const footer = cachedFooter ? Node.fromJSON(schema, cachedFooter) : schema.nodes[FOOTER].createAndFill({}, null)

  const end = schema.nodes[END].create()

  const start = schema.nodes[START].create()

  const counter = schema.nodes[PAGE_COUNTER].create()

  tr = tr.insert(tr.doc.firstChild.content.firstChild.nodeSize + 1, Fragment.from([footer, end, counter]))

  tr = tr.insert(1, Fragment.from([start, header]))

  return tr
}

function splitDocument(tr: Transaction, state: EditorState): Transaction {
  const { schema } = state

  const splitInfo = getNodeHeight(tr.doc, state)

  if (!splitInfo) return tr

  let newTr = splitPage(tr, splitInfo.pos - 1, splitInfo.depth, null, state.schema)

  newTr = removePararaphAtStart(newTr, schema)

  if (getNodeHeight(newTr.doc, state)) {
    return splitDocument(newTr, state)
  }

  return newTr
}

function getNodeHeight(doc: Node, state: EditorState): { pos: number; height: number; depth: number } | null {
  const { schema } = state

  const { lastChild } = doc

  const { bodyHeight } = key.getState(state)

  let accumolatedHeight: number = 0

  let pageBoundary = null

  doc.descendants((node, pos) => {
    //
    // This function measurs rest of the node and returns postiotns and depth wheret to split
    //

    if (accumolatedHeight > bodyHeight) {
      return false
    }

    if (node.type === schema.nodes[PAGE] && node !== lastChild) {
      return false
    }

    if (node.type === schema.nodes[HEADER]) return false

    if (node.type === schema.nodes[FOOTER]) return false

    if (node.type === schema.nodes[PAGE_COUNTER]) return false

    if (node.type === schema.nodes[TABLE]) {
      return false
    }

    if (node.type === schema.nodes[PARAGRAPH]) {
      let parsedPoints: number = 15

      const fontSizeMark: number = biggestMarkInNode(node, schema.marks[MARK_FONT_SIZE])

      if (!isNullOrUndefined(fontSizeMark)) parsedPoints = ptToPx(fontSizeMark)

      const pHeight = parsedPoints + node.attrs.paddingTop + node.attrs.paddingBottom

      accumolatedHeight += pHeight

      if (accumolatedHeight > bodyHeight) pageBoundary = { pos, height: accumolatedHeight, depth: PARAGRAPH_DEPTH }

      return false
    }
  })

  return pageBoundary ? pageBoundary : null
}

function biggestMarkInNode(node: Node, markType: MarkType): number | null {
  if (!node.firstChild) return null

  let biggestNumber: number = 0

  node.forEach(child => {
    const [fontSizeMark] = child.marks.filter((m: Mark) => m.type === markType)

    if (!fontSizeMark) return

    if (fontSizeMark.attrs.pt > biggestNumber) biggestNumber = fontSizeMark.attrs.pt
  })

  return biggestNumber > 0 ? biggestNumber : null
}

function removePararaphAtStart(tr: Transaction, schema: Schema): Transaction {
  let { lastChild } = tr.doc

  tr.doc.descendants((node, pos) => {
    if (node.type === schema.nodes[PAGE] && node !== lastChild) {
      return false
    }

    if (node.type === schema.nodes[BODY]) {
      const firstParagraph = tr.doc.nodeAt(pos + 1)

      tr = tr.delete(pos + 1, pos + 1 + firstParagraph.nodeSize)

      return false
    }
  })

  return tr
}
