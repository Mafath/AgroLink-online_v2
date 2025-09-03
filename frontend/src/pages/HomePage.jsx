import React from 'react'
import { useAuthStore } from "../store/useAuthStore";

const HomePage = () => {
  const { authUser } = useAuthStore();
  return (
    <div className="p-4 mt-16">
      {authUser && (
        <h2 className="text-2xl font-bold">Welcome to AgroLink</h2>
      )}
    </div>
  )
}

export default HomePage
