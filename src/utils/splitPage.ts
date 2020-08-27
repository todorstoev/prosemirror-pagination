import { Fragment, Slice, Schema, Node } from 'prosemirror-model'
import { ReplaceStep } from 'prosemirror-transform'
import { Transaction } from 'prosemirror-state'
import { HEADER, BODY, FOOTER, PAGE_COUNTER, PARAGRAPH, END, START, TABLE } from '../specs/nodeNames'
import { isNullOrUndefined } from './index'

export const splitPage = (tr: Transaction, pos, depth = 1, typesAfter: Array<Node>, schema?: Schema) => {
  const paragraph = schema.nodes[PARAGRAPH].create()
  const end = schema.nodes[END].create()
  const start = schema.nodes[START].create()

  let emptyParBeforeTable = false

  const header = sessionStorage.getItem('header')
    ? Node.fromJSON(schema, JSON.parse(sessionStorage.getItem('header')))
    : schema.nodes[HEADER].createAndFill(Fragment.from(paragraph))

  const footer = sessionStorage.getItem('footer')
    ? Node.fromJSON(schema, JSON.parse(sessionStorage.getItem('footer')))
    : schema.nodes[FOOTER].createAndFill(Fragment.from(paragraph))

  const counter = schema.nodes[PAGE_COUNTER].create()

  if (tr.doc.resolve(pos).node(3) && tr.doc.resolve(pos).node(3).type === schema.nodes[TABLE] && depth === 3) {
    //
    // Handle split before TABLE
    //

    pos -= 1
    depth = 4
    emptyParBeforeTable = true
  }

  let $pos = tr.doc.resolve(pos),
    before = Fragment.empty,
    after = Fragment.empty

  for (let d = $pos.depth, e = $pos.depth - depth, i = depth - 1; d > e; d--, i--) {
    before = Fragment.from(
      $pos.node(d).type.name === BODY ? [$pos.node(d).copy(before), footer, end, counter] : $pos.node(d).copy(before)
    )

    let typeAfterN

    if (!isNullOrUndefined(typesAfter) && typesAfter[i]) {
      typeAfterN = typesAfter[i]
    } else {
      typeAfterN = typesAfter && typesAfter[i] && $pos.node(d)
    }

    after = Fragment.from(
      typeAfterN
        ? typeAfterN.type.createAndFill(typeAfterN.attrs, after)
        : $pos.node(d).type.name === BODY
        ? [start, header, $pos.node(d).copy(after)]
        : $pos.node(d).copy(after)
    )
  }

  tr = tr.step(new ReplaceStep(pos, pos, new Slice(before.append(after), depth, depth)))

  if (emptyParBeforeTable && depth === 3) {
    //
    // Remove empty before TABLE
    //
    const mappedPos = tr.mapping.map(pos)
    tr = tr.deleteRange(mappedPos, mappedPos)
  }

  return tr.scrollIntoView()
}

// const findCutBefore = $pos => {
//   if (!$pos.parent.type.spec.isolating)
//     for (let i = $pos.depth - 1; i >= 0; i--) {
//       if ($pos.index(i) > 0) return $pos.doc.resolve($pos.before(i + 1))
//       if ($pos.node(i).type.spec.isolating) break
//     }
//   return null
// }
