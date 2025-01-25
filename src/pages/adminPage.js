import React, { useState } from 'react';
import { Home, School, BookCopy, BookOpenText, User, Presentation, Users, Settings, MessageSquareMore } from 'lucide-react';
import CampusComponent from '../components/admin/campusComponent';
import SignupPage from './signupPage';
import CourseComponent from '../components/admin/courseComponent';
import CourseFilterComponent from '../components/admin/courseFilterComponent';
import StudentComponent from '../components/admin/studentComponent';
import StudentFilterComponent from '../components/admin/studentFilterComponent';
import TimetableComponent from '../components/timetable/timetableComponent';
import TimetableFilterComponent from '../components/timetable/timetableFilterComponent';
import ClassComponent from '../components/admin/classComponent';
import StaffComponent from '../components/admin/staffComponent';
import SubjectComponent from '../components/admin/subjectComponent';
import SubjectFilterComponent from '../components/admin/subjectFilterComponent';
import GPTAssist from '../components/admin/gptAssist';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import '../styles/adminPage.css';
import '../styles/filterComponent.css';
import '../styles/timetablePage.css';
import VITLogo from '../assets/VIT_White.png';

/**
 * AdminPage - The main page component for the admin dashboard.
 * Manages the state of the active tab, applies filters, and displays content.
 */
const AdminPage = () => {
    // State hooks
    const [activeTab, setActiveTab] = useState('home'); // Active tab for sidebar
    const [timetableFilters, setTimetableFilters] = useState({ campusId: null, courseId: null });
    const [courseFilters, setCourseFilters] = useState({ campusId: null, courseId: null });
    const [studentFilters, setStudentFilters] = useState({ campusId: null, courseId: null });
    const [subjectFilters, setSubjectFilters] = useState({ campusId: null, courseId: null, unitId: null });
    const navigate = useNavigate();

    /**
     * handleSignOut - Signs out the user and redirects to the home page.
     */
    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error.message);
        } else {
            navigate('/');
        }
    };

    /**
     * Filter handlers - Update the filters for various sections.
     */
    const handleTimetableFilterChange = (filters) => setTimetableFilters(filters);
    const handleCourseFilterChange = (filters) => setCourseFilters(filters);
    const handleSubjectFilterChange = (filters) => setSubjectFilters(filters);
    const handleStudentFilterChange = (filters) => setStudentFilters(filters);

    /**
     * renderContent - Conditionally renders the main content based on activeTab.
     * @returns {JSX.Element} - Component for the selected tab.
     */
    const renderContent = () => {
        switch (activeTab) {
            case 'campuses':
                return <CampusComponent />;
            case 'courses':
                return <CourseComponent filters={courseFilters} />;
            case 'units':
                return <SubjectComponent filters={subjectFilters} />;
            case 'students':
                return <StudentComponent filters={studentFilters} />;
            case 'staff':
                return <StaffComponent />;
            case 'classrooms':
                return <ClassComponent />;
            case 'home':
                return <TimetableComponent filters={timetableFilters} />;
            case 'assistant':
                return <GPTAssist />;
            default:
                return null;
        }
    };

    /**
     * renderSidebar - Renders the sidebar filters based on activeTab.
     * @returns {JSX.Element} - The sidebar filter component.
     */
    const renderSidebar = () => {
        if (activeTab === 'home') {
            return <TimetableFilterComponent onFilterChange={handleTimetableFilterChange} />;
        }
        if (activeTab === 'assistant') {
            return null;
        }
        if (activeTab === 'courses') {
            return <CourseFilterComponent onFilterChange={handleCourseFilterChange} />;
        }
        if (activeTab === 'units') {
            return <SubjectFilterComponent onFilterChange={handleSubjectFilterChange} />;
        }
        if (activeTab === 'students') {
            return <StudentFilterComponent onFilterChange={handleStudentFilterChange} />;
        }

        // General filter UI for other tabs
        return (
            <div className='filters-border'>
                <div className="filters-title">FILTERS</div>
                <hr className="filters-divider" />
                <FilterSection label="Course Name" />
                <FilterSection label="Course ID" />
                <FilterSection label="Unit Name" />
                <FilterSection label="Unit ID" />
                <FilterSection label="Campus" />
                <hr className="filters-divider" />
                <button className="apply-button">Apply</button>
            </div>
        );
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className='admin-sidebar-wrapper'>
                <div className="admin-sidebar">
                    {/* Logo */}
                    <div className="sidebar-logo">
                        <img src={VITLogo} alt="VIT Logo" className="h-15" />
                    </div>

                    {/* Home link */}
                    <div className="nav-section">
                        <SidebarLink Icon={Home} label="Home" onClick={() => setActiveTab('home')} active={activeTab === 'home'} />
                    </div>

                    {/* Main navigation links */}
                    <nav className="flex-grow pb-5 pt-2">
                        <div className="nav-section">
                            <SidebarLink Icon={School} label="Campuses" onClick={() => setActiveTab('campuses')} active={activeTab === 'campuses'} />
                            <SidebarLink Icon={BookCopy} label="Courses" onClick={() => setActiveTab('courses')} active={activeTab === 'courses'} />
                            <SidebarLink Icon={BookOpenText} label="Units" onClick={() => setActiveTab('units')} active={activeTab === 'units'} />
                            <SidebarLink Icon={Presentation} label="Classrooms" onClick={() => setActiveTab('classrooms')} active={activeTab === 'classrooms'} />
                        </div>
                        <div className="nav-section">
                            <SidebarLink Icon={Users} label="Students" onClick={() => setActiveTab('students')} active={activeTab === 'students'} />
                            <SidebarLink Icon={User} label="Staff" onClick={() => setActiveTab('staff')} active={activeTab === 'staff'} />
                        </div>
                        <div className="nav-section">
                            <SidebarLink Icon={MessageSquareMore} label="AI Assistant" onClick={() => setActiveTab('assistant')} active={activeTab === 'assistant'} />
                            <SidebarLink 
                                Icon={Settings} 
                                label="Register" 
                                onClick={() => navigate('/signup')} // Navigate to /signup
                                active={false} 
                            />
                        </div>
                    </nav>

                    <button onClick={handleSignOut} className="signout-button">SIGN OUT</button>
                </div>
            </div>
            
            {/* Main content area */}
            <div className="main-content">
                <div className='top-nav-wrapper'>
                    <div className="top-nav">
                        <h1 className="top-nav-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                    </div>
                </div>

                <div className="flex flex-grow">
                    {/* Main content */}
                    <div className="flex-grow p-6 bg-gray-100">
                        {renderContent()}
                    </div>

                    {/* Filters sidebar */}
                    <div className="filters-sidebar">
                        {renderSidebar()}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sidebar link component
const SidebarLink = ({ Icon, label, onClick, active }) => (
    <button onClick={onClick} className={`sidebar-link ${active ? 'active' : ''}`}>
        <Icon className="sidebar-link-icon" />
        {label}
    </button>
);

// Filter section component for each filter
const FilterSection = ({ label }) => (
    <div className="filter-section">
        <label className="filter-label">{label}</label>
        <input type="text" className="filter-input" placeholder="All" />
    </div>
);

export default AdminPage;
