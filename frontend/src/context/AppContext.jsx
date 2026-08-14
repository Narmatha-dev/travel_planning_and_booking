import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState({
    name: 'Alicia Carter',
    email: 'alicia@example.com',
    memberSince: '2024',
  });

  const [trips, setTrips] = useState([
    { id: 1, destination: 'Santorini', date: '12 Aug 2026', status: 'Confirmed' },
    { id: 2, destination: 'Bali', date: '03 Sep 2026', status: 'Planning' },
  ]);

  const value = { user, setUser, trips, setTrips };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
