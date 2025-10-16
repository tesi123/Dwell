import { updateDoc, deleteDoc, doc, setDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../database/firebase.ts";

export class Review {
    reviewId: string;
    userId: string;
    anonymousFlag: boolean;
    images: string[];
    title: string;
    rating: number;
    comment: string;

    constructor(
        reviewId: string,
        userId: string,
        anonymousFlag: boolean,
        images: string[],
        title: string,
        rating: number,
        comment: string
    ) {
        this.reviewId = reviewId;
        this.userId = userId;
        this.anonymousFlag = anonymousFlag;
        this.images = images;
        this.title = title;
        this.rating = rating;
        this.comment = comment;
    }

    toPlainObject() {
        return {
            reviewId: this.reviewId,
            userId: this.userId,
            anonymousFlag: this.anonymousFlag,
            images: this.images,
            title: this.title,
            rating: this.rating,
            comment: this.comment,
        };
    }

    async updateReview() {
        const reviewRef = doc(db, "reviews", this.reviewId);
        try {
            await updateDoc(reviewRef, this.toPlainObject());
            console.log("Review updated successfully");
        } catch (error) {
            console.error("Error updating review: ", error);
        }
    }

    async deleteReview() {
        const reviewRef = doc(db, "reviews", this.reviewId);
        try {
            await deleteDoc(reviewRef);
            console.log("Review deleted successfully");
        } catch (error) {
            console.error("Error deleting review: ", error);
        }
    }

    async createReview() {
        try {
            // Create a new document with auto-generated ID
            const docRef = await addDoc(collection(db, "reviews"), {});

            // Set the review's ID to the new document's ID
            this.reviewId = docRef.id;

            // Update the document with complete review data
            await updateDoc(docRef, this.toPlainObject());
            
            console.log("Review created successfully with ID: ", this.reviewId);
            return this.reviewId;
        } catch (error) {
            console.error("Error creating review: ", error);
            throw error;
        }
    }
}

