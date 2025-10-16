import { FormControlLabel, Radio, RadioGroup } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiCard from "@mui/material/Card";
import CssBaseline from "@mui/material/CssBaseline";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../database/firebase";
import { User } from "../libraries/User.ts";
import { AuthContext } from "../AuthContext.tsx";
import { useContext } from "react";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  [theme.breakpoints.up("sm")]: {
    maxWidth: "450px",
  },
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: "calc(100vh - 64px)",
  minHeight: "100%",
  padding: theme.spacing(2),
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    backgroundRepeat: "no-repeat",
  },
}));

interface Props {
  user?: User;
  window?: () => Window;
}

export default function SignIn(props: Props) {
  const [role, setRole] = React.useState("Tenant");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // force navigate home if user already signed in
  React.useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);

  const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRole(event.target.value);
  };

  const [identifierError, setIdentifierError] = React.useState(false);
  const [identifierErrorMessage, setIdentifierErrorMessage] =
    React.useState("");
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] =
    React.useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const identifier = data.get("identifier") as string;
    const password = data.get("password") as string;

    if (!validateInputs(identifier, password)) {
      return;
    }

    try {
      let email = identifier;
      // If input is not an email, fetch email by username from Firestore
      if (!/\S+@\S+\.\S+/.test(identifier)) {
        const userQuery = query(
          collection(db, "users"),
          where("username", "==", identifier),
          where("role", "==", role.toLowerCase())
        );
        const querySnapshot = await getDocs(userQuery);
        
        console.log("Firestore query response for username:", querySnapshot.docs);

        if (!querySnapshot.empty) {
          email = querySnapshot.docs[0].data().email;
        } else {
          throw new Error("Username not found.");
        }
      } else {
        // verify email is associated with the role
        const userQuery = query(
          collection(db, "users"),
          where("email", "==", identifier),
          where("role", "==", role.toLowerCase())
        );
        const querySnapshot = await getDocs(userQuery);

        console.log("Firestore query response for email:", querySnapshot.docs);

        if (querySnapshot.empty) {
          throw new Error("Email not found.");
        }
      }

      // Log the email being used for login
      console.log("Attempting to sign in with email:", email);

      // Sign in using email and password
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error: any) {
      console.error("Error signing in:", error);

      // Handle different error types
      if (error.message === "Username not found." || error.message === "Email not found.") {
        setIdentifierError(true);
        setIdentifierErrorMessage(error.message);
      } else {
        setIdentifierError(true);
        setIdentifierErrorMessage("Invalid username or email.");
      }

      if (error.code === "auth/wrong-password") {
        setPasswordError(true);
        setPasswordErrorMessage("Incorrect password.");
      } else {
        setPasswordError(false);
        setPasswordErrorMessage("");
      }
    }
  };

  const validateInputs = (identifier: string, password: string) => {
    let isValid = true;

    if (!identifier) {
      setIdentifierError(true);
      setIdentifierErrorMessage("Please enter a username or email.");
      isValid = false;
    } else {
      setIdentifierError(false);
      setIdentifierErrorMessage("");
    }

    if (password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be at least 6 characters long.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    return isValid;
  };

  return (
    <>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
          >
            {role} Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            method={"post"}
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 2,
            }}
          >
            <RadioGroup
              row
              aria-label="role"
              name="role"
              value={role}
              onChange={handleRoleChange}
            >
              <FormControlLabel
                value="Tenant"
                control={<Radio />}
                label="Tenant"
              />
              <FormControlLabel
                value="Landlord"
                control={<Radio />}
                label="Landlord"
              />
            </RadioGroup>

            <FormControl>
              <FormLabel htmlFor="identifier">Username or Email</FormLabel>
              <TextField
                error={identifierError}
                helperText={identifierErrorMessage}
                id="identifier"
                type="text"
                name="identifier"
                placeholder="Username or email"
                autoComplete="username"
                required
                fullWidth
                variant="outlined"
                color={identifierError ? "error" : "primary"}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="•••••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                required
                fullWidth
                variant="outlined"
                color={passwordError ? "error" : "primary"}
              />
            </FormControl>

            <Button type="submit" fullWidth variant="contained">
              Sign in
            </Button>
            <Typography align="center">
              Need an account?{" "}
              <a
                href="/signup"
                style={{ color: "blue", textDecoration: "underline" }}
              >
                Sign up
              </a>
            </Typography>
          </Box>
        </Card>
      </SignInContainer>
    </>
  );
}
