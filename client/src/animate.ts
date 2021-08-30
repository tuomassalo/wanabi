import * as engine from 'wanabi-engine'
import {TColor, Card} from 'wanabi-engine/dist/card'
import {sample, random} from 'lodash'

async function animateFullScore() {
  for (const card of Array.from(document.querySelectorAll('.WTable .WPile .WCard')).reverse()) {
    const cardBounds = card.getBoundingClientRect()
    const xSpeed = (sample([-1, 1]) as number) * random(3, 9, true)
    let ySpeed = random(-6, 0, true)

    let x = cardBounds.left
    let y = cardBounds.top

    while (x < window.innerWidth + 10 && x > -cardBounds.width - 10) {
      const clone = card.cloneNode(true) as HTMLDivElement
      clone.style.position = 'absolute'
      clone.style.left = x + 'px'
      clone.style.top = y + 'px'
      clone.style.boxShadow = 'none'
      clone.style.zIndex = '3'

      document.body.appendChild(clone)

      x += xSpeed
      y += ySpeed

      if (y >= window.innerHeight - cardBounds.height) {
        // bounce
        ySpeed *= -0.8
        y = window.innerHeight - cardBounds.height
      } else {
        ySpeed += 0.5 // acceleration
      }
      await new Promise(r => setTimeout(r, 1))
    }
  }
}

export async function animate(action: engine.TResolvedActionState, playerIdx: number, isFullScore: boolean) {
  // only animate plays and discards
  if (!(action.type === 'PLAY' || action.type === 'DISCARD')) return

  const playedCard = new Card(action.card)

  const waitForAnimation = async (elem: HTMLElement) => {
    await new Promise(r => {
      elem.addEventListener('animationend', r, {once: true})
    })
  }

  const createGhost = async (cardIdx: number) => {
    const orig = document.querySelector(
      `#card-${playerIdx}-${cardIdx} > .WCard, #card-${playerIdx}-${cardIdx} > .WMysteryCard`,
    ) as HTMLDivElement
    const ghostBounds = orig.getBoundingClientRect()

    const ghostCard = orig.cloneNode(true) as HTMLDivElement
    const ghost = document.createElement('div')
    ghost.appendChild(ghostCard)
    document.body.appendChild(ghost)
    orig.style.visibility = 'hidden'

    ghost.style.width = ghostBounds.width + 'px'
    ghost.style.height = ghostBounds.height + 'px'
    ghost.style.left = ghostBounds.left + document.documentElement.scrollLeft + 'px'
    ghost.style.top = ghostBounds.top + document.documentElement.scrollTop + 'px'

    // if the card is not known yet, "flip" the clone first
    if (1 && !(orig.classList.contains('WColor-' + playedCard.color) && orig.textContent === '' + playedCard.num)) {
      // const ghost = ghost.querySelector('.WCard') as HTMLElement
      // first part of the flip
      ghost.classList.add('WCard-flip-1')

      await waitForAnimation(ghostCard)
      ghost.classList.remove('WCard-flip-1')

      // Now the ghost has been flipped 90 degrees, so it's invisible. Add information.
      ghostCard.className = `WCard WColor-${playedCard.color}`
      ghostCard.textContent = '' + playedCard.num

      ghostCard.classList.add('WCard')
      ghostCard.classList.add('WColor-' + playedCard.color)
      ghostCard.textContent = '' + playedCard.num

      // second part of the flip
      ghost.classList.add('WCard-flip-2')
      await waitForAnimation(ghostCard)
      ghost.classList.remove('WCard-flip-2')
    }

    return {orig, ghost, ghostBounds}
  }

  const findNextDiscardBounds = () => {
    const tmp = document.createElement('div')
    tmp.className = 'WCard'
    tmp.textContent = '0'
    const pile = document.querySelector('.WDiscardPile') as Element
    pile.appendChild(tmp)
    const b = tmp.getBoundingClientRect()
    tmp.remove()
    return b
  }

  const findTablePileBounds = (color: TColor) => {
    const pileEl = document.querySelector(`.WTable > .WPile-${color} > div:last-child`) as HTMLElement
    const rect = pileEl.getBoundingClientRect()
    return {width: rect.width, left: rect.left, top: rect.top + 3} // +3px, see `.WCard:nth-of-type` css rules
  }

  // move to table or discard pile
  const dstBounds =
    action.type === 'PLAY' && action.success ? findTablePileBounds(playedCard.color) : findNextDiscardBounds()
  const {orig, ghost, ghostBounds} = await createGhost(action.cardIdx)

  document.documentElement.style.setProperty('--movecardScaleEnd', `${dstBounds.width / ghostBounds.width}`)
  document.documentElement.style.setProperty('--movecardTranslateXEnd', `${dstBounds.left - ghostBounds.left}px`)
  document.documentElement.style.setProperty('--movecardTranslateYEnd', `${dstBounds.top - ghostBounds.top}px`)
  document.documentElement.style.setProperty(
    '--movecardRotateEnd',
    action.type === 'PLAY' && !action.success ? '1080deg' : '0deg',
  )
  ghost.classList.add('WCard-ghost')

  // this is needed, otherwise animationend triggers immediately.
  await new Promise(r => setTimeout(r, 1))

  await waitForAnimation(ghost)

  // Old card has been moved now.

  const cardElems = [0, 1, 2, 3, 4]
    .map(idx => document.getElementById(`card-${playerIdx}-${idx}`))
    .filter(el => el) as HTMLElement[]
  const movingCards = cardElems.filter((el, idx) => idx > action.cardIdx)
  if (movingCards.length) {
    const cardDstOffsetXEnd = cardElems[0].getBoundingClientRect().left - cardElems[1].getBoundingClientRect().left
    document.documentElement.style.setProperty('--cardDstOffsetXEnd', `${cardDstOffsetXEnd}px`)
    for (const c of movingCards) {
      c.classList.add('WCard-slide-left')
    }
    await waitForAnimation(movingCards[0])
  }

  // cleanup
  ghost.remove()
  orig.style.visibility = 'visible'
  for (const c of movingCards) {
    c.classList.remove('WCard-slide-left')
  }

  if (isFullScore) {
    await animateFullScore()
  }
}

;(window as any).a = animateFullScore
