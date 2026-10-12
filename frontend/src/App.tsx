import { Route, Routes } from "react-router";
import Login from "./Components/Users/Login/Login";
import Register from "./Components/Users/Register/Register";
import Dashboard from "./Components/Todos/Dashboard";
import ProtectedRoute from "./Components/Protected";
import AuthInitializer from "./Components/AuthInitializer"

const App = () => {
  return (
    <AuthInitializer>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </AuthInitializer>
  );
};

export default App;
