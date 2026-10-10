import React from "react";
import { Routes , Route } from "react-router";
import Login from "./Components/Users/Login/Login";
import Register from "./Components/Users/Register/Register";

const App = () => {
  return <>
    <Routes>
      <Route path="/" element={<Login/>}/>
      <Route path="/register"  element={<Register/>}/>
    </Routes>
  </>;
};

export default App;
