import { refreshToken } from "./refreshToken";

export const checkToken = async () => {
  
  const date = localStorage.getItem("date");

  if (!date) {
    console.log("No expiration date found. Token check skipped. Please make sure you Login with Spotify before using the app!");
    return null;
  }

  const currDate = Math.floor(Date.now() / 1000);

  // If the token has expired
  if (currDate >= parseInt(date)) {
    const refreshtoken = localStorage.getItem("refresh_token");

    if (refreshtoken) {
      try {
        const newAccessToken = await refreshToken(refreshtoken);

        console.log("Access token refreshed:", newAccessToken);
        return newAccessToken;
      } catch (error) {
        console.log("Something went wrong with refresh token!", error);
        return null;
      }
    } else {
      console.log("No refresh token available.");
      return null;
    }
  } else {
    // Token is still valid
    console.log("This should print!");
    const accessToken = localStorage.getItem("access_token");
    console.log("Token is valid:", accessToken);
    return accessToken;
  }
};
