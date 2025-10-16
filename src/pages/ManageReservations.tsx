import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { doc, getDoc } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext.tsx";
import ReviewFormPopup from "../components/ReviewFormPopup.tsx";
import { db } from "../database/firebase";
import {differenceInDays} from "date-fns";
import { Reservation } from "../libraries/Reservation";

const ManageReservations = () => {
  const [reservations, setReservations] = useState<[Reservation, string][]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null,
  );

  const openReviewForm = (listingId: string) => {
    setSelectedListingId(listingId);
    setIsReviewFormOpen(true);
  };

  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) return;

      try {
        const tenantDoc = await getDoc(doc(db, "tenants", user.roleid));
        const tenantData = tenantDoc.data();
        if (!tenantData || !tenantData.reservations) return;

        const reservationPromises = tenantData.reservations.map(
          async (reservationId: string) => {
            const reservationDoc = await getDoc(
              doc(db, "reservations", reservationId),
            );
            const reservationData = reservationDoc.data();
            if (reservationData) {
              const listingDoc = await getDoc(
                doc(db, "listings", reservationData.listingId),
              );
              const listingData = listingDoc.data();
              const firstImage: string = listingData?.images?.[0] || "";
              if (differenceInDays(Date(), reservationData.endDate.toDate()) < 730) {
              return [
                {
                  ...new Reservation(
                    reservationData.reservationId,
                    reservationData.status,
                    reservationData.tenantId,
                    reservationData.startDate.toDate(),
                    reservationData.endDate.toDate(),
                    reservationData.listingId,
                    reservationData.totalPrice,
                  ),
                },
                firstImage,
              ];
            }
            }
          },
        );

        const reservations = await Promise.all(reservationPromises);
        setReservations(reservations.filter(Boolean));
      } catch (error) {
        console.error("Error fetching reservations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [user]);

  const handleCancel = (reservationId: string) => {
    navigate(`/cancel-reservation?id=${reservationId}`);
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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        alignItems: "center",
        mt: 2,
      }}
    >
      {reservations.length === 0 ? (
        <Typography
          variant="h6"
          color="textSecondary"
          align="center"
          sx={{ display: "flex", alignItems: "center", height: "80vh" }}
        >
          You don't have any reservations.
        </Typography>
      ) : (
        reservations.map((reservation) => {
          const reservationData = reservation[0];
          const reservationPopupImageId = reservation[1];

          const canCancel =
            (reservationData.startDate.getTime() - new Date().getTime()) /
              (1000 * 3600 * 24) >=
              5 && reservationData.status != "Cancelled";
          const canReview = reservationData.status != "Future";
          return (
            <Card
              key={reservationData.reservationId}
              sx={{
                maxWidth: 800,
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                height: 250,
              }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="h6">
                  Reservation ID: {reservationData.reservationId}
                </Typography>
                <Typography>Status: {reservationData.status}</Typography>
                <Typography>
                  Start Date: {reservationData.startDate.toDateString()}
                </Typography>
                <Typography>
                  End Date: {reservationData.endDate.toDateString()}
                </Typography>
                <Typography>
                  Total Price: ${reservationData.totalPrice.toFixed(2)}
                </Typography>
                <div className="">
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => openReviewForm(reservationData.listingId)}
                    disabled={!canReview}
                  >
                    Review
                  </Button>

                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{ mt: 2, ml: 2 }}
                    onClick={() => handleCancel(reservationData.reservationId)}
                    disabled={!canCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
              <Box
                sx={{
                  width: 230,
                  height: 250,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mr: 2,
                  position: "relative",
                }}
              >
                <CardMedia
                  component="img"
                  src={reservationPopupImageId}
                  alt="Enlarged Image"
                  sx={{
                    width: "100%",
                    height: "90%",
                    objectFit: "cover",
                    borderRadius: 1,
                  }}
                />
              </Box>
            </Card>
          );
        })
      )}
      <ReviewFormPopup
        listingId={selectedListingId || ""}
        isModalOpen={isReviewFormOpen}
        closeModal={() => setIsReviewFormOpen(false)}
      />
    </Box>
  );
};

export default ManageReservations;
