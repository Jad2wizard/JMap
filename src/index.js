/**
 * Created by yaojia7 on 2018/9/14.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, Redirect, browserHistory} from 'react-router';
import Map from './Map';

const routers = (
    <Route>
        <Route path="/map" component={Map}/>
        <Redirect from="*" to="/map"/>
    </Route>
);

const Routers = () => (
    <Router history={browserHistory}>
        {routers}
    </Router>
);

ReactDOM.render(
    <Routers/>,
    document.getElementById('main')
);
