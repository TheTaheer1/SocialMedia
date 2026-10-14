import axios from "axios";


export const axiosInstance = axios.create({
    baseURL : `${import.meta.env.VITE_API_URL || 'http://localhost:8089'}/`,
    withCredentials : true,
    // Do not leave route guards stuck forever when the API is stopped or unreachable.
    timeout: 5000


})
