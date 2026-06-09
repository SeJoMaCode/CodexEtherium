import { BrowserRouter, Routes, Route } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import SyntaxPage from "./pages/SyntaxPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/syntax" element={<SyntaxPage />} />
      </Routes>
    </BrowserRouter>
  );
}
