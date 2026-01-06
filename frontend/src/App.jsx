import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import StoreDetail from './pages/StoreDetail';
import BillPage from './pages/BillPage';
import Search from './pages/Search';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stores/:id" element={<StoreDetail />} />
        <Route path="/new-bill" element={<BillPage />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </BrowserRouter>
  );
}
