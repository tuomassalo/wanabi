import React from 'react'
// import logo from './logo.svg';
import './App.css'
import {Game} from 'wanabi-engine'

const App: React.FC = () => {
  const g = new Game({playerNames: ['foo', 'bar']})
  return (
    <div className="App">
      <header className="App-header">
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        <p>
          x{JSON.stringify(g.toJSON())}
        </p>
      </header>
    </div>
  )
}

export default App
