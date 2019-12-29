import {TPlayerState} from './player'
import {TCardState, THandCardState, Card, TPossibleCardState} from './card'

export function demystify(me: TPlayerState, revealedCards: TCardState[]) {
  const unrevealedCards = Card.getFullDeck()
  for (const r of revealedCards) {
    unrevealedCards.splice(
      unrevealedCards.findIndex(u => u.is(r)),
      1,
    )
  }

  for (const handCard of me.hand) {
    const possibleCards: Card[] = unrevealedCards.filter(u => u.matchesHints(handCard.hints))

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
        weight: pcc.count,
      }))
    }
    // return
  }
}
