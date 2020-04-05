export function getPlayerName() {
  return window.localStorage.getItem('playerName')
}

export function promptPlayerName() {
  const playerName = prompt('Your Name', getPlayerName() || '')
  if (!(playerName && /\w/.test(playerName))) return undefined

  window.localStorage.setItem('playerName', playerName)
  return playerName
}
