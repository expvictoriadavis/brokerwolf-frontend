import axios from "axios";

const api = axios.create({
  baseURL: "https://brokerwolf-backend.onrender.com",
});

export default api;
