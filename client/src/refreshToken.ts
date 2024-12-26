export const refreshToken = async (refresh_token: string) => {
  const refreshtoken = localStorage.getItem("refresh_token");

  return fetch("http://localhost:8080/auth/refresh-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshtoken }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      // Assuming the response contains `access_token` and optionally a new `refresh_token`
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      return data.access_token; // Return the new access token for further use
    })
    .catch((error) => {
      console.error("Error refreshing token:", error);
      throw error;
    });
};
