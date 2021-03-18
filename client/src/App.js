import React, { Component } from "react";

export class App extends Component {
  render() {
    return (
      <div
        onClick={() =>
          fetch("session")
            .then(res => res.json())
            .then(res => console.log(res))
            .catch(e => console.log(e))
        }
      >
        hello
      </div>
    );
  }
}

export default App;
