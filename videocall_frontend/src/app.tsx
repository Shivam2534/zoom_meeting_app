// import "./App.css";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import { Sender } from "./Components/Sender";
import { Receiver } from "./Components/Receiver";
import { WelcomeComponent } from "./Components/WelcomeComponent";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomeComponent />} />
        <Route path="/sender" element={<Sender />} />
        <Route path="/receiver" element={<Receiver />} />
      </Routes>
    </BrowserRouter>
  );
}

export { App };
