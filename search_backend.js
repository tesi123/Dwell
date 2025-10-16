import express from "express";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, limit, startAfter } from "firebase/firestore";
import { getAuth } from "firebase/auth";
//import { app } from "../database/firebase";
import { db } from "../database/firebase";
//const firebase = require('firebase');
const Expressapp = express();
//Middleware
Expressapp.use(express.json());

// API Endpoint
Expressapp.post("/api/search", async (req, res) => {
  const filters = req.body;
  try {
    const results = await searchProperties(filters);
    res.json({ properties: results.properties });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Function to search for properties
const searchProperties = async ({
  zipCode,
  rating,
  city,
  street,
  landlordUid,
  bedrooms,
  pricePerNight,
  resultsPerPage = 5,
  currentPage = 1
}) => {
  try {
    // Get a reference to the Firestore collection
    //const listingsRef = firebase.firestore().collection("listings");
    const listingsRef = collection(db, "listings");


    // Build query based on search parameters
    let query = listingsRef;

    let queryConstraints = [];

    if (rating) {
      queryConstraints.push(where("rating", "==", rating)); // Filter by rating
    }

    if (zipCode) {
      queryConstraints.push(where("zipCode", "==", zipCode)); // Filter by zip code
    }

    if (city) {
      queryConstraints.push(where("address.city", "==", city)); // Filter by city
    }

    if (street) {
      queryConstraints.push(where("address.street", "==", street)); // Filter by street
    }

    if (landlordUid) {
      queryConstraints.push(where("landlordUid", "==", landlordUid)); // Filter by landlord ID
    }

    if (bedrooms) {
      queryConstraints.push(where("bedrooms", ">=", bedrooms)); // Filter by landlord ID
    }

    if (pricePerNight) {
      queryConstraints.push(where("pricePerNight", ">=", pricePerNight)); // Filter by landlord ID
    }
    

    // Pagination handling: Add limit and startAfter if a cursor is provided
    queryConstraints.push(limit(resultsPerPage));
    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    }

    // Build the final query
    const finalQuery = query(listingsRef, ...queryConstraints);

   // Fetch results from Firestore
   const querySnapshot = await getDocs(finalQuery);

    // Process the query results
    const properties = [];
    querySnapshot.forEach((doc) => {
      properties.push({ id: doc.id, ...doc.data() });
    });

    return {
      message: properties.length > 0 ? "Properties found" : "Property not found.",
      properties,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1], // Cursor for next page
    };
  } catch (error) {
    console.error("Error fetching properties:", error);
    return { message: "Error occurred during search", error: error };
  }
};