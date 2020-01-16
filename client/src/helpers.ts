export function promptPlayerName() {
  const playerName = prompt('Your Name', window.localStorage.getItem('playerName') || '')
  if (!(playerName && /\w/.test(playerName))) throw new Error('No name, not starting.')

  window.localStorage.setItem('playerName', playerName)
  return playerName
}
