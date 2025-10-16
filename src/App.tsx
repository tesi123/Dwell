import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Profile from "./pages/Profile";
import Listing from "./pages/DevListingView.tsx";
import Search from "./pages/Search.tsx";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound.tsx";
import CreateListing from "./pages/CreateListing"
import Navbar from "./components/Navbar.tsx";
import CreateReservation from "./pages/CreateReservation.tsx";
import ManageReservations from "./pages/ManageReservations.tsx";
import CancelReservation from "./pages/CancelReservation.tsx";
import ManageListings from "./pages/ManageListings.tsx"
import ListingDetails from './pages/ListingDetails';

const App = () => {
  return (
    <Router>
      <Navbar />
      <div style={{ paddingTop: '64px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/devlisting" element={<Listing />} />
          <Route path="/search" element={<Search />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/create-reservation/:listingId" element={<CreateReservation />} />
          <Route path="/manage-reservations" element={<ManageReservations />} />
          <Route path="/cancel-reservation" element={<CancelReservation />} />
          <Route path="/manage-listings" element={<ManageListings />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
