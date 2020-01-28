export function promptPlayerName() {
  const playerName = prompt('Your Name', window.localStorage.getItem('playerName') || '')
  if (!(playerName && /\w/.test(playerName))) return undefined

  window.localStorage.setItem('playerName', playerName)
  return playerName
}
