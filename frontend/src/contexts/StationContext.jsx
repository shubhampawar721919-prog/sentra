import { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';

const StationContext = createContext();

export function StationProvider({ children }) {
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStations();
    }, []);

    const fetchStations = async () => {
        try {
            const res = await client.get('/stations');
            if (res.data.success) {
                setStations(res.data.data);
                if (res.data.data.length > 0) {
                    setSelectedStation(res.data.data[0]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch stations", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <StationContext.Provider value={{ stations, selectedStation, setSelectedStation, loading }}>
            {children}
        </StationContext.Provider>
    );
}

export const useStation = () => useContext(StationContext);
