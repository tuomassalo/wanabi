import {
  Card,
  MaskedCard,
  TPossibleCardState,
  PossibleCard,
  TCardValueState,
  TActionability,
  NumDistribution,
} from './card'
import {sum, range} from 'lodash'
import {Table} from './table'
import {Pile} from './pile'

export function resolveActionability(
  myHand: MaskedCard[],
  revealedCards: Card[],
  table: Table,
  discardPile: Pile,
): MaskedCard[] {
  // make a copy to prevent modifying the argument
  myHand = myHand.map(mc => new MaskedCard(mc.toJSON()))

  function resolveOne(value: TCardValueState): TActionability {
    const card = new Card(value)
    if (table.isPlayable(card)) return 'PLAYABLE'

    if (table.has(card)) return 'DISCARDABLE'
    else {
      // Maybe the card can never be played because lower cards have been discarded.
      if (
        range(1, card.num).some(
          num =>
            discardPile.cards.filter(c => c.color === card.color && c.num === num).length ===
            NumDistribution.filter(n => n === num).length,
        )
      )
        return 'DISCARDABLE'

      // The card has not been played yet. Maybe the card is unique, thus not discardable.
      if (
        discardPile.cards.filter(c => c.equals(card)).length ===
        NumDistribution.filter(n => n === card.num).length - 1
      )
        return 'UNDISCARDABLE'
    }

    // cannot be played yet, but is not discardable.
    return 'UNPLAYABLE'
  }

  // const unrevealedCards = Card.getFullDeck()
  // for (const r of revealedCards) {
  //   unrevealedCards.splice(
  //     unrevealedCards.findIndex(u => u.equals(r)),
  //     1,
  //   )
  // }

  for (const mc of myHand) {
    if (mc.value) {
      // We know this card, so let's resolve the actionability.
      mc.actionability = resolveOne(mc.value)
    } else if (mc.possibleCards) {
      // We have some ideas what the card could be. Resolve actionability of each possible card.
      for (const pc of mc.possibleCards) {
        pc.actionability = resolveOne(pc.value)
      }

      // If all possible cards have the same actionability, report it as
      // the actionability of the card itself and not of the possibleCards.
      if (mc.possibleCards.every(pc => pc.actionability === (mc.possibleCards as PossibleCard[])[0].actionability)) {
        mc.actionability = mc.possibleCards[0].actionability
        mc.possibleCards.forEach(pc => delete pc.actionability)
      }
    }
  }

  return myHand
}
