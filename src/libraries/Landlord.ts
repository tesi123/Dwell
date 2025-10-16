import { updateDoc, doc, getDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../database/firebase.ts";
import { Listing } from './Listing';



export class Landlord {
    uid: string;
    roleid: string;
    listings: string[];

    constructor(
        uid: string,
        listings: string[] = [],
        roleid: string
    ) {
        this.uid = uid;
        this.roleid = roleid;
        this.listings = listings;
    }

    addProperty(property: Listing | string) {
        if (typeof property === 'string') {
            this.listings.push(property);
        } else {
            this.listings.push(property.id);
        }
    }

    removeProperty(property: Listing) {
        const index = this.listings.indexOf(property.id);
        if (index > -1) {
            this.listings.splice(index, 1);
        }
        property.deleteListing()
    }

    getRating(property: Listing): number {
        return property.rating;
    }

    toPlainObject() {
        return {
            landlordid: this.roleid,
            listings: this.listings,
            userid: this.uid,
        };
    }

    async updateLandlord() {
        const landlordRef = doc(db, "landlords", this.roleid);
        try {
            await updateDoc(landlordRef, this.toPlainObject());
            console.log("Landlord updated successfully");
        } catch (error) {
            console.error("Error updating landlord: ", error);
        }
    }

    async createLandlord() {
        try {
            // Create a new document with auto-generated ID
            const docRef = await addDoc(collection(db, "landlords"), {});

            // Set the roleid to the new document's ID
            this.roleid = docRef.id;

            // Update the document with complete landlord data
            await updateDoc(docRef, this.toPlainObject());
            
            console.log("Landlord created successfully with ID: ", this.roleid);
            return this.roleid;
        } catch (error) {
            console.error("Error creating landlord: ", error);
            throw error;
        }
    }
}