// Lets create an instnace of axios that we can use throughout our app
import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001/api/',
  withCredentials: true, // we want to send cookies in our every single request
});