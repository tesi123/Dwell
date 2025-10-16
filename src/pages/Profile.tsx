import LogoutIcon from "@mui/icons-material/Logout";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { signOut } from "firebase/auth";
import { JSX, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext.tsx";
import { auth } from "../database/firebase.ts";
import ProfileDetails from "./ProfileDetails.tsx";

interface ProfileProps {
  user?: unknown;
  window?: () => Window;
}

function Profile(_props: ProfileProps): JSX.Element {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  function handleSignOut() {
    signOut(auth).then(() => {
      navigate("/"); // Redirect to home page
    });
  }

  return (
    <>
      {user ? (
        <>
          <CssBaseline enableColorScheme />
          <Stack
            direction="column"
            component="main"
            sx={[
              {
                justifyContent: "center",
                height: "calc((1 - var(--template-frame-height, 0)) * 100%)",
                marginTop: "max(40px - var(--template-frame-height, 0px), 0px)",
                minHeight: "100%",
              },
              (theme) => ({
                "&::before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  zIndex: -1,
                  inset: 0,
                  backgroundImage:
                    "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
                  backgroundRepeat: "no-repeat",
                  ...theme.applyStyles("dark", {
                    backgroundImage:
                      "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
                  }),
                },
              }),
            ]}
          >
            <Stack
              direction={{ xs: "column-reverse", md: "row" }}
              sx={{
                justifyContent: "center",
                gap: { xs: 6, sm: 12 },
                p: 2,
                mx: "auto",
              }}
            >
              {/* Left Section: Welcome and Sign-out */}
              <div style={{ minWidth: "25vw" }}>
                <Typography gutterBottom variant="h3" align="left">
                  <Box component="span" color="blue">
                    Welcome
                  </Box>{" "}
                  to D'Well!
                </Typography>
                <Typography
                  gutterBottom
                  variant="h6"
                  align="left"
                  sx={{ paddingBottom: 1 }}
                >
                  Explore your dashboard here.
                </Typography>
                <Button
                  variant="contained"
                  endIcon={<LogoutIcon />}
                  onClick={handleSignOut}
                >
                  Sign out
                </Button>
              </div>

              {/* Right Section: Profile Details */}
              <ProfileDetails user={user} />
            </Stack>
          </Stack>
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "80vh",
            flexDirection: "column",
          }}
        >
          <CircularProgress />
          <Typography sx={{ mt: 2, ml: 2 }}>Loading...</Typography>
        </Box>
      )}
    </>
  );
}

export default Profile;
