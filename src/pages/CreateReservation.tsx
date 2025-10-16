import React, { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from "../database/firebase";
import { Reservation } from "../libraries/Reservation";
import { Listing } from "../libraries/Listing";
import { Tenant } from "../libraries/Tenant";
import { Button, Box, Typography } from '@mui/material';
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { AuthContext } from "../AuthContext.tsx";
import { differenceInDays, addDays } from "date-fns";
import CircularProgress from "@mui/material/CircularProgress";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

const CreateReservation: React.FC = () => {
  const listingId = useParams<{ listingId: string }>().listingId as string;
  const [listing, setListing] = useState<Listing | null>(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) return;

      try {
        const listingDoc = await getDoc(doc(db, "listings", listingId));
        const listingRef = listingDoc.data();

        if (!listingRef) {
          console.error("Error retrieving listing data.");
          return;
        }

        console.log("Listing id:", listingRef.listingId);

        // Create Listing object
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

        setListing(listing);

        // Makes list of all current reservations for a given listing
        const reservationPromises = listingRef.reservations.map(async (reservationId: string) => {
          const reservationDoc = await getDoc(doc(db, "reservations", reservationId));
          const reservationData = reservationDoc.data();
          if (reservationData) {
            const firstImage: string = listingRef?.images?.[0] || "";

            return [{
              ...new Reservation(
                reservationData.reservationId,
                reservationData.status,
                reservationData.tenantId,
                reservationData.startDate.toDate(),
                reservationData.endDate.toDate(),
                reservationData.listingId,
                reservationData.totalPrice
              ),
            }, firstImage];
          }
        });

        const reservations = await Promise.all(reservationPromises);
        setReservations(reservations);
      } catch (error) {
        console.error("Error fetching reservations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [user]);

  const handleChange = (field: string, value: Date | null) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Makes sure the dates have no conflict and are also valid
  const validateForm = () => {
    const errors: string[] = [];
    if (!form.startDate) errors.push("Start Date is required.");
    if (!form.endDate) errors.push("End Date is required.");
    const newStart = form.startDate;
    const newEnd = form.endDate;

    if (newStart && newEnd && newStart >= newEnd) {
      errors.push("Check-in date must be before the check-out date.");
    }

    for (const reservation of reservations) {
      const existingStart = new Date(reservation.startDate);
      const existingEnd = new Date(reservation.endDate);

      if (
        (newStart && newStart >= existingStart && newStart < existingEnd) || // Overlaps start
        (newEnd && newEnd > existingStart && newEnd <= existingEnd) ||     // Overlaps end
        (newStart && newEnd && newStart <= existingStart && newEnd >= existingEnd)     // Completely overlaps
      ) {
        errors.push(`Reservation conflicts with existing reservation from ${reservation.startDate} to ${reservation.endDate}.`);
      }
    }
    return errors;
  }

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    if (!listing || !listing.pricePerNight) {
      alert("Listing data is missing or incomplete");
      return;
    }

    try {
      if (!user) throw new Error("User is null");
      const tenantData = await getDoc(doc(db, "tenants", user.roleid)).then((doc) => doc.data());
      if (!tenantData) {
        throw new Error("Tenant is undefined.")
      }
      let curTenant = new Tenant(
        tenantData.userid,
        tenantData.reservations,
        tenantData.roleid
      );
      console.log(listing);
      console.log(curTenant);
      await curTenant.rentProperty(listing, new Date(form.startDate), new Date(form.endDate))
      navigate(`/manage-reservations`);
    }
    catch (error) {
      console.error("Error creating reservation:", error);
      alert("Failed to create reservation.");
    }
  }

  if (loading || !user || user.role != "tenant") {
    return <Box
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
    </Box>;
  }

  // Calculate the number of nights (difference in days)
  const startDate = form.startDate;
  const endDate = form.endDate;
  const numberOfNights = startDate && endDate ? differenceInDays(endDate, startDate) : 0;
  const totalPrice = listing?.pricePerNight && numberOfNights > 0
    ? listing.pricePerNight * numberOfNights
    : 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div style={styles.container}>
        <h2 style={styles.title}>Reserve Your Stay</h2>

        {listing ? (
          <div style={styles.listingDetails}>
            <div style={styles.listingText}>
              <h3 style={styles.listingName}>{listing.name}</h3>
              <p style={styles.listingDescription}>{listing.description}</p>
              <p>
                <strong>Price Per Night:</strong> ${listing.pricePerNight}
              </p>
            </div>
            {listing.images && listing.images.length > 0 && (
              <img
                src={listing.images[0]}
                alt="Listing"
                style={styles.listingImage}
              />
            )}
          </div>
        ) : (
          <p>Loading listing details...</p>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Start Date:</label>
            <DatePicker
              value={form.startDate}
              onChange={(date) => handleChange("startDate", date)}
              minDate={addDays(new Date(), 1)}
              renderInput={(params) => (
                <input {...params} style={styles.input} />
              )}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>End Date:</label>
            <DatePicker
              value={form.endDate}
              onChange={(date) => handleChange("endDate", date)}
              minDate={form.startDate ? addDays(form.startDate, 1) : addDays(new Date(), 2)}
              renderInput={(params) => (
                <input {...params} style={styles.input} />
              )}
            />
          </div>

          <div style={styles.summary}>
            <p>
              <strong>Total Price:</strong>{" "}
              {totalPrice > 0 ? `$${totalPrice}` : "Please select valid dates"}
            </p>
            <p>
              <strong>Card on File:</strong>{" "}
              {user.billing.number ? (
                <code>
                  &#8226;&#8226;&#8226;&#8226; &#8226;&#8226;&#8226;&#8226;
                  &#8226;&#8226;&#8226;&#8226; {user.billing.number.slice(-4)}
                </code>
              ) : (
                "No card available"
              )}
            </p>
          </div>

          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Confirm Reservation
          </Button>
        </form>
      </div>
    </LocalizationProvider>
  );
};

const styles = {
  container: {
    height: "--calc(100vh - 64px)",
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    textAlign: "center" as "center",
    marginBottom: "20px",
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
  },
  listingDetails: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    padding: "15px",
    borderRadius: "5px",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  listingText: {
    flex: 1,
  },
  listingImage: {
    width: "150px",
    height: "150px",
    objectFit: "cover",
    borderRadius: "5px",
    marginLeft: "20px",
  },
  listingName: {
    marginBottom: "5px",
  },
  listingDescription: {
    color: "#555",
  },
  form: {
    display: "flex",
    flexDirection: "column" as "column",
    gap: "15px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as "column",
  },
  label: {
    marginBottom: "5px",
    fontWeight: "bold",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    borderRadius: "5px",
    border: "1px solid #ddd",
  },
  summary: {
    marginTop: "20px",
    fontSize: "16px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default CreateReservation;