import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ResearchLab from "./pages/ResearchLab";
import ModelLab from "./pages/ModelLab";
import EvaluationBoard from "./pages/EvaluationBoard";
import NavBar from "./components/NavBar";

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <div className="pt-14">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/research-lab" element={<ResearchLab />} />
          <Route path="/model-lab" element={<ModelLab />} />
          <Route path="/evaluation-board" element={<EvaluationBoard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
export default App;