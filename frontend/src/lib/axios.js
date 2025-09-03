// Lets create an instnace of axios that we can use throughout our app
import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001/api/',
});

export const setAccessToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

export const clearAccessToken = () => {
  delete axiosInstance.defaults.headers.common['Authorization'];
};