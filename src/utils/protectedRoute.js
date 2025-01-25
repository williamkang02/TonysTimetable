import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const ProtectedRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            console.log('Session data:', data);
            if (data.session) {
                console.log('User is authenticated');
                setAuthenticated(true);
            } else {
                console.log('No session found');
                setAuthenticated(false);
            }
            setLoading(false);
        };
        checkSession();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!authenticated) {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;