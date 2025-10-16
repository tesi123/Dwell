import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Rating,
    TextField,
    IconButton,
    CardMedia,
  } from "@mui/material";
  import DeleteIcon from "@mui/icons-material/Delete";
  import { useContext, useState } from "react";
  import imageCompression from "browser-image-compression";
  import { AuthContext } from "../AuthContext";
  import { db } from "../database/firebase";
  import { doc, getDoc } from "firebase/firestore";
  import { Listing } from "../libraries/Listing";
  import { Review } from "../libraries/Review";
  
  interface ReviewFormPopupProps {
    listingId: string;
    isModalOpen: boolean;
    closeModal: () => void;
  }
  
  const ReviewFormPopup = (props: ReviewFormPopupProps) => {
    const { isModalOpen, closeModal, listingId } = props;
    const { user } = useContext(AuthContext);
  
    const [rating, setRating] = useState<number | null>(null);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");
    const [errorMessage, setErrorMessage] = useState(false);
    const [images, setImages] = useState<string[]>([]); // Array of Base64 images
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
    const closeDialog = () => {
      setRating(null);
      setIsAnonymous(false);
      setTitle("");
      setComment("");
      setImages([]);
      setErrorMessage(false);
      closeModal();
    };
  
    const handleImageUpload = async (files: FileList) => {
      const options = {
        maxSizeMB: 0.1, // 100 KB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
  
      const compressedImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const compressedFile = await imageCompression(file, options);
          const reader = new FileReader();
          reader.onload = () => {
            compressedImages.push(reader.result as string);
            if (compressedImages.length === files.length) {
              setImages((prev) => [...prev, ...compressedImages]);
            }
          };
          reader.readAsDataURL(compressedFile);
        } catch (error) {
          console.error("Error uploading image:", error);
          alert("Error uploading one or more images. Please try again.");
        }
      }
    };
  
    const removeImage = (index: number) => {
      setImages((prev) => prev.filter((_, i) => i !== index));
    };
  
    const handleDragStart = (index: number) => {
      setDraggedIndex(index);
    };
  
    const handleDrop = (index: number) => {
      if (draggedIndex === null || draggedIndex === index) return;
  
      const reorderedImages = [...images];
      const [draggedImage] = reorderedImages.splice(draggedIndex, 1);
      reorderedImages.splice(index, 0, draggedImage);
  
      setImages(reorderedImages);
      setDraggedIndex(null);
    };
  
    const handleSubmit = async () => {
      if (!title.trim() || !comment.trim()) {
        setErrorMessage(true);
        return;
      }
  
      let fullName = user?.firstName || "";
      if (user?.middleInitial) fullName += ` ${user.middleInitial}.`;
      fullName += ` ${user?.lastName || ""}`;
  
      try {
        const r = new Review("", fullName, isAnonymous, images, title, rating!, comment);
        await r.createReview();
  
        const listingDoc = await getDoc(doc(db, "listings", listingId));
        if (!listingDoc.exists()) {
          console.error("Listing not found.");
          return;
        }
  
        const listingRef = listingDoc.data();
        const listing = new Listing(
          listingId,
          listingRef.name,
          listingRef.description,
          listingRef.images,
          listingRef.rating,
          listingRef.reviews,
          listingRef.zipCode,
          listingRef.address,
          listingRef.landlordUid,
          listingRef.reservations,
          listingRef.bathrooms,
          listingRef.bedrooms,
          listingRef.pricePerNight,
        );
  
        listing.addReview(r);
        alert("Review submitted successfully.");
        closeDialog();
      } catch (error) {
        console.error("Error submitting review:", error);
        alert("Failed to submit review. Please try again.");
      }
    };
  
    return (
      <Dialog open={isModalOpen} onClose={closeModal} maxWidth="md" fullWidth>
        <DialogTitle>Leave a Review</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Rating
                name="review-rating"
                value={rating}
                onChange={(_, newValue) => setRating(newValue)}
                size="large"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous(!isAnonymous)}
                    color="primary"
                  />
                }
                label="Leave review anonymously?"
              />
            </Box>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              error={!title && errorMessage}
              helperText={!title && errorMessage ? "Title is required." : ""}
            />
            <TextField
              label="Comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              fullWidth
              multiline
              rows={4}
              required
              error={!comment && errorMessage}
              helperText={!comment && errorMessage ? "Comment is required." : ""}
            />
            <Box>
              <Button variant="contained" component="label">
                Upload Images
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      handleImageUpload(e.target.files);
                    }
                  }}
                />
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
              {images.map((base64, index) => (
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
                    border: "1px solid #ccc",
                    borderRadius: 1,
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
                    }}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!rating || !title.trim() || !comment.trim()}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  export default ReviewFormPopup;
  