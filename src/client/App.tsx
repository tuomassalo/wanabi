import React from 'react'
// import logo from './logo.svg'
import './App.css'
import TestComponent from './TestComponent'
import {WebSocketClient} from './websocketclient'

//   try {
//   const response = await fetch('./data.json');
//   const { ServiceEndpointWebsocket } = await response.json();
//   this.endpoint = ServiceEndpointWebsocket;
//   } catch(e) {
//     this.endpoint = 'ws://localhost:3001'
//   }
// }
export default class App extends React.Component<{}, {messages: string[]}> {
  wsclient: WebSocketClient

  constructor(props) {
    super(props)
    const endpoint = 'ws://localhost:3001'
    this.wsclient = new WebSocketClient(endpoint)
    this.state = {messages: []}
    this.wsclient.on('msg', (...args) =>
      this.setState(state => ({
        messages: [...state.messages, JSON.stringify(args)],
      })),
    )
  }
  connect = () => {
    this.wsclient.connect()
  }
  send = () => {
    this.wsclient.send()
  }
  render() {
    return (
      <div className="App">
        <header className="App-header">
          {/* <img src={logo} className="App-logo" alt="logo" /> */}
          <input type="button" onClick={this.connect} value="connect" />
          <input type="button" onClick={this.send} value="send" />
          <ul>
            {this.state.messages.map(msg => (
              <li>MSG: {msg}</li>
            ))}
          </ul>
          <TestComponent name="Foobar" foo="123" num={123} />
        </header>
      </div>
    )
  }
}
