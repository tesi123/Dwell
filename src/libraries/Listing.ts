import { addDoc, collection, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../database/firebase.ts";
import { Reservation } from './Reservation.ts';
import { Review } from './Review.ts';
import { Address } from './User';


export class Listing {
    id: string;
    name: string;
    description: string;
    images: string[];
    rating: number;
    reviews: string[];
    zipCode: string;
    address: Address;
    landlordUid: string;
    reservations: string[];
    bathrooms: number;
    bedrooms: number;
    pricePerNight: number;

    constructor(
        id: string,
        name: string,
        description: string,
        images: string[],
        rating: number,
        reviews: string[] = [],
        zipCode: string,
        address: Address,
        landlordUid: string,
        reservations: string[],
        bathrooms: number,
        bedrooms: number,
        pricePerNight: number
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.images = images;
        this.rating = rating;
        this.reviews = reviews || [];
        this.zipCode = zipCode;
        this.address = address;
        this.landlordUid = landlordUid;
        this.reservations = reservations;
        this.bathrooms = bathrooms;
        this.bedrooms = bedrooms;
        this.pricePerNight = pricePerNight;
    }

    addReview(review: Review) {
        if (!review) {
            console.error("Invalid review.");
            return;
        }

        if (!review.reviewId) {
            console.error("Invalid review ID: ", review.reviewId);
            return;
        }
        
        this.reviews.push(review.reviewId);
        this.updateRating();
        this.updateListing();
    }
    
    private async updateRating() {
        let total = 0;
        for (const reviewId of this.reviews) {
            const reviewRef = doc(db, "reviews", reviewId);
            const ratingRef = await getDoc(reviewRef);
            const reviewData = ratingRef.data();
            if (reviewData) {
                total += reviewData.rating;
            } else {
                console.error("Error fetching review data: ", reviewId);
            }
        }
        this.rating = total / this.reviews.length
    }

    public addReservation(reservation: any) {
        this.reservations.push(reservation.reservationId);
        this.updateListing();
    }

    toPlainObject() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            images: this.images,
            rating: this.rating,
            reviews: this.reviews,
            zipCode: this.zipCode,
            address: this.address,
            landlordUid: this.landlordUid,
        };
    }

    async updateListing() {
        const listingRef = doc(db, "listings", this.id);
        try {
            await updateDoc(listingRef, this.toPlainObject());
            console.log("Listing updated successfully");
        } catch (error) {
            console.error("Error updating listing: ", error);
        }
    }

    async deleteListing() {
        const listingRef = doc(db, "listings", this.id);
        try {
            await deleteDoc(listingRef);
            console.log("Listing deleted successfully");
        } catch (error) {
            console.error("Error deleting listing: ", error);
        }
    }

    async createListing() {
        try {
            // Create a new document with auto-generated ID
            const docRef = await addDoc(collection(db, "listings"), {});

            // Set the listing's ID to the new document's ID
            this.id = docRef.id;

            // Update the document with complete listing data
            await updateDoc(docRef, this.toPlainObject());
            
            console.log("Listing created successfully with ID: ", this.id);
            return this.id;
        } catch (error) {
            console.error("Error creating listing: ", error);
            throw error;
        }
    }
}
