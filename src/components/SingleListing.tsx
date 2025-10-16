import React, { useContext } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Rating,
  CardMedia,
  Divider,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useNavigate, Link } from "react-router-dom";
import { Listing as ListingModel } from "../libraries/Listing";
import { Review } from "../libraries/Review";
import { AuthContext } from "../AuthContext.tsx";

interface SingleListingProps {
  listing: ListingModel;
  reviews: Review[];
  landlordName?: string;
  currentImageIndex: number;
  onImageChange: (direction: "prev" | "next") => void;
  onOpenImage: (image: string) => void;
}

const SingleListing: React.FC<SingleListingProps> = ({
  listing,
  reviews,
  landlordName = "Loading...",
  currentImageIndex,
  onImageChange,
  onOpenImage, // Destructure the prop
}) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        flexDirection: "column",
        p: 2,
        maxWidth: 800,
        width: "100%",
      }}
    >
      {/* Listing Details */}
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        {/* Left Section */}
        <Box sx={{ flex: 1, pr: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            {listing.name}
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            Landlord: {landlordName}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {listing.bedrooms} bed | {listing.bathrooms} bath
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            ${listing.pricePerNight} / night
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Address: {listing.address.toString()}
          </Typography>
          <Rating value={listing.rating || 0} readOnly size="medium" />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {listing.description}
          </Typography>
          {user?.role === "tenant" && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to={`/create-reservation/${listing.id}`}
              sx={{ textDecoration: "none" }}
            >
              Make Reservation
            </Button>
          </Box>
          )}
        </Box>

        {/* Right Section */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <CardMedia
            component="img"
            image={listing.images[currentImageIndex]}
            alt={`Listing Image ${currentImageIndex + 1}`}
            sx={{
              height: 200,
              borderRadius: 1,
              mb: 2,
              cursor: "pointer",
            }}
            onClick={() => onOpenImage(listing.images[currentImageIndex])} // Use the prop
          />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mt: 2,
            }}
          >
            <IconButton size="small" onClick={() => onImageChange("prev")}>
              <ArrowBackIosIcon />
            </IconButton>
            <Typography
              component="span"
              variant="body2"
              color="textSecondary"
              sx={{ mx: 1 }}
            >
              Image {currentImageIndex + 1} / {listing.images.length}
            </Typography>
            <IconButton size="small" onClick={() => onImageChange("next")}>
              <ArrowForwardIosIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Reviews Section */}
      <Divider sx={{ my: 2 }} />
      <Box>
        <Typography variant="h6" gutterBottom>
          Reviews
        </Typography>
        {reviews.length > 0 ? (
          reviews.map((review, reviewIndex) => (
            <Box key={reviewIndex} sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Rating value={review.rating} readOnly size="small" />
                <Typography variant="body2" fontWeight="bold" sx={{ ml: 1 }}>
                  {review.anonymousFlag ? "Anonymous" : review.userId}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {review.comment}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  mt: 1,
                }}
              >
                {review.images.map((image, imageIndex) => (
                  <Box
                    key={imageIndex}
                    sx={{
                      display: "inline-block",
                      cursor: "pointer",
                      marginRight: 1,
                      marginBottom: 1,
                      border: "1px solid #ccc",
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                    onClick={() => onOpenImage(image)} // Use the prop
                  >
                    <CardMedia
                      component="img"
                      src={image}
                      alt={`Review Image ${imageIndex + 1}`}
                      sx={{
                        height: 50,
                        width: 50,
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                ))}
              </Box>
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="textSecondary">
            No reviews available for this listing.
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default SingleListing;
