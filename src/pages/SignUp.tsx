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
import * as React from "react";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDocs, query, setDoc, where, updateDoc } from "firebase/firestore";
import { auth, db } from "../database/firebase.ts";

import { useNavigate } from "react-router-dom";
import { User } from "../libraries/User.ts";
import { AuthContext } from "../AuthContext.tsx";
import { useContext } from "react";
import { Tenant } from "../libraries/Tenant.ts";
import { Landlord } from "../libraries/Landlord.ts";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  maxHeight: "100vh",
  overflowY: "auto",
  [theme.breakpoints.up("sm")]: {
    maxWidth: "450px",
  },
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
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
  maxWidth: "1200px", // Adjusted to make it wider
  margin: "0 auto", // Centering the container
}));

interface Props {
  user?: User;
  window?: () => Window;
}

export default function SignUp(props: Props) {
  const [role, setRole] = React.useState("Tenant");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // force navigate home if user already signed in
  React.useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);

  const [firstNameError, setFirstNameError] = React.useState(false);
  const [firstNameErrorMessage, setFirstNameErrorMessage] = React.useState("");
  const [lastNameError, setLastNameError] = React.useState(false);
  const [lastNameErrorMessage, setLastNameErrorMessage] = React.useState("");

  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState("");
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState("");

  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");

  const [addressError, setAddressError] = React.useState(false);
  const [addressErrorMessage, setAddressErrorMessage] = React.useState("");
  const [cityError, setCityError] = React.useState(false);
  const [cityErrorMessage, setCityErrorMessage] = React.useState("");
  const [stateError, setStateError] = React.useState(false);
  const [stateErrorMessage, setStateErrorMessage] = React.useState("");
  const [zipError, setZipError] = React.useState(false);
  const [zipErrorMessage, setZipErrorMessage] = React.useState("");

  const [dlError, setDlError] = React.useState(false);
  const [dlErrorMessage, setDlErrorMessage] = React.useState("");

  const [creditCardNumberError, setCreditCardNumberError] =
    React.useState(false);
  const [creditCardNumberErrorMessage, setCreditCardNumberErrorMessage] =
    React.useState("");
  const [expirationDateError, setExpirationDateError] = React.useState(false);
  const [expirationDateErrorMessage, setExpirationDateErrorMessage] =
    React.useState("");
  const [cvvError, setCvvError] = React.useState(false);
  const [cvvErrorMessage, setCvvErrorMessage] = React.useState("");

  // Handle Tenant/Landlord Sign up toggle
  const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRole(event.target.value);

    // reset all errors
    setFirstNameError(false);
    setFirstNameErrorMessage("");
    setLastNameError(false);
    setLastNameErrorMessage("");
    setUsernameError(false);
    setUsernameErrorMessage("");
    setEmailError(false);
    setEmailErrorMessage("");
    setPasswordError(false);
    setPasswordErrorMessage("");
    setAddressError(false);
    setAddressErrorMessage("");
    setCityError(false);
    setCityErrorMessage("");
    setStateError(false);
    setStateErrorMessage("");
    setZipError(false);
    setZipErrorMessage("");
    setCreditCardNumberError(false);
    setCreditCardNumberErrorMessage("");
    setExpirationDateError(false);
    setExpirationDateErrorMessage("");
    setCvvError(false);
    setCvvErrorMessage("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    if (!validateInputs(data)) {
      return;
    }

    const email = data.get("email") as string;
    const password = data.get("password") as string;
    const username = data.get("username") as string;
    const firstName = data.get("firstName") as string;
    const middleInitial = data.get("middleInitial") as string;
    const lastName = data.get("lastName") as string;
    const dlNumber = data.get("dlNumber") as string;
    const address = {
      street: data.get("address") as string,
      city: data.get("city") as string,
      state: data.get("state") as string,
      zip: data.get("zip") as string,
    };
    const creditCard = {
      number: data.get("creditCardNumber") as string,
      expirationDate: data.get("expirationDate") as string,
      cvv: data.get("cvv") as string,
    };

    try {
      const USERS_PATH = "users";

      // check if email and username are unique before creating user
      const emailQuery = query(
        collection(db, USERS_PATH),
        where("email", "==", email),
      );
      const emailQuerySnapshot = await getDocs(emailQuery);
      if (!emailQuerySnapshot.empty) {
        setEmailError(true);
        setEmailErrorMessage("Email already exists.");
        throw new Error("Email already exists.");
      }
      const userQuery = query(
        collection(db, USERS_PATH),
        where("username", "==", username),
      );
      const querySnapshot = await getDocs(userQuery);
      if (!querySnapshot.empty) {
        setUsernameError(true);
        setUsernameErrorMessage("Username already exists.");
        throw new Error("Username already exists.");
      }

      // this probably means we can't have a tenant/landlord account with same email.
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const userid = response.user.uid;

      let temp_role_id;
      if (role === "Tenant") {
        const new_tenant = new Tenant(userid, [], "temp");
        await new_tenant.createTenant();
        temp_role_id = new_tenant.roleid;
      } else {
        const new_landlord = new Landlord(userid, [], "temp");
        await new_landlord.createLandlord();
        temp_role_id = new_landlord.roleid;
      }

      // Add user to database
      const userRef = doc(db, USERS_PATH, userid);
      await setDoc(userRef, {
        firstName,
        middleInitial,
        lastName,
        username,
        email,
        address,
        dlNumber,
        creditCard,
        role: role.toLowerCase(),
        roleid: temp_role_id
      });

      navigate(`/signin`);
    } catch (error) {
      console.error("Error signing up: ", error);
    }
  };

  const validateInputs = (data: FormData) => {
    let isValid = true;
    if (!data.get("firstName")) {
      setFirstNameError(true);
      setFirstNameErrorMessage("Required");
      isValid = false;
    } else {
      setFirstNameError(false);
      setFirstNameErrorMessage("");
    }

    if (!data.get("lastName")) {
      setLastNameError(true);
      setLastNameErrorMessage("Required");
      isValid = false;
    } else {
      setLastNameError(false);
      setLastNameErrorMessage("");
    }

    // TODO: Validate username is unique
    if (!data.get("username")) {
      setUsernameError(true);
      setUsernameErrorMessage("Required");
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage("");
    }

    // TODO: Validate email is unique
    if (
      !data.get("email") ||
      !/\S+@\S+\.\S+/.test(data.get("email") as string)
    ) {
      setEmailError(true);
      setEmailErrorMessage("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    if ((data.get("password") as string).length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be at least 6 characters long.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    if (!data.get("address")) {
      setAddressError(true);
      setAddressErrorMessage("Required");
      isValid = false;
    } else {
      setAddressError(false);
      setAddressErrorMessage("");
    }

    if (!data.get("city")) {
      setCityError(true);
      setCityErrorMessage("Required");
      isValid = false;
    } else {
      setCityError(false);
      setCityErrorMessage("");
    }

    if (!data.get("state")) {
      setStateError(true);
      setStateErrorMessage("Required");
      isValid = false;
    } else {
      setStateError(false);
      setStateErrorMessage("");
    }

    if (!data.get("zip")) {
      setZipError(true);
      setZipErrorMessage("Required");
      isValid = false;
    } else {
      setZipError(false);
      setZipErrorMessage("");
    }

    if (!data.get("creditCardNumber")) {
      setCreditCardNumberError(true);
      setCreditCardNumberErrorMessage("Required");
      isValid = false;
    } else {
      setCreditCardNumberError(false);
      setCreditCardNumberErrorMessage("");
    }

    if (!data.get("expirationDate")) {
      setExpirationDateError(true);
      setExpirationDateErrorMessage("Required");
      isValid = false;
    } else {
      setExpirationDateError(false);
      setExpirationDateErrorMessage("");
    }

    if (!data.get("cvv")) {
      setCvvError(true);
      setCvvErrorMessage("Required");
      isValid = false;
    } else {
      setCvvError(false);
      setCvvErrorMessage("");
    }

    return isValid;
  };

  return (
    <>
      <CssBaseline enableColorScheme />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
          >
            {role} Sign up
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
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

            <Stack direction="row" spacing={2}>
              <TextField
                error={firstNameError}
                helperText={firstNameErrorMessage}
                id="firstName"
                type="text"
                placeholder=""
                label="First Name"
                name="firstName"
                required
                fullWidth
              />
              <TextField label="M.I." name="middleInitial" fullWidth />
              <TextField
                error={lastNameError}
                helperText={lastNameErrorMessage}
                type="text"
                id="lastName"
                placeholder=""
                label="Last Name"
                name="lastName"
                required
                fullWidth
              />
            </Stack>

            <TextField
              error={usernameError}
              helperText={usernameErrorMessage}
              label="Username"
              name="username"
              type="text"
              placeholder=""
              required
              fullWidth
            />

            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                error={emailError}
                helperText={emailErrorMessage}
                id="email"
                type="email"
                name="email"
                placeholder="you@email.com"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={emailError ? "error" : "primary"}
                sx={{ ariaLabel: "email" }}
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
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={passwordError ? "error" : "primary"}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Mailing Address</FormLabel>
              <Stack spacing={2}>
                <TextField
                  error={addressError}
                  helperText={addressErrorMessage}
                  label="Street Address"
                  name="address"
                  required
                  fullWidth
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    error={cityError}
                    helperText={cityErrorMessage}
                    label="City"
                    name="city"
                    required
                    fullWidth
                  />
                  <TextField
                    error={stateError}
                    helperText={stateErrorMessage}
                    label="State"
                    name="state"
                    required
                    fullWidth />
                  <TextField
                    error={zipError}
                    helperText={zipErrorMessage}
                    label="Zip Code"
                    name="zip"
                    required
                    fullWidth />
                </Stack>
              </Stack>
            </FormControl>
            <FormLabel htmlFor="password">Driver's License Number</FormLabel>
            <TextField
                error={dlError}
                helperText={dlErrorMessage}
                name="dlNumber"
                placeholder="DL Number"
                type="text"
                autoFocus
                required
                fullWidth
                variant="outlined"
              />
            <FormControl>
              <FormLabel>Credit Card Information</FormLabel>
              <Stack spacing={2}>
                <TextField
                  error={creditCardNumberError}
                  helperText={creditCardNumberErrorMessage}
                  label="Card Number"
                  name="creditCardNumber"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  required
                  fullWidth
                  type="text"
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    error={expirationDateError}
                    helperText={expirationDateErrorMessage}
                    label="Expiration Date"
                    name="expirationDate"
                    placeholder="MM/YY"
                    required
                    fullWidth
                    type="text"
                  />
                  <TextField
                    error={cvvError}
                    helperText={cvvErrorMessage}
                    label="CVV"
                    name="cvv"
                    placeholder="XXX"
                    required
                    fullWidth
                    type="text"
                  />
                </Stack>
              </Stack>
            </FormControl>

            <Button type="submit" fullWidth variant="contained">
              Sign up
            </Button>
            <Typography align="center">
              Already have an account?{" "}
              <a
                href="/signin"
                style={{ color: "blue", textDecoration: "underline" }}
              >
                Sign in
              </a>
            </Typography>
          </Box>
        </Card>
      </SignUpContainer>
    </>
  );
}
