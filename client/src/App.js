import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import Home from "./containers/home";
import "./App.css";
import Navbar from "./components/Navbar";
// import Landing from "./components/Landing";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import PrivateRoute from "./components/private-route/PrivateRoute";
import { Provider } from "react-redux";
import store from "./store";


library.add(fas, fab);

class App extends Component {
  componentDidMount() {
    // store.dispatch(loadUser());
  }

  render() {
    return (
      <Provider store={store}>
        <Router>
          <div className="App">
            <Navbar />
            <Route exact path="/" component={Home} />
            <Route exact path="/register" component={Register} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/api/pinterest" />
            {/* <Route exact path="/home" component={Home} /> */}
            <Switch>
              <PrivateRoute exact path="/home" component={Home} />
            </Switch>
          </div>
        </Router>
      </Provider>
    );
  }
}

export default App;
