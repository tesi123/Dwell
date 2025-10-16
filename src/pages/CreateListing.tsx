import React, { useContext, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Divider,
  CardMedia,
  Dialog,
  DialogContent,
  InputAdornment,
  IconButton,
} from "@mui/material";
import imageCompression from 'browser-image-compression';
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { db } from "../database/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { AuthContext } from "../AuthContext.tsx";
import CircularProgress from "@mui/material/CircularProgress";
import { Landlord } from "../libraries/Landlord.ts";

type ListingFormState = {
  name: string;
  description: string;
  images: string[];
  rating: number;
  reviews: string[];
  zipCode: string;
  address: string;
  landlordUid: string;
  reservations: string[];
  bathrooms: string;
  bedrooms: string;
  pricePerNight: string;
};

const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState<ListingFormState>({
    name: "",
    description: "",
    images: [], // Base64-encoded image strings
    rating: 0,
    reviews: [],
    zipCode: "",
    address: "",
    landlordUid: "",
    reservations: [],
    bathrooms: "",
    bedrooms: "",
    pricePerNight: "",
  });

  const [uploading, _setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = async (file: File) => {
    const options = {
      maxSizeMB: 0.1, // 100kb
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, base64String],
      }));
    };
      reader.readAsDataURL(compressedFile); // Convert compressed file to Base64 string
    } catch (error) {
      alert("Error uploading image. Please try again.");
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const reorderedImages = [...form.images];
    const [draggedImage] = reorderedImages.splice(draggedIndex, 1);
    reorderedImages.splice(index, 0, draggedImage);

    setForm((prev) => ({
      ...prev,
      images: reorderedImages,
    }));

    setDraggedIndex(null);
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (form.name.trim() === "") errors.push("Name is required.");
    if (form.description.trim() === "") errors.push("Description is required.");
    if (form.images.length === 0)
      errors.push("At least one image is required.");
    if (form.address.trim() === "") errors.push("Address is required.");
    if (!/^\d{5}(-\d{4})?$/.test(form.zipCode)) {
      errors.push("Invalid ZIP Code format. Use 5-digit or ZIP+4 format.");
    }
    if (!Number(form.bathrooms))
      errors.push("Bathrooms must be a valid number.");
    if (!Number(form.bedrooms)) errors.push("Bedrooms must be a valid number.");
    if (!/^\d*\.?\d{0,2}$/.test(form.pricePerNight)) {
      errors.push(
        "Price Per Night must be a valid number with up to two decimals.",
      );
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    try {
      const listingsCollection = collection(db, "listings");
      const listingRef = await addDoc(listingsCollection, {
        ...form,
        landlordUid: user?.roleid,
        bathrooms: Number(form.bathrooms),
        bedrooms: Number(form.bedrooms),
        pricePerNight: Number(form.pricePerNight),
      });
      if (!user) {
        throw new Error("User is null");
      }
      let landlordData = await getDoc(doc(db, "landlords", user?.roleid)).then((doc) => doc.data());
      if (!landlordData) {
        throw new Error("Landlord data is undefined");
      }
      let currLandlord = new Landlord(
        landlordData.userid,
        landlordData.listings,
        landlordData.landlordid
      );
      currLandlord.addProperty(listingRef.id);
      await currLandlord.updateLandlord();
      alert("Listing created successfully!");
      navigate("/"); // navigate home
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Failed to create listing.");
    }
  };

  if (!user || user.role !== "landlord") {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, ml: 2 }}>Loading...</Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mt: 4,
        px: 2,
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 600, width: "100%" }} elevation={3}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Create New Listing
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Name */}
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            fullWidth
          />
          {/* Description */}
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
          {/* Images */}
          <Typography variant="subtitle1" gutterBottom>
            Upload Images
          </Typography>
          <Box>
            <Button variant="contained" component="label" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Image"}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageUpload(e.target.files[0]);
                  }
                }}
              />
            </Button>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              mt: 2,
            }}
          >
            {form.images.map((base64, index) => (
              <Box
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                sx={{
                  position: "relative",
                  width: 75,
                  height: 75,
                  overflow: "hidden",
                  borderRadius: 1,
                  border: "1px solid #ccc",
                  boxShadow: 1,
                }}
              >
                <CardMedia
                  component="img"
                  src={base64}
                  alt={`Uploaded Image ${index + 1}`}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                  onClick={() => setPreviewImage(base64)}
                />
                <IconButton
                  onClick={() => removeImage(index)}
                  sx={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
          {/* Address */}
          <TextField
            label="Address"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            fullWidth
          />
          {/* Zip Code */}
          <TextField
            label="Zip Code"
            value={form.zipCode}
            onChange={(e) => handleChange("zipCode", e.target.value)}
            fullWidth
          />
          {/* Bathrooms */}
          <TextField
            label="Bathrooms"
            type="number"
            value={form.bathrooms}
            onChange={(e) => handleChange("bathrooms", e.target.value)}
            fullWidth
          />
          {/* Bedrooms */}
          <TextField
            label="Bedrooms"
            type="number"
            value={form.bedrooms}
            onChange={(e) => handleChange("bedrooms", e.target.value)}
            fullWidth
          />
          {/* Price Per Night */}
          <TextField
            label="Price Per Night"
            type="text"
            value={form.pricePerNight}
            onChange={(e) => {
              let value = e.target.value;
              if (/^\d*\.?\d{0,2}$/.test(value)) {
                setForm((prev) => ({ ...prev, pricePerNight: value }));
              }
            }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
          />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/")}
          >
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </Box>
      </Paper>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
      >
        <DialogContent sx={{ position: "relative" }}>
          <IconButton
            onClick={() => setPreviewImage(null)}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
          {previewImage && (
            <CardMedia
              component="img"
              src={previewImage}
              alt="Preview"
              sx={{
                maxWidth: "80vw",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 1,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CreateListing;
