// import "./App.css";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import { Sender } from "./ourComponents/Sender";
import { Receiver } from "./ourComponents/Receiver";
import { WelcomeComponent } from "./ourComponents/WelcomeComponent";

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
