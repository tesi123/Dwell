import { updateDoc, doc, setDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../database/firebase.ts";
import { Timestamp } from "firebase/firestore";

export enum ReservationStatus {
    Future = "Future",
    Cancelled = "Cancelled",
    Ongoing = "Ongoing",
    Finished = "Finished"
}

export class Reservation {
    reservationId: string;
    status: ReservationStatus;
    tenantId: string;
    startDate: Date;
    endDate: Date;
    listingId: string;
    totalPrice: number;

    constructor(
        reservationId: string,
        status: ReservationStatus,
        tenantId: string,
        startDate: Date,
        endDate: Date,
        listingId: string,
        totalPrice: number
    ) {
        this.reservationId = reservationId;
        this.status = status;
        this.tenantId = tenantId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.listingId = listingId;
        this.totalPrice = totalPrice;
    }

    toPlainObject() {
        return {
            reservationId: this.reservationId,
            status: this.status.valueOf(),
            tenantId: this.tenantId,
            startDate: Timestamp.fromDate(this.startDate),
            endDate: Timestamp.fromDate(this.endDate),
            listingId: this.listingId,
            totalPrice: this.totalPrice,
        };
    }
    
    async updateReservation() {
        const reservationRef = doc(db, "reservations", this.reservationId);
        try {
            await updateDoc(reservationRef, this.toPlainObject());
            console.log("Reservation updated successfully");
        } catch (error) {
            console.error("Error updating reservation: ", error);
        }
    }

    cancelReservation(): number {
        const now = new Date();
        const timeDiff = this.startDate.getTime() - now.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);

        if (daysDiff < 5) {
            return -1;
        }

        this.status = ReservationStatus.Cancelled;
        const refundAmount = this.totalPrice * 0.97;

        this.updateReservation().catch(error => {
            console.error("Error updating reservation status to cancelled: ", error);
            return -1;
        });

        return refundAmount;
    }

    async createReservation() {
        try {
            // Create a new document with auto-generated ID
            const docRef = await addDoc(collection(db, "reservations"), {});

            // Set the reservation's ID to the new document's ID
            this.reservationId = docRef.id;

            // Update the document with complete reservation data
            await updateDoc(docRef, this.toPlainObject());
            
            console.log("Reservation created successfully with ID: ", this.reservationId);
            return this.reservationId;
        } catch (error) {
            console.error("Error creating reservation: ", error);
            throw error;
        }
    }
}
