import { createContext, useEffect, useState } from "react";
import { auth, db } from "./database/firebase.ts";
import { onAuthStateChanged } from "firebase/auth";
import { User } from "./libraries/User.ts";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext<{ user: User | null}>({ user: null });

import { ReactNode } from "react";

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // transform user object to User instance
        let uid = user?.uid;
        // query user data from Firestore
        let loaded = false;
        while (!loaded) {
          let data = await getDoc(doc(db, "users", uid)).then((doc) => doc.data());
          if (data) {
            let loggedInUser = new User(
              data.firstName,
              data.middleInitial,
              data.lastName,
              data.username,
              data.email,
              {
                street: data.address.street,
                city: data.address.city,
                state: data.address.state,
                zip: data.address.zip
              },
              data.dlNumber,
              {
                number: data.creditCard.number,
                expirationDate: data.creditCard.expirationDate,
                cvv: data.creditCard.cvv
              },
              uid,
              data.role,
              data.roleid
            )
            setUser(loggedInUser);
            loaded = true;
          }
        }
      } else {
        setUser(null);
      }
    }); // Cleanup on unmount
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
