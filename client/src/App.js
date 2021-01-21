import react, { Fragment } from 'react'
import './App.css'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import Navbar from './Components/Layouts/Navbar'
import Landing from './Components/Layouts/Landing'
import Login from './Components/auth/Login'
import Register from './Components/auth/Register'

const App = () => (
  <Router>
    <Fragment>
      <Navbar />
      <Route exact path='/' component={Landing} />
      <section className='container'>
        <Switch>
          <Route exact path='/login' component={Login} />
          <Route exact path='/register' component={Register} />
        </Switch>
      </section>
    </Fragment>
  </Router>
)

export default App
