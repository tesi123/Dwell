import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../database/firebase';
import { Reservation } from '../libraries/Reservation';

export default function CancelReservation() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const reservationId = searchParams.get('id');
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [cancellationResult, setCancellationResult] = useState<{success: boolean; refundAmount?: number} | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReservation = async () => {
            if (!reservationId) {
                setError('No reservation ID provided');
                return;
            }

            try {
                const reservationDoc = await getDoc(doc(db, 'reservations', reservationId));
                if (!reservationDoc.exists()) {
                    setError('Reservation not found');
                    return;
                }

                const data = reservationDoc.data();
                
                // Check if reservation is already cancelled
                if (data.status === 'Cancelled') {
                    setError('This reservation has already been cancelled');
                    setTimeout(() => {
                        navigate('/manage-reservations');
                    }, 2000); // Redirect after 2 seconds
                    return;
                }

                const reservation = new Reservation(
                    reservationId,
                    data.status,
                    data.tenantId,
                    data.startDate.toDate(),
                    data.endDate.toDate(),
                    data.listingId,
                    data.totalPrice
                );
                setReservation(reservation);
            } catch (err) {
                setError('Error fetching reservation');
            }
        };

        fetchReservation();
    }, [reservationId, navigate]);

    const handleCancelConfirm = () => {
        if (!reservation) return;

        const refundAmount = reservation.cancelReservation();
        setConfirmOpen(false);

        if (refundAmount === -1) {
            setError('Cannot cancel reservations less than 5 days before start date');
        } else {
            setCancellationResult({ success: true, refundAmount });
        }
    };

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
                <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        {error}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/manage-reservations')} sx={{ mt: 2 }}>
                        Back to Reservations
                    </Button>
                </Paper>
            </Box>
        );
    }

    if (cancellationResult) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
                <Paper sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>
                        Reservation Cancelled Successfully
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        You will be refunded: ${cancellationResult.refundAmount?.toFixed(2)}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/manage-reservations')} sx={{ mt: 2 }}>
                        Back to Reservations
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
                <Paper sx={{ p: 4, maxWidth: 600 }}>
                    <Typography variant="h6" gutterBottom>Cancel Reservation</Typography>
                    <Typography variant="body1" gutterBottom>
                        Are you sure you want to cancel reservation: {reservationId}?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        You will receive a 97% refund if cancelled at least 5 days before the start date.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button variant="contained" color="error" onClick={() => setConfirmOpen(true)}>
                            Cancel Reservation
                        </Button>
                        <Button variant="outlined" onClick={() => navigate('/manage-reservations')}>
                            Keep Reservation
                        </Button>
                    </Box>
                </Paper>
            </Box>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirm Cancellation</DialogTitle>
                <DialogContent>
                    <Typography>Are you absolutely sure you want to cancel this reservation?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>No, Keep Reservation</Button>
                    <Button onClick={handleCancelConfirm} color="error" variant="contained">
                        Yes, Cancel Reservation
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
