import { BrowserRouter, Route, Routes } from "react-router-dom";
import { InboxPage } from "@/pages/inbox";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InboxPage />} />
      </Routes>
    </BrowserRouter>
  );
}
