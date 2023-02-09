import { Navigate, Route, Routes } from 'react-router-dom';
import AppNav from './components/AppNav';
import MenuProvider from './context/MenuProvider';
import Customers from './screens/Customers';
import Home from './screens/Home';
import Items from './screens/Items';
import NewItem from './screens/NewItem';
import NotFound from './screens/NotFound';
import Order from './screens/Order';
import './styles/theme.css';

/**
 * Routing and the one piece of shared state.
 *
 * `MenuProvider` wraps the routes rather than each screen, so the menu and
 * the paired-item offers are fetched once for the whole session instead of
 * once per navigation.
 */
export default function App() {
  return (
    <MenuProvider>
      <div className="app-shell">
        <AppNav />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/items" element={<Items />} />
            <Route path="/items/new" element={<NewItem />} />
            <Route path="/order" element={<Order />} />
            <Route path="/customers" element={<Customers />} />
            {/* The first version routed this screen at /customer and /new_item. */}
            <Route path="/customer" element={<Navigate to="/customers" replace />} />
            <Route path="/new_item" element={<Navigate to="/items/new" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </MenuProvider>
  );
}
