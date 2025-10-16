import { updateDoc, doc } from "firebase/firestore";
import { db } from "../database/firebase.ts";

// Address interface to define the structure of an address
export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface BillingInformation {
  number: string;
  expirationDate: string;
  cvv: string;
}

export class User {
  firstName: string;
  middleInitial: string;
  lastName: string;
  username: string;
  email: string;
  address: Address;
  dlNumber: string;
  billing: BillingInformation;
  uid: string;
  role: string;
  roleid: string;

  constructor(
    firstName: string,
    middleInitial: string,
    lastName: string,
    username: string,
    email: string,
    address: Address,
    dlNumber: string,
    billing: BillingInformation,
    uid: string,
    role: string,
    roleid: string,
  ) {
    this.firstName = firstName;
    this.middleInitial = middleInitial;
    this.lastName = lastName;
    this.username = username;
    this.email = email;
    this.address = address;
    this.dlNumber = dlNumber;
    this.billing = billing;
    this.uid = uid;
    this.role = role;
    this.roleid = roleid;
  }

  /**
   * Converts the User instance to a plain object.
   * Useful for Firestore or other JSON-based operations.
   */
  toPlainObject() {
    return {
      firstName: this.firstName,
      middleInitial: this.middleInitial,
      lastName: this.lastName,
      username: this.username,
      email: this.email,
      address: this.address,
      dlNumber: this.dlNumber,
      billing: this.billing,
      role: this.role,
      roleid: this.roleid,
    };
  }

  /**
   * Updates the user document in Firestore.
   * @throws Error if the update operation fails.
   */
  async updateUser(): Promise<void> {
    try {
      const userDocRef = doc(db, "users", this.uid); // Reference to the user document
      await updateDoc(userDocRef, this.toPlainObject());
    } catch (error) {
      console.error("Failed to update user:", error);
      throw new Error("Failed to update user: " + error);
    }
  }
}
