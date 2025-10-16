import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogContent,
  CardMedia,
  IconButton,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../database/firebase";
import { Listing } from "../libraries/Listing";
import { Landlord } from "../libraries/Landlord";
import { Review } from "../libraries/Review";
import SingleListing from "../components/SingleListing";
import { AuthContext } from "../AuthContext.tsx";

const ManageListings: React.FC = () => {
  const [landlord, setLandlord] = useState<Landlord | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviewsMap, setReviewsMap] = useState<{ [listingId: string]: Review[] }>({});
  const [currentImageIndexMap, setCurrentImageIndexMap] = useState<{ [listingId: string]: number }>({});
  const [openImage, setOpenImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchLandlord = async () => {
      setLoading(true);
      setError(null);

      try {

        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            throw new Error(`User document for UID ${user.uid} not found.`);
          }

          const userData = userDocSnap.data();
          const roleId = userData.roleid;

          if (!roleId || userData.role !== "landlord") {
            throw new Error("User is not a landlord or roleId is missing.");
          }

          const landlordDocRef = doc(db, "landlords", roleId);
          const landlordDocSnap = await getDoc(landlordDocRef);

          if (!landlordDocSnap.exists()) {
            throw new Error(`Landlord document for roleId ${roleId} not found.`);
          }

          const landlordData = landlordDocSnap.data();
          const landlordInstance = new Landlord(
            landlordData.uid,
            landlordData.listings || [],
            landlordData.roleid
          );

          setLandlord(landlordInstance);
        }
      } catch (error) {
        console.error("Error fetching landlord data:", error);
        setError("Failed to fetch landlord data. Please try again later.");
      }
    };

    fetchLandlord();
  }, [user]);

  useEffect(() => {
    const fetchListings = async () => {
      if (!landlord) return;

      try {
        setLoading(true);
        const fetchedListings = await Promise.all(
          landlord.listings.map(async (listingId) => {
            const docRef = doc(db, "listings", listingId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const data = docSnap.data();
              return new Listing(
                listingId,
                data.name,
                data.description,
                data.images || [],
                data.rating || 0,
                data.reviews || [],
                data.zipCode || "",
                data.address,
                data.landlordUid || "",
                data.reservations || [],
                data.bathrooms || 0,
                data.bedrooms || 0,
                data.pricePerNight || 0
              );
            } else {
              console.warn(`Listing with ID ${listingId} not found.`);
              return null;
            }
          })
        );

        const validListings = fetchedListings.filter((listing): listing is Listing => listing !== null);
        setListings(validListings);

        const initialImageIndexMap: { [listingId: string]: number } = {};
        const initialReviewsMap: { [listingId: string]: Review[] } = {};
        validListings.forEach((listing) => {
          initialImageIndexMap[listing.id] = 0;
          initialReviewsMap[listing.id] = []; // Set an empty array for reviews by default
        });
        setCurrentImageIndexMap(initialImageIndexMap);
        setReviewsMap(initialReviewsMap);
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError("Failed to fetch listings.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [user, landlord]);

  const handleDeleteListing = async (listing: Listing) => {
    try {
      await listing.deleteListing(); // This handles deleting the listing from Firebase

      // Update state to remove the listing from the UI
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
    } catch (error) {
      console.error("Error deleting listing:", error);
      setError("Failed to delete listing.");
    }
  };


  const handleImageChange = (listingId: string, direction: "prev" | "next") => {
    setCurrentImageIndexMap((prev) => {
      const updated = { ...prev };
      const currentIndex = updated[listingId];
      const listing = listings.find((l) => l.id === listingId);
      if (listing) {
        const imagesLength = listing.images.length;
        if (direction === "prev") {
          updated[listingId] = (currentIndex - 1 + imagesLength) % imagesLength;
        } else {
          updated[listingId] = (currentIndex + 1) % imagesLength;
        }
      }
      return updated;
    });
  };

  const handleOpenImage = (image: string) => {
    setOpenImage(image);
  };

  const handleCloseImage = () => {
    setOpenImage(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", flexDirection: "column" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (listings.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Typography variant="h6" color="textSecondary">
          No listings available.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, mt: 4 }}>
      {listings.map((listing) => (
        <Box key={listing.id} sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", maxWidth: 800 }}>
          <IconButton
            onClick={() => handleDeleteListing(listing)}
            sx={{ color: "red" }}
            aria-label="delete listing"
          >
            <DeleteIcon />
          </IconButton>
          <SingleListing
            listing={listing}
            reviews={reviewsMap[listing.id] || []}
            landlordName={"You"}
            currentImageIndex={currentImageIndexMap[listing.id] || 0}
            onImageChange={(direction) => handleImageChange(listing.id, direction)}
            onOpenImage={handleOpenImage}
          />
        </Box>
      ))}

      <Dialog open={!!openImage} onClose={handleCloseImage} maxWidth="lg">
        <DialogContent>
          {openImage && (
            <CardMedia
              component="img"
              src={openImage}
              alt="Enlarged Listing Image"
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

export default ManageListings;