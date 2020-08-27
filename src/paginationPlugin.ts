import { Plugin, PluginSpec, EditorState, Transaction, PluginKey } from 'prosemirror-state'

import { findParentDomRefOfType, setTextSelection } from 'prosemirror-utils'
import { PAGE, BODY, FOOTER, HEADER, PAGE_COUNTER, PARAGRAPH, TABLE, END, START } from './specs/nodeNames'
import { EditorView } from 'prosemirror-view'
import { Schema, Slice, Node, Fragment, AttributeSpec } from 'prosemirror-model'
import { ReplaceStep } from 'prosemirror-transform'

import { splitPage } from './utils/splitPage'

// import { MARK_FONT_SIZE } from '../specs/markNames'
import { TableMap } from 'prosemirror-tables'
// import { isNullOrUndefined } from '../utils/utils'
// import { ptToPx } from '../utils/toCSSPTValue'

const PARAGRAPH_DEPTH = 3
const TABLE_DEPTH = 6

type MappedCell = {
  pos: number
  start: number
  node: Node
}

type SplitInfo = {
  pos: number
  height: number
  depth: number
  offsetInCell: number | null
  cellStart: number | null
}

type PluginState = {
  bodyHeight: number
  bodyWidth: number
  bodyBoundaries: DOMRect
  posAtBodyEnd: number
  cellInOffset: SplitInfo
  pasting: boolean
  deleting: boolean
  pagesMeta: Array<AttributeSpec>
}

// type ParagraphContent = { size: number; fontSizePt: number; textContent: string }

export const key = new PluginKey<PluginState>('pagingPlugin')

export const paginationPlugin = (): Plugin => {
  return new Plugin({
    key: key,
    state: {
      init: (): PluginState => ({
        bodyHeight: null,
        bodyWidth: null,
        bodyBoundaries: null,
        posAtBodyEnd: null,
        cellInOffset: null,
        pasting: false,
        deleting: false,
        pagesMeta: [],
      }),
      apply: (tr, prev): PluginState => {
        const bodyDimenssion: { bodyHeight: number; bodyWidth: number } = tr.getMeta('splitPage')

        const bodyBoundaries: DOMRect = tr.getMeta('bodyBoundaries')

        const posAtBodyEnd: any = tr.getMeta('posAtBodyEnd')

        const cellInOffset: SplitInfo = tr.getMeta('cellInOffset')

        const pasting: boolean = tr.getMeta('paste')

        const deleting: boolean = tr.getMeta('deleting')

        const pagesMeta: Array<AttributeSpec> = tr.getMeta('pagesMeta')

        let next: PluginState = { ...prev }

        if (bodyDimenssion) {
          next.bodyHeight = bodyDimenssion.bodyHeight
          next.bodyWidth = bodyDimenssion.bodyWidth
        }

        if (bodyBoundaries) next.bodyBoundaries = bodyBoundaries

        if (posAtBodyEnd) next.posAtBodyEnd = posAtBodyEnd

        if (pagesMeta) next.pagesMeta = pagesMeta

        if (!posAtBodyEnd || !bodyDimenssion || !bodyBoundaries)
          next = { ...next, bodyHeight: null, bodyWidth: null, bodyBoundaries: null, posAtBodyEnd: null }

        if (cellInOffset) next.cellInOffset = cellInOffset

        if (pasting) next.pasting = pasting

        next.deleting = deleting ? deleting : false

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

          let deleting = false

          if (selection.$anchor.node(2) && prevState.selection.$anchor.node(2))
            deleting = tr.doc.nodeSize < prevState.doc.nodeSize

          const inserting = isOverflown(pageBody)

          if (inserting || deleting) {
            const bodyBoundaries = pageBody.getBoundingClientRect()

            const posAtBodyEnd = view.posAtCoords({ left: bodyBoundaries.left, top: bodyBoundaries.bottom })

            const pagesMeta = []

            tr.doc.forEach(node => {
              pagesMeta.push(node.attrs)
            })

            if (deleting) tr.setMeta('deleting', true)

            view.dispatch(
              tr
                .setMeta('splitPage', { bodyHeight: pageBody.clientHeight, bodyWidth: pageBody.clientWidth })
                .setMeta('bodyBoundaries', bodyBoundaries)
                .setMeta('posAtBodyEnd', posAtBodyEnd)
                .setMeta('pagesMeta', pagesMeta)
            )
          }
        },
      }
    },
    appendTransaction([newTr], _prevState, state) {
      let { schema, tr } = state

      const { bodyHeight, pasting, deleting } = this.getState(state)

      const splitCommand = newTr.getMeta('splitCommand')

      // const isPointer = newTr.getMeta('pointer')

      let prevSelectionPos: number | null

      if (!bodyHeight || splitCommand) return

      if (
        state.selection.$head.node(1) === state.doc.lastChild &&
        state.selection.$head.node(2).lastChild === state.selection.$head.node(3) &&
        !pasting &&
        !deleting
        // state.selection.$head.node(3).type !== schema.nodes[TABLE]
      ) {
        //
        // If carret is on the last element of the page directlty split page skil else
        //

        if (tr.selection.$head.parentOffset === 0) {
          tr = tr.step(new ReplaceStep(tr.selection.head - 2, tr.selection.head, Slice.empty))
          return splitPage(tr, tr.selection.head, tr.selection.$head.depth, null, schema)
        }
        return splitPage(tr, tr.selection.head - 1, tr.selection.$head.depth, null, schema).scrollIntoView()
      }

      prevSelectionPos = state.selection.head

      tr = removeHeadersAndFooters(tr, schema)

      tr = joinDocument(tr)

      tr = addHeadersAndFooters(tr, schema)

      tr = splitDocument(tr, state)

      tr = skipFooterHeaderInSelection(tr, schema, prevSelectionPos, deleting)

      return tr.scrollIntoView()
    },
  } as PluginSpec)
}

function skipFooterHeaderInSelection(
  tr: Transaction,
  schema: Schema,
  prevSelectionPos: number,
  deleting: boolean
): Transaction {
  //
  // This prevents skiping the last selection on page before split
  //

  const newTr = setTextSelection(prevSelectionPos)(tr)

  if (newTr.selection.$head.node(2).type !== schema.nodes[BODY] && !deleting) {
    return skipFooterHeaderInSelection(newTr, schema, prevSelectionPos + 1, deleting)
  }

  if (newTr.selection.$head.node(2).type !== schema.nodes[BODY] && deleting) {
    return skipFooterHeaderInSelection(newTr, schema, prevSelectionPos - 1, deleting)
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

  const { pagesMeta } = key.getState(state)

  const splitInfo: SplitInfo = getNodeHeight(tr.doc, state)

  const nextPageModel = state.schema.nodes[PAGE].create(pagesMeta[tr.doc.childCount])

  if (!splitInfo) return tr

  let newTr = splitPage(tr, splitInfo.pos - 1, splitInfo.depth, [nextPageModel], state.schema)

  if (splitInfo.depth !== 6) newTr = removePararaphAtStart(newTr, schema)

  if (splitInfo.depth === 3 && splitInfo.cellStart !== null) {
    newTr = joinTables(newTr, splitInfo, schema, state)
  }

  if (splitInfo.depth === 6) {
    newTr = removeLastRowFromSplit(tr, schema, splitInfo)
    newTr = joinTables(newTr, splitInfo, schema, state)
  }

  if (getNodeHeight(newTr.doc, state)) {
    return splitDocument(newTr, state)
  }

  return newTr
}

function getNodeHeight(doc: Node, state: EditorState): SplitInfo | null {
  //
  // This function measurs rest of the node and returns postiotns and depth wheret to split
  //

  const { schema } = state

  const { lastChild } = doc

  const { bodyHeight, deleting } = key.getState(state)

  let accumolatedHeight: number = 2

  let pageBoundary = null

  doc.descendants((node, pos) => {
    if (accumolatedHeight > bodyHeight) {
      return false
    }

    if (node.type === schema.nodes[PAGE] && node !== lastChild) {
      return false
    }

    if (node.type === schema.nodes[HEADER]) return false

    if (node.type === schema.nodes[FOOTER]) return false

    if (node.type === schema.nodes[PAGE_COUNTER]) return false

    if (node.type === schema.nodes[PARAGRAPH]) {
      const pHeight = getParagraphHeight(node)
      accumolatedHeight += pHeight

      if (accumolatedHeight > bodyHeight) {
        pageBoundary = {
          pos,
          height: accumolatedHeight,
          depth: PARAGRAPH_DEPTH,
          offsetInCell: null,
          cellStart: null,
        }

        return false
      }
    }

    if (node.type === schema.nodes[TABLE]) {
      const tableMap = TableMap.get(node)

      const highestAtIndex = findHighestColumn(tableMap, node, pos)

      const cellsInColumn: MappedCell[] = getCellsInColumn(highestAtIndex.index, node, tableMap, pos)

      for (let i = 0; i < cellsInColumn.length; i++) {
        //
        // loops all cells in column
        //

        if (accumolatedHeight > bodyHeight) break

        //
        // Adds cell paddings
        //
        accumolatedHeight += 7

        const { start, node: cellNode } = cellsInColumn[i]

        cellNode.forEach((innerNode, offset) => {
          //
          // loops into cells content
          //

          if (accumolatedHeight > bodyHeight) return

          if (innerNode.type === schema.nodes[PARAGRAPH]) {
            const pHeight = getParagraphHeight(innerNode)

            accumolatedHeight += pHeight

            if (accumolatedHeight > bodyHeight) {
              //
              // if only one row is left spliting is done right before the table not before the tr
              //

              //TODO: Fix this logic

              const isFirstRow =
                doc.resolve(start).node(3).lastChild === doc.resolve(start).parent && tableMap.height > 1

              pageBoundary = {
                pos:
                  isFirstRow && !deleting ? start - doc.resolve(start).parentOffset - 3 : doc.resolve(start).before(3),
                height: accumolatedHeight,
                depth: isFirstRow && !deleting ? TABLE_DEPTH : PARAGRAPH_DEPTH,
                offsetInCell: offset,
                cellStart: start,
              }
            }
          }
        })
      }

      return false
    }
  })

  return pageBoundary ? pageBoundary : null
}

function removeLastRowFromSplit(tr: Transaction, _schema: Schema, splitInfo: SplitInfo): Transaction {
  const { doc } = tr

  const mappedPos = tr.mapping.map(splitInfo.pos)

  const resolvedPos = doc.resolve(mappedPos)

  const rowPos = resolvedPos.before(4)

  tr = tr.step(new ReplaceStep(rowPos, rowPos + doc.nodeAt(rowPos).nodeSize, Slice.empty))

  return tr
}

// function removeParagraphAtTable(tr: Transaction, _schema: Schema, splitInfo: SplitInfo): Transaction {
//   const { doc } = tr

//   // const mappedPos = tr.mapping.map(splitInfo.pos)

//   // const emptyParagraph = doc.resolve(mappedPos - 1).node(6)

//   // tr = tr.delete(mappedPos - 1, mappedPos - 1 + emptyParagraph.nodeSize)

//   const tableResolvedPos = doc.resolve(splitInfo.pos - 3)

//   const tableMap = TableMap.get(doc.nodeAt(tableResolvedPos.before(3)))

//   if (tableMap.height === 1) {
//     const tablePos = tableResolvedPos.before(3)

//     tr = tr.step(new ReplaceStep(tablePos, tablePos + doc.nodeAt(tablePos).nodeSize, Slice.empty))
//   } else {
//     const tableRowPos = doc.resolve(splitInfo.pos - 3).before(4)

//     tr = tr.step(new ReplaceStep(tableRowPos, tableRowPos + doc.nodeAt(tableRowPos).nodeSize, Slice.empty))
//   }

//   return tr
// }

function joinTables(tr: Transaction, splitInfo: SplitInfo, schema: Schema, _state: EditorState) {
  //
  // when splitInfo.depth === 3 we are spliting the first remaining row so its done before the whole table
  //

  const { doc } = tr

  const mappedPos = splitInfo.depth === 3 ? tr.mapping.map(splitInfo.cellStart - 3) : tr.mapping.map(splitInfo.pos)

  const resolvedPos = doc.resolve(mappedPos)

  const isTable = splitInfo.depth === 3 ? doc.nodeAt(mappedPos) : resolvedPos.node(3)

  const isNextTable =
    splitInfo.depth === 3 ? doc.nodeAt(doc.resolve(mappedPos + 1).after(3)) : doc.nodeAt(resolvedPos.after(3))

  if (!isNextTable || !isTable) return tr

  if (isNextTable.type === schema.nodes[TABLE] && isTable.type === schema.nodes[TABLE] && splitInfo.depth !== 3) {
    tr = tr.step(new ReplaceStep(resolvedPos.after(3) - 1, resolvedPos.after(3) + 1, Slice.empty))
  }

  if (isNextTable.type === schema.nodes[TABLE] && isTable.type === schema.nodes[TABLE] && splitInfo.depth === 3) {
    tr = tr.step(
      new ReplaceStep(doc.resolve(mappedPos + 1).after(3) - 1, doc.resolve(mappedPos + 1).after(3) + 1, Slice.empty)
    )
  }

  return tr
}

function removePararaphAtStart(tr: Transaction, schema: Schema): Transaction {
  //
  // Removes fist paragraph inserted by split
  //

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

function getParagraphHeight(node: Node): number {
  let parsedPoints: number = 15

  const paragraphDOM = document.getElementById(node.attrs.id)

  if (paragraphDOM) return paragraphDOM.getBoundingClientRect().height

  return parsedPoints + node.attrs.paddingTop + node.attrs.paddingBottom

  // let parsedPoints: number = 15
  // const parentWidth = tableMap ? bodyWidth / tableMap.width - 10 : bodyWidth
  // let bufferWidth = 0
  // let row: number = 0
  // const content = getFontMarks(node, schema.marks[MARK_FONT_SIZE])
  // const paragraphStructure: Array<Array<ParagraphContent>> = []
  // if (isNullOrUndefined(content)) {
  //   return parsedPoints + node.attrs.paddingTop + node.attrs.paddingBottom
  // }
  // if (content.length === 1 && content[0].textContent.length > 0) {
  //   //
  //   //  Measures multiline paragraph heigt when is with the same font size
  //   //
  //   const textWidth = getTextWidth(content[0].textContent, `${content[0].fontSizePt}pt arial`)
  //   const rows: number = Math.ceil(textWidth / parentWidth)
  //   const parsedPoints = ptToPx(content[0].fontSizePt)
  //   const heightToUse = parsedPoints > 15 ? parsedPoints : 15
  //   return rows * heightToUse + node.attrs.paddingBottom + node.attrs.paddingTop
  // }
  // //
  // //  Measuser multiline paragraph heigt when is with the same font size
  // //
  // for (let i = 0; content.length > i; i++) {
  //   const textWidth = getTextWidth(content[i].textContent, `${content[i].fontSizePt}pt arial`)
  //   bufferWidth += textWidth
  //   while (bufferWidth > parentWidth) {
  //     isNullOrUndefined(paragraphStructure[row])
  //       ? paragraphStructure.push([content[i]])
  //       : paragraphStructure[row].push(content[i])
  //     bufferWidth = bufferWidth - parentWidth
  //     row++
  //   }
  //   isNullOrUndefined(paragraphStructure[row])
  //     ? paragraphStructure.push([content[i]])
  //     : paragraphStructure[row].push(content[i])
  // }
  // const max = (a, b) => Math.max(a, b)
  // const prop = p => o => o[p]
  // const getFontSize = prop('fontSizePt')
  // const mapped = paragraphStructure.map(row => row.map(getFontSize).reduce(max, 0))
  // return (
  //   mapped.reduce((fontPt: number, acc: number) => ptToPx(fontPt) + acc, 0) +
  //   node.attrs.paddingBottom +
  //   node.attrs.paddingTop
  // )
}

// function getFontMarks(node: Node, markType: MarkType): ParagraphContent[] {
//   if (!node.firstChild) return null

//   let content: ParagraphContent[] = []

//   node.forEach((child: Node) => {
//     const [fontSizeMark] = child.marks.filter((m: Mark) => m.type === markType)

//     content.push({
//       size: child.nodeSize,
//       fontSizePt: fontSizeMark ? fontSizeMark.attrs.pt : 11.25,
//       textContent: child.textContent,
//     })
//   })

//   return content
// }

// function getTextWidth(text: string, font: string) {
//   const canvas = document.createElement('canvas')
//   const context = canvas.getContext('2d')
//   context.font = font
//   const metrics = context.measureText(text)
//   return metrics.width
// }

function getCellsInColumn(columnIndex: number, table: Node, tableMap: TableMap, tablePos: number) {
  const indexes: number[] = Array.isArray(columnIndex) ? columnIndex : Array.from([columnIndex])

  const cells: MappedCell[] = indexes.reduce((acc, index) => {
    if (index >= 0 && index <= tableMap.width - 1) {
      const cells = tableMap.cellsInRect({
        left: index,
        right: index + 1,
        top: 0,
        bottom: tableMap.height,
      })

      return acc.concat(
        cells.map(nodePos => {
          const node = table.nodeAt(nodePos)
          const pos = nodePos + tablePos
          return { pos, start: pos + 1, node }
        })
      )
    }
  }, [])

  return cells
}

function findHighestColumn(tableMap: TableMap, node: Node, pos: number): { size: number; index: number } {
  // { size: child ccount of the cell, index: at row index }

  let currHighestAt = {
    size: 0,
    index: 0,
  }

  for (let i = 0; i < tableMap.width; i++) {
    const currColumn: MappedCell[] = getCellsInColumn(i, node, tableMap, pos)

    let columnHeight = 0

    for (const cell of currColumn) {
      cell.node.descendants(node => {
        if (node.type.name === PARAGRAPH) {
          columnHeight += getParagraphHeight(node)
        }
      })
      columnHeight += 8
    }

    if (currHighestAt.size < columnHeight) {
      currHighestAt = { size: columnHeight, index: i }
    }
  }

  return currHighestAt
}

const isOverflown = ({ clientWidth, clientHeight, scrollWidth, scrollHeight }) => {
  return scrollHeight > clientHeight || scrollWidth > clientWidth
}
