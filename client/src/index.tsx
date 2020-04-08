// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'
import ReactDOM from 'react-dom'
import './index.scss'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {App} from './App'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {Wsclient} from './Wsclient'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Store from './Store'

ReactDOM.render(
  <Store>
    <App />
    <Wsclient />
  </Store>,
  document.getElementById('root'),
)
