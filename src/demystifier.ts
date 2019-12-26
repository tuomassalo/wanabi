import {TPlayerState} from './player'
import {TCardState, THandCardState, Card, TPossibleCardState} from './card'

function hintsMatch(handCard: THandCardState, card: Card) {
  return !handCard.hints.some(h => (h.result ? !card.is(h.is) : card.is(h.is)))
}

export function demystify(me: TPlayerState, revealedCards: TCardState[]) {
  if (me.name !== 'Louise') return

  const unrevealedCards = Card.getFullDeck()
  for (const r of revealedCards) {
    unrevealedCards.splice(
      unrevealedCards.findIndex(u => u.is(r)),
      1,
    )
  }

  console.warn(111, revealedCards.length, unrevealedCards.length)

  for (const handCard of me.hand) {
    const possibleCards: Card[] = unrevealedCards.filter(u => hintsMatch(handCard, u))
    console.warn(222, possibleCards)

    if (possibleCards.length <= 10) {
      // aggregate
      const possibleCardCounts: {card: Card; count: number}[] = []
      for (const pc of possibleCards) {
        const pcc = possibleCardCounts.find(c => c.card.is(pc))
        if (pcc) {
          pcc.count++
        } else {
          possibleCardCounts.push({card: pc, count: 1})
        }
      }
      handCard.possibleCards = possibleCardCounts.map(pcc => ({
        color: pcc.card.color,
        num: pcc.card.num,
        weight: pcc.count, // / possibleCards.length,
      }))
    }
  }
}
