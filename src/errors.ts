class GameError extends Error {
  constructor(message?: string, log?: any) {
    console.warn(log)
    super(message)
    this.name = 'GameError: ' + JSON.stringify(log)
  }
}

export class SyntaxError extends GameError {}

// wrong turn, no such card, etc.
export class ParamError extends GameError {}
