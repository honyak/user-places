import { useState, useCallback, useEffect } from "react";

let logoutTimer;

export const useAuth = () => {
  const [token, setToken] = useState(false);
  const [tokenExpirationDate, setTokenExpirationDate] = useState();
  const [userId, setUserId] = useState(false);

  const login = useCallback((uid, token, expirationDate) => {
    setToken(token);
    setUserId(uid);
    // If the App automatically logins in the user, the existing expirationDate is used. If the login form was used manually, a new expirationDate is created and stored in localStorage.
    const expDate =
      expirationDate || new Date(new Date().getTime() + 1000 * 60 * 60); // Generate a Date object equal to the current time plus 1 hour.
    setTokenExpirationDate(expDate);
    localStorage.setItem(
      "userData",
      JSON.stringify({
        userId: uid,
        token: token,
        expiration: expDate.toISOString(), // ISOString is a type of string date format that can be converted back to Date object type.
      })
    );
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setTokenExpirationDate(null);
    setUserId(null);
    localStorage.removeItem("userData");
  }, []);

  useEffect(() => {
    if (token && tokenExpirationDate) {
      const remainingTime =
        tokenExpirationDate.getTime() - new Date().getTime();
      logoutTimer = setTimeout(logout, remainingTime); // logoutTimer is the timer ID. This timer is for the remaining time on our token expiration.
    } else {
      clearTimeout(logoutTimer);
    }
  }, [token, logout, tokenExpirationDate]);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem("userData"));
    if (
      storedData &&
      storedData.token &&
      new Date(storedData.expiration) > new Date() // if this evaluates to TRUE, then the expiration is still in the future.
    ) {
      login(
        storedData.userId,
        storedData.token,
        new Date(storedData.expiration)
      );
    }
  }, [login]); // only runs once since our login() function is wrapped in useCallback. useEffect runs AFTER the render cycle.
  // Every time a user loads the App at all (every page), this useEffect will run, and execute the login() function if the userData key exists in localStorage.
  return {
    token,
    login,
    logout,
    userId
  };
};
