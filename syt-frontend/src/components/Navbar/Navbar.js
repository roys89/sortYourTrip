import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../redux/slices/authSlice";
import SignIn from "../SignIn/SignIn";
import SignUp from "../SignUp/SignUp";
import "./Navbar.css";

const Navbar = ({ handleThemeToggle, darkMode }) => {
  const [scrolled, setScrolled] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Get auth state from Redux
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const notificationCount = useSelector(
    (state) => state.notifications?.notifications?.length || 0
  );

  // Local state
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);

  const handleMobileMenuOpen = (event) => setMobileMenuAnchor(event.currentTarget);
  const handleMobileMenuClose = () => setMobileMenuAnchor(null);
  const handleUserMenuOpen = (event) => setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  // Modified auth handlers to support both modal and page navigation
  const handleSignInClick = () => {
    handleMobileMenuClose();
    if (location.pathname.includes('/itinerary') || 
        location.pathname.includes('/booking') ||
        location.state?.showModal) {
      setSignInOpen(true);
    } else {
      navigate('/auth/login');
    }
  };

  const handleSignUpClick = () => {
    handleMobileMenuClose();
    if (location.pathname.includes('/itinerary') || 
        location.pathname.includes('/booking') ||
        location.state?.showModal) {
      setSignUpOpen(true);
    } else {
      navigate('/auth/register');
    }
  };

  const handleSignInClose = () => setSignInOpen(false);
  const handleSignUpClose = () => setSignUpOpen(false);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      handleUserMenuClose();
      handleMobileMenuClose();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Modified mobile menu items
  const mobileMenuItems = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About Us" },
    { to: "/contact", label: "Contact" },
    ...(user?.role === "admin" ? [{ to: "/markup-management", label: "Markup" }] : []),
    ...(isAuthenticated
      ? [
          { to: "/profile", label: "Profile" },
          { to: "/trips", label: "My Trips" },
          { label: "Logout", onClick: handleLogout },
        ]
      : [
          { label: "Sign In", onClick: handleSignInClick },
          { label: "Sign Up", onClick: handleSignUpClick },
        ]),
  ];

  // User menu items remain the same
  const userMenuItems = [
    {
      component: Box,
      sx: { px: 2, py: 1 },
      children: (
        <>
          <Typography variant="subtitle1">
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {user?.email}
          </Typography>
        </>
      ),
    },
    { to: "/profile", label: "Profile" },
    { to: "/trips", label: "My Trips" },
    { label: "Logout", onClick: handleLogout },
  ];

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Get dynamic AppBar styles based on scroll state
  const getAppBarStyle = () => ({
    position: "fixed",
    color: "primary",
    sx: {
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      backdropFilter: "blur(10px)",
      width: scrolled ? "90%" : "100%",
      right: 0,
      left: 0,
      margin: "0 auto",
      transform: "none",
      borderRadius: scrolled ? "24px" : "0",
      mt: scrolled ? 2 : 0,
      boxShadow: scrolled ? 3 : 0,
      backgroundColor: scrolled
        ? theme.palette.navbar.light
        : `${theme.palette.background.default}90`,
      zIndex: 1201,
      top: 0,
      height: 50,
      justifyContent: "center",
    },
  });

  const NavbarLink = ({ to, children }) => (
    <Button
      component={Link}
      to={to}
      color="inherit"
      sx={{
        color: theme.palette.text.primary,
        mx: 1,
        "&.active": {
          borderBottom: `2px solid ${theme.palette.primary.main}`,
        },
      }}
      className={location.pathname === to ? "active" : ""}
    >
      {children}
    </Button>
  );

  const renderDesktopNav = () => (
    <Box
      sx={{
        display: { xs: "none", md: "flex" },
        alignItems: "center",
        marginLeft: "auto",
        gap: 2,
      }}
    >
      <NavbarLink to="/">Home</NavbarLink>
      <NavbarLink to="/about">About Us</NavbarLink>
      <NavbarLink to="/contact">Contact</NavbarLink>
      {user?.role === "admin" && (
        <NavbarLink to="/markup-management">Markup</NavbarLink>
      )}

      {isAuthenticated ? (
        <>
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Account">
            <IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
              <Avatar
                alt={`${user?.firstName} ${user?.lastName}`}
                src={user?.avatar}
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        <>
          <Button
            onClick={handleSignInClick}
            sx={{ color: theme.palette.text.primary }}
          >
            Sign In
          </Button>
          <Button
            onClick={handleSignUpClick}
            sx={{ color: theme.palette.text.primary }}
          >
            Sign Up
          </Button>
        </>
      )}

      <IconButton onClick={handleThemeToggle} color="inherit">
        {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Box>
  );

  return (
    <>
      <AppBar {...getAppBarStyle()}>
        <Toolbar>
          <Box className="navbar-logo-section">
            <Link to="/">
              <img
                src={darkMode ? "/SYT-Logo_white.png" : "/SYT-Logo.png"}
                alt="SortYourTrip Logo"
                className="navbar-logo"
              />
            </Link>
          </Box>

          {isMobile ? (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuOpen}
              sx={{ ml: "auto" }}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            renderDesktopNav()
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Menu */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        sx={{ mt: "45px" }}
      >
        {mobileMenuItems.map((item, index) => (
          <MenuItem
            key={index}
            component={item.to ? Link : undefined}
            to={item.to}
            onClick={(e) => {
              handleMobileMenuClose();
              item.onClick?.(e);
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        sx={{ mt: "45px" }}
      >
        {userMenuItems.map((item, index) => {
          if (item.component) {
            return (
              <item.component key={index} sx={item.sx}>
                {item.children}
              </item.component>
            );
          }
          return (
            <MenuItem
              key={index}
              component={item.to ? Link : undefined}
              to={item.to}
              onClick={(e) => {
                handleUserMenuClose();
                item.onClick?.(e);
              }}
            >
              {item.label}
            </MenuItem>
          );
        })}
      </Menu>

      {/* Auth Modals */}
      <Modal
        open={signInOpen}
        onClose={handleSignInClose}
        aria-labelledby="sign-in-modal"
        aria-describedby="sign-in-form"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: "90%",
            maxWidth: "400px",
            position: "relative",
            backgroundColor: theme.palette.mode === "dark"
              ? "rgba(46, 46, 46)"
              : "rgba(255, 239, 226)",
            boxShadow: 24,
            borderRadius: "12px",
            p: 0,
          }}
        >
          <SignIn handleClose={handleSignInClose} />
        </Box>
      </Modal>

      <Modal
        open={signUpOpen}
        onClose={handleSignUpClose}
        aria-labelledby="sign-up-modal"
        aria-describedby="sign-up-form"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 1, sm: 2, md: 3 }
        }}
      >
        <Box
          sx={{
            width: '95%',
            maxWidth: '800px',
            position: 'relative',
            backgroundColor: theme.palette.mode === "dark"
              ? "rgba(46, 46, 46)"
              : "rgba(255, 239, 226)",
            boxShadow: 24,
            borderRadius: '12px',
            maxHeight: '90vh',
            overflowY: 'auto',
            '&:focus': {
              outline: 'none'
            },
            '&::-webkit-scrollbar': {
              width: '8px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '4px'
            }
          }}
        >
          <SignUp handleClose={handleSignUpClose} />
        </Box>
      </Modal>
    </>
  );
};

export default Navbar;