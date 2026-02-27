// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import SelectRestaurant from "./pages/SelectRestaurant.jsx";
import Menu from "./pages/menu.jsx";
import Owner from "./pages/owner.jsx";
import Kitchen from "./pages/Kitchen.jsx";
import CartPage from "./pages/CartPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Admin from "./pages/Admin.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import RouteErrorBoundary from "./components/RouteErrorBoundary.jsx";

function App() {
  return (
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTES - Anyone can access */}
          <Route 
            path="/" 
            element={
              <RouteErrorBoundary routeName="Menu">
                <Menu />
              </RouteErrorBoundary>
            } 
          />
          
          <Route 
            path="/login" 
            element={
              <RouteErrorBoundary routeName="Login">
                <Login />
              </RouteErrorBoundary>
            } 
          />
          
          <Route 
            path="/register" 
            element={
              <RouteErrorBoundary routeName="Register">
                <Register />
              </RouteErrorBoundary>
            } 
          />
          
          <Route 
            path="/select-restaurant" 
            element={
              <RouteErrorBoundary routeName="Select Restaurant">
                <SelectRestaurant />
              </RouteErrorBoundary>
            } 
          />
          
          {/* PROTECTED ROUTES - Need login */}
          {/* Menu (protected version) - Customers only */}
          <Route
            path="/menu-protected"
            element={
              <RouteErrorBoundary routeName="Protected Menu">
                <ProtectedRoute forbiddenRole="owner">
                  <Menu />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          
          {/* Cart - Customers only */}
          <Route
            path="/cart"
            element={
              <RouteErrorBoundary routeName="Cart">
                <ProtectedRoute forbiddenRole="owner">
                  <CartPage />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          
          {/* Owner Dashboard - Owners only */}
          <Route
            path="/owner"
            element={
              <RouteErrorBoundary routeName="Owner Dashboard">
                <ProtectedRoute requiredRole="owner">
                  <Owner />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          
          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <RouteErrorBoundary routeName="Admin Panel">
                <ProtectedRoute allowedRoles={["admin", "owner"]}>
                  <Admin />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          
          {/* Kitchen Page - Kitchen staff, admin, owner */}
          <Route
            path="/kitchen"
            element={
              <RouteErrorBoundary routeName="Kitchen">
                <ProtectedRoute allowedRoles={["kitchen", "admin", "owner"]}>
                  <Kitchen />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          
          {/* 404 page */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
