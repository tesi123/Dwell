import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Dialog,
  DialogContent,
  CardMedia,
} from "@mui/material";
import { db } from "../database/firebase";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { Listing as ListingModel } from "../libraries/Listing";
import { Review } from "../libraries/Review";
import SingleListing from "../components/SingleListing";

const DevListingView: React.FC = () => {
  const [listings, setListings] = useState<ListingModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number[]>([]);
  const [openImage, setOpenImage] = useState<string | null>(null);
  const [landlordNames, setLandlordNames] = useState<{ [key: string]: string }>({});
  const [reviews, setReviews] = useState<{ [key: string]: Review[] }>({});

  useEffect(() => {
    const fetchListings = async () => {
      const listingsCollection = collection(db, "listings");
      try {
        const listingsSnapshot = await getDocs(listingsCollection);
        const listingsData = listingsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return new ListingModel(
            doc.id,
            data.name,
            data.description,
            data.images,
            data.rating,
            data.reviews,
            data.zipCode,
            data.address,
            data.landlordUid,
            data.reservations,
            data.bathrooms,
            data.bedrooms,
            data.pricePerNight
          );
        });
        setListings(listingsData);
        setCurrentImageIndex(Array(listingsData.length).fill(0));
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError("Failed to fetch listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  useEffect(() => {
    const fetchLandlordNames = async () => {
      const names: { [key: string]: string } = {};
      for (const listing of listings) {
        names[listing.landlordUid] = await getLandlordName(listing.landlordUid);
      }
      setLandlordNames(names);
    };

    void fetchLandlordNames();
  }, [listings]);

  useEffect(() => {
    const fetchReviews = async () => {
      const newReviews: { [key: string]: Review[] } = {};
      for (const listing of listings) {
        if (listing.reviews && listing.reviews.length > 0) {
          const listingReviews = await Promise.all(
            listing.reviews.map(async (reviewId) => {
              const reviewRef = doc(db, "reviews", reviewId);
              try {
                const reviewSnapshot = await getDoc(reviewRef);
                if (reviewSnapshot.exists()) {
                  const reviewData = reviewSnapshot.data();
                  return new Review(
                    reviewData.reviewId,
                    reviewData.userId,
                    reviewData.anonymousFlag,
                    reviewData.images,
                    reviewData.title,
                    reviewData.rating,
                    reviewData.comment
                  );
                }
              } catch (error) {
                console.error(`Error fetching review for listing ${listing.id}:`, error);
              }
              return null;
            })
          );

          const filteredReviews = listingReviews.filter((r): r is Review => r !== null);
          if (filteredReviews.length > 0) {
            newReviews[listing.id] = filteredReviews;
          }
        }
      }
      setReviews(newReviews);
    };

    if (listings.length > 0) {
      fetchReviews();
    }
  }, [listings]);

  const handleImageChange = (listingIndex: number, direction: "prev" | "next") => {
    setCurrentImageIndex((prev) => {
      const updatedIndexes = [...prev];
      const listing = listings[listingIndex];
      const imagesLength = listing.images.length;

      if (direction === "prev") {
        updatedIndexes[listingIndex] =
          (updatedIndexes[listingIndex] - 1 + imagesLength) % imagesLength;
      } else {
        updatedIndexes[listingIndex] =
          (updatedIndexes[listingIndex] + 1) % imagesLength;
      }
      return updatedIndexes;
    });
  };

  const handleOpenImage = (image: string) => {
    setOpenImage(image);
  };

  const handleCloseImage = () => {
    setOpenImage(null);
  };

  const getLandlordName = async (landlordUid: string) => {
    const userQuery = query(
      collection(db, "users"),
      where("roleid", "==", landlordUid),
      where("role", "==", "landlord")
    );
    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      let data = querySnapshot.docs[0].data();
      return `${data.firstName} ${data.lastName}`;
    }
    return "Unknown";
  };

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (listings.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography variant="h6" color="textSecondary">
          No listings available.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        mt: 4,
      }}
    >
      {listings.map((listing, index) => (
        <SingleListing
          key={listing.id}
          listing={listing}
          reviews={reviews[listing.id] || []}
          landlordName={landlordNames[listing.landlordUid]}
          currentImageIndex={currentImageIndex[index]}
          onImageChange={(direction) => handleImageChange(index, direction)}
          onOpenImage={handleOpenImage}
        />
      ))}

      {/* Image Modal */}
      <Dialog open={!!openImage} onClose={handleCloseImage} maxWidth="lg">
        <DialogContent>
          {openImage && (
            <CardMedia
              component="img"
              src={openImage}
              alt="Enlarged Image"
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

export default DevListingView;
