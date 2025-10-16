import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { Address, BillingInformation, User } from "../libraries/User.ts";

interface ProfileDetailsProps {
  user: User; // The currently authenticated user
}

function ProfileDetails({ user }: ProfileDetailsProps): JSX.Element {
  const [editableUser, setEditableUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      setEditableUser(
        new User(
          user.firstName,
          user.middleInitial,
          user.lastName,
          user.username,
          user.email,
          user.address,
          user.dlNumber,
          user.billing,
          user.uid,
          user.role,
          user.roleid,
        ),
      );
    }
  }, [user]);

  // List of valid US states
  const usStates = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
  ];

  // Validation rules for each field
  const validateField = (field: string, value: string): string => {
    const rules: { [key: string]: (value: string) => string } = {
      firstName: (val) => (val.trim() ? "" : "First name is required"),
      middleInitial: (val) =>
        val.length <= 1 ? "" : "Middle initial must be 1 character",
      lastName: (val) => (val.trim() ? "" : "Last name is required"),
      email: (val) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? "" : "Invalid email format",
      dlNumber: (val) => (val.trim() ? "" : "Driver's license is required"),
      street: (val) => (val.trim() ? "" : "Street is required"),
      city: (val) => (val.trim() ? "" : "City is required"),
      state: (val) =>
        usStates.includes(val) ? "" : "Please select a valid state",
      zip: (val) => (/^\d{5}(-\d{4})?$/.test(val) ? "" : "Invalid ZIP code"),
      number: (val) =>
        luhnCheck(val.replace(/\s+/g, "")) ? "" : "Invalid card number",
      expirationDate: (val) => validateExpirationDate(val),
      cvv: (val) => (/^\d{3,4}$/.test(val) ? "" : "CVV must be 3 or 4 digits"),
    };

    return rules[field] ? rules[field](value) : "";
  };

  // Luhn algorithm for card number validation
  const luhnCheck = (cardNumber: string): boolean => {
    let sum = 0;
    let shouldDouble = false;

    // Process digits right to left
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  };

  // Validate expiration date
  const validateExpirationDate = (val: string): string => {
    if (!/^\d{2}\/\d{2}$/.test(val)) {
      return "Use MM/YY format";
    }
    const [monthStr, yearStr] = val.split("/");
    const month = parseInt(monthStr, 10);
    const year = parseInt("20" + yearStr, 10); // Assuming 20YY format

    if (month < 1 || month > 12) {
      return "Invalid month";
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // Months are 0-based
    const currentYear = now.getFullYear();

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return "Card has expired";
    }

    return "";
  };

  const handleFieldChange = (field: keyof User, value: string) => {
    if (!editableUser) return;

    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));

    setEditableUser((prev) => {
      if (!prev) return null;

      return new User(
        field === "firstName" ? value : prev.firstName,
        field === "middleInitial" ? value : prev.middleInitial,
        field === "lastName" ? value : prev.lastName,
        prev.username,
        field === "email" ? value : prev.email,
        prev.address,
        field === "dlNumber" ? value : prev.dlNumber,
        prev.billing,
        prev.uid,
        prev.role,
        prev.roleid,
      );
    });
  };

  const handleAddressFieldChange = (field: keyof Address, value: string) => {
    if (!editableUser) return;

    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));

    setEditableUser((prev) => {
      if (!prev) return null;

      const updatedAddress = { ...prev.address, [field]: value };
      return new User(
        prev.firstName,
        prev.middleInitial,
        prev.lastName,
        prev.username,
        prev.email,
        updatedAddress,
        prev.dlNumber,
        prev.billing,
        prev.uid,
        prev.role,
        prev.roleid,
      );
    });
  };

  const handleBillingFieldChange = (
    field: keyof BillingInformation,
    value: string,
  ) => {
    if (!editableUser) return;

    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));

    setEditableUser((prev) => {
      if (!prev) return null;

      const updatedBilling = { ...prev.billing, [field]: value };
      return new User(
        prev.firstName,
        prev.middleInitial,
        prev.lastName,
        prev.username,
        prev.email,
        prev.address,
        prev.dlNumber,
        updatedBilling,
        prev.uid,
        prev.role,
        prev.roleid,
      );
    });
  };

  const saveChanges = async () => {
    if (!editableUser) {
      alert("No user data to update");
      return;
    }

    if (Object.values(errors).some((error) => error)) {
      alert("Please fix validation errors before saving.");
      return;
    }

    try {
      await editableUser.updateUser();
      alert("User updated successfully!");
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error during save:", error);
      alert("Failed to update user: " + error);
    }
  };

  return (
    <>
      <Card
        variant="outlined"
        sx={{ minWidth: "25vw", padding: 2 }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Profile Details
        </Typography>
        <Box sx={{ marginBottom: 2 }}>
          <Typography>
            <strong>Username:</strong> {editableUser?.username}
          </Typography>
          <Typography>
            <strong>Name:</strong> {editableUser?.firstName} {editableUser?.middleInitial} {editableUser?.lastName}
          </Typography>
          <Typography>
            <strong>Email:</strong> {editableUser?.email}
          </Typography>
          <Typography>
            <strong>Address:</strong>{" "}
            {`${editableUser?.address.street}, ${editableUser?.address.city}, ${editableUser?.address.state} ${editableUser?.address.zip}`}
          </Typography>
          <Typography>
            <strong>Driver's License:</strong> {editableUser?.dlNumber}
          </Typography>
          <Typography>
            <strong>Billing Information:</strong>
          </Typography>
          <Typography>- Card Number: {editableUser?.billing.number}</Typography>
          <Typography>
            - Expiration Date: {editableUser?.billing.expirationDate}
          </Typography>
          <Typography>- CVV: {editableUser?.billing.cvv}</Typography>
        </Box>
        <Button
          variant="contained"
          sx={{ marginTop: 2 }}
          onClick={() => setIsEditModalOpen(true)}
        >
          Edit Profile
        </Button>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            label="First Name"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editableUser?.firstName || ""}
            error={!!errors.firstName}
            helperText={errors.firstName}
            onChange={(e) => handleFieldChange("firstName", e.target.value)}
          />
          <TextField
            label="Middle Initial"
            variant="outlined"
            fullWidth
            margin="normal"
            inputProps={{ maxLength: 1 }}
            value={editableUser?.middleInitial || ""}
            error={!!errors.middleInitial}
            helperText={errors.middleInitial}
            onChange={(e) => handleFieldChange("middleInitial", e.target.value)}
          />
          <TextField
            label="Last Name"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editableUser?.lastName || ""}
            error={!!errors.lastName}
            helperText={errors.lastName}
            onChange={(e) => handleFieldChange("lastName", e.target.value)}
          />
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editableUser?.email || ""}
            error={!!errors.email}
            helperText={errors.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
          />
          <TextField
            label="Street"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editableUser?.address.street || ""}
            error={!!errors.street}
            helperText={errors.street}
            onChange={(e) => handleAddressFieldChange("street", e.target.value)}
          />
          <TextField
            label="City"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editableUser?.address.city || ""}
            error={!!errors.city}
            helperText={errors.city}
            onChange={(e) => handleAddressFieldChange("city", e.target.value)}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="state-label">State</InputLabel>
            <Select
              labelId="state-label"
              value={editableUser?.address.state || ""}
              label="State"
              error={!!errors.state}
              onChange={(e) =>
                handleAddressFieldChange("state", e.target.value as string)
              }
            >
              {usStates.map((stateCode) => (
                <MenuItem key={stateCode} value={stateCode}>
                  {stateCode}
                </MenuItem>
              ))}
            </Select>
            {errors.state && (
              <Typography color="error" variant="caption">
                {errors.state}
              </Typography>
            )}
          </FormControl>
          <TextField
            label="ZIP"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editableUser?.address.zip || ""}
            error={!!errors.zip}
            helperText={errors.zip}
            onChange={(e) => handleAddressFieldChange("zip", e.target.value)}
          />
          <TextField
            label="Driver's License"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editableUser?.dlNumber || ""}
            error={!!errors.dlNumber}
            helperText={errors.dlNumber}
            onChange={(e) => handleFieldChange("dlNumber", e.target.value)}
          />
          <TextField
            label="Card Number"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editableUser?.billing.number || ""}
            error={!!errors.number}
            helperText={errors.number}
            onChange={(e) => handleBillingFieldChange("number", e.target.value)}
          />
          <TextField
            label="Expiration Date (MM/YY)"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editableUser?.billing.expirationDate || ""}
            error={!!errors.expirationDate}
            helperText={errors.expirationDate}
            onChange={(e) =>
              handleBillingFieldChange("expirationDate", e.target.value)
            }
          />
          <TextField
            label="CVV"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editableUser?.billing.cvv || ""}
            error={!!errors.cvv}
            helperText={errors.cvv}
            onChange={(e) => handleBillingFieldChange("cvv", e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
          <Button
            onClick={saveChanges}
            variant="contained"
            disabled={Object.values(errors).some((e) => !!e)}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ProfileDetails;
