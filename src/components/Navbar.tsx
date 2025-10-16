import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext.tsx";
import { Link } from "@mui/material";

interface NavbarProps {
  window?: () => Window;
}

const Navbar = ({ window }: NavbarProps) => {
  const drawerWidth = 240;
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    !currentUser || currentUser?.role === "tenant"
      ? { label: "Search", path: "/search" }
      : { label: "Create", path: "/create-listing" },
    {
      label: currentUser ? "Profile" : "Sign In",
      path: currentUser ? "/profile" : "/signin",
    },
  ];

  // Add separately to avoid giving options to signed-out users
  if (currentUser?.role === "landlord") {
    navItems.unshift({ label: "Listings", path: "/manage-listings" });
  } else if (currentUser?.role === "tenant") {
    navItems.unshift({ label: "Reservations", path: "/manage-reservations" });
  }

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const container =
    window !== undefined ? () => window().document.body : undefined;

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Link
        underline="hover"
        variant="h6"
        sx={{ my: 2, fontFamily: 'Poppins, sans-serif', color: 'white'}}
        href="/" >
        D'WELL
      </Link>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{ textAlign: "center" }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar component="nav">
        <Toolbar sx={{ display: "flex", justifyContent: "right" }}>
          <Link
            underline="hover"
            variant="h6"
            sx={{ flexGrow: 1, display: { xs: "none", sm: "block" }, fontFamily: 'Poppins, sans-serif', color: 'white'}}
            href={"/"}>
            D'WELL
          </Link>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                sx={{ color: "#fff" }}
                onClick={() => handleNavigation(item.path)}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <nav>
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
    </Box>
  );
};

export default Navbar;
