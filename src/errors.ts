class WanabiError extends Error {
  constructor(message?: string, log?: any) {
    console.warn(log)
    super(message)
    this.name = 'WanabiError: ' + JSON.stringify(log)
  }
}

export class SyntaxError extends WanabiError {}

// wrong turn, no such card, etc.
export class GameError extends WanabiError {}
