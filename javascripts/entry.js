require('../less/main.less');

'use strict';

import React from "react";

require('remote');
var model = remote.require('./model.js');

var ed = "Edward";

React.render(<div className="myDiv">Hello {ed}!</div>, document.getElementById('content'));

model.sources().then(function(s) {
  console.log("Sources:", s);
});
