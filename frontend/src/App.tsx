import { BrowserRouter, Routes, Route } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import SyntaxPage from "./pages/SyntaxPage";
import BuilderPage from "./pages/BuilderPage";
import CardPage from "./pages/CardPage";
import CardDropZone from "./components/CardDropZone";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/syntax" element={<SyntaxPage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/card/:uuid" element={<CardPage />} />
      </Routes>
      <CardDropZone />
    </BrowserRouter>
  );
}
