import React, { Component } from 'react'
import { Row, Col } from 'antd'
import { Route, Redirect } from 'react-router-dom'
// import { Provider } from 'react-redux'
import { IntlProvider } from 'react-intl'
import i18n from '@/common/i18n'
// import { store } from './store'
import Navi from './navi'
import Routes from './routes'
import zhLocal from './locales/zh'
import enLocal from './locales/en'
import './app.scss'

const locale = i18n.lang === 'zh' ? zhLocal : enLocal

export default class App extends Component {
  render () {
    return (
      // <Provider store={store}>
        <IntlProvider locale={i18n.lang} messages={locale}>
          <div className="app">
            <Row>
              <Col span={4}>
                <Navi />
              </Col>
              <Col span={20}>
                <Route
                  exact
                  strict
                  path="/"
                  render={() => <Redirect exact strict to="/requests" />}
                />
                <Routes />
              </Col>
            </Row>
          </div>
        </IntlProvider>
      // </Provider>
    )
  }
}
