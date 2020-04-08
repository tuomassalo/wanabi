// when the user is in a game, these are saved to sessionStorage. In case of a reload, the player will auto-rejoin.
interface RejoinParams {
  gameId: string
  playerIdx: number
}

export function setRejoinParams(rejoinParams: RejoinParams | undefined) {
  if (rejoinParams) {
    sessionStorage.setItem('rejoinParams', JSON.stringify(rejoinParams))
  } else {
    sessionStorage.removeItem('rejoinParams')
    document.location.reload()
  }
}

export function getRejoinParams(): RejoinParams | undefined {
  return sessionStorage.getItem('rejoinParams')
    ? JSON.parse(sessionStorage.getItem('rejoinParams') as string)
    : undefined
}
