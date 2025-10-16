import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Modal, CircularProgress } from '@mui/material';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../database/firebase';
import { Listing } from '../libraries/Listing';
import { Review } from '../libraries/Review';
import SingleListing from '../components/SingleListing';

const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [landlordName, setLandlordName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  
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

  useEffect(() => {
    const fetchListingDetails = async () => {
      try {
        if (!id) return;

        // Fetch listing data
        const listingDoc = await getDoc(doc(db, "listings", id));
        const listingData = listingDoc.data();

        if (listingData) {
          const listing = new Listing(
            id,
            listingData.name,
            listingData.description,
            listingData.images,
            listingData.rating,
            listingData.reviews,
            listingData.zipCode,
            listingData.address,
            listingData.landlordUid,
            listingData.reservations,
            listingData.bathrooms,
            listingData.bedrooms,
            listingData.pricePerNight
          );
          setListing(listing);

          // Fetch landlord name
          getLandlordName(listingData.landlordUid).then(name => setLandlordName(name));

          // Fetch reviews
          const newReviews: { [key: string]: Review[] } = {};
          console.log(listing.reviews);
        if (listing.reviews && listing.reviews.length > 0) {
          const listingReviews = await Promise.all(
            listing.reviews.map(async (reviewId) => {
                console.log(reviewId);
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
        console.log(listingReviews);
          const filteredReviews = listingReviews.filter((r): r is Review => r !== null);
          if (filteredReviews.length > 0) {
            newReviews[listing.id] = filteredReviews;
          }
          setReviews(filteredReviews); 
        }
      
        }
      } catch (error) {
        console.error('Error fetching listing details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListingDetails();
  }, [id]);

  const handleImageChange = (direction: 'prev' | 'next') => {
    if (!listing) return;
    
    if (direction === 'prev') {
      setCurrentImageIndex(prev => 
        prev === 0 ? listing.images.length - 1 : prev - 1
      );
    } else {
      setCurrentImageIndex(prev => 
        prev === listing.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleOpenImage = (image: string) => {
    setSelectedImage(image);
    setOpenImageModal(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!listing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        Listing not found
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="center">
        <SingleListing
          listing={listing}
          reviews={reviews}
          landlordName={landlordName}
          currentImageIndex={currentImageIndex}
          onImageChange={handleImageChange}
          onOpenImage={handleOpenImage}
        />
      </Box>

      {/* Image Modal */}
      <Modal
        open={openImageModal}
        onClose={() => setOpenImageModal(false)}
        aria-labelledby="image-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src={selectedImage}
          alt="Enlarged view"
          sx={{
            maxHeight: '90vh',
            maxWidth: '90vw',
            objectFit: 'contain',
          }}
          onClick={() => setOpenImageModal(false)}
        />
      </Modal>
    </Container>
  );
};

export default ListingDetails;
