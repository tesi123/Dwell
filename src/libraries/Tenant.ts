import { updateDoc, doc, addDoc, collection } from "firebase/firestore";
import { db } from "../database/firebase.ts";
import { Listing } from './Listing';
import { Reservation, ReservationStatus } from "./Reservation";



export class Tenant {
    userid: string;
    roleid: string;
    reservations: string[];

    constructor(
        userid: string,
        reservations: string[] = [],
        roleid: string
    ) {
        this.userid = userid;
        this.roleid = roleid;
        this.reservations = reservations;
    }

    async rentProperty(property: Listing, startDate: Date, endDate: Date): Promise<void> {
        console.log(`Renting property ${property.id} from ${startDate} to ${endDate}`);

        // Need to add reservation to listing
        const price = property.pricePerNight * ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const new_res = new Reservation("", ReservationStatus.Future, this.roleid, startDate, endDate, property.id, price);
        await new_res.createReservation();
        property.addReservation(new_res);
        this.reservations.push(new_res.reservationId);      
        await this.updateTenant();  
    }

    viewHistory(): string[] {
        // Boilerplate implementation
        console.log(`Viewing history for tenant ${this.roleid}`);
        return this.reservations;
    }

    toPlainObject() {
        return {
            userid: this.userid,
            roleid: this.roleid,
            reservations: this.reservations,
        };
    }

    async updateTenant() {
        const tenantRef = doc(db, "tenants", this.roleid);
        try {
            await updateDoc(tenantRef, this.toPlainObject());
            console.log("Tenant updated successfully");
        } catch (error) {
            console.error("Error updating tenant: ", error);
        }
    }

    async createTenant() {
        try {
            // Create a new document with auto-generated ID
            const docRef = await addDoc(collection(db, "tenants"), {});

            // Set the roleid to the new document's ID
            this.roleid = docRef.id;

            // Update the document with complete tenant data
            await updateDoc(docRef, this.toPlainObject());
            
            console.log("Tenant created successfully with ID: ", this.roleid);
            return this.roleid;
        } catch (error) {
            console.error("Error creating tenant: ", error);
            throw error;
        }
    }
}