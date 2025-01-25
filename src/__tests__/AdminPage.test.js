import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminPage from '../pages/adminPage';
import { supabase } from '../utils/supabaseClient';
import { act } from 'react';
import '@testing-library/jest-dom/extend-expect';

// Mocking Supabase client
jest.mock('../utils/supabaseClient', () => ({
    supabase: {
        auth: {
            signInWithPassword: jest.fn(),
            signOut: jest.fn()
        },
        from: jest.fn((table) => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            then: jest.fn(),
            data: [],
            error: null
        }))
    },
}));

const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

// Before each test, clear prev mocks and set up mock return values
beforeEach(() => {
    jest.clearAllMocks();
    supabase.from.mockImplementation((table) => {
        if (table === 'campuses') {
            return {
                select: jest.fn().mockResolvedValue({
                    data: [
                        { id: 1, name: 'Campus 1' },
                        { id: 2, name: 'Campus 2' },
                    ],
                    error: null,
                }),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
            };
        }
        return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            then: jest.fn(),
            data: [],
            error: null,
        };
    });

    // Mock auth sign out success
    supabase.auth.signOut.mockResolvedValue({ error: null });
});

// AdminPage Tests
describe('AdminPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders Home section by default', async () => {
        await act(async () => {
            renderWithRouter(<AdminPage />);
        });
        expect(screen.getByRole('button', { name: /Loading.../i })).toBeInTheDocument();
    });

    test('switches to Campuses section', async () => {
        await act(async () => {
            renderWithRouter(<AdminPage />);
        });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Campuses/i }));
        });
        expect(screen.getByText(/Add Campus/i)).toBeInTheDocument();
    });

    test('switches to Courses section', async () => {
        await act(async () => {
            renderWithRouter(<AdminPage />);
        });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Courses/i }));
        });
        expect(screen.getByText(/Add Course/i)).toBeInTheDocument();
    });

    test('switches to Units section', async () => {
        await act(async () => {
            renderWithRouter(<AdminPage />);
        });

        await act(async () => {
            fireEvent.click(screen.getByText(/Units/i));
        });

        expect(screen.getByText(/Add Unit/i)).toBeInTheDocument();
    });

    test('switches to Classrooms section', async () => {
        await act(async () => {
            renderWithRouter(<AdminPage />);
        });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Classrooms/i }));
        });
        expect(screen.getByText(/Add Classroom/i)).toBeInTheDocument();
    });

    test('switches to Students section', async () => {
        await act(async () => {
            renderWithRouter(<AdminPage />);
        });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Students/i }));
        });
        expect(screen.getByText(/Add Student/i)).toBeInTheDocument();
    });

    test('switches to Staff section', async () => {
        await act(async () => {
            renderWithRouter(<AdminPage />);
        });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Staff/i }));
        });
        expect(screen.getByText(/Add Staff/i)).toBeInTheDocument();
    });

    // Signing out
    test('handles sign out', async () => {
        await act(async () => {
            renderWithRouter(<AdminPage />);
        });

        await act(async () => {
            fireEvent.click(screen.getByText(/SIGN OUT/i));
        });

        expect(supabase.auth.signOut).toHaveBeenCalled();
    });
});
