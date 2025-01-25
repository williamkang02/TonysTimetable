import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

const TimetableFilterComponent = ({ onFilterChange }) => {
    const [campuses, setCampuses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCampus, setSelectedCampus] = useState('all');
    const [selectedCourse, setSelectedCourse] = useState('');

    useEffect(() => {
        fetchCampuses();
    }, []);

    // Fetch courses whenever filters change
    useEffect(() => {
        if (selectedCampus === 'all') {
            fetchCourses('all');
            setSelectedCourse('all'); // Set to 'all' when "All Campuses" selected
        } else {
            fetchCourses(selectedCampus);
            setSelectedCourse(''); // Reset course selection for specific campus
        }
    }, [selectedCampus]);

    // Function for fetching campsues from Supabase
    const fetchCampuses = async () => {
        const { data, error } = await supabase
            .from('Campuses')
            .select('id, name');
        if (error) console.error('Error fetching campuses:', error);
        else setCampuses(data);
    };

    // Fetching based on selected campus
    const fetchCourses = async (campusId) => {
        if (campusId === 'all') {
            const { data, error } = await supabase
                .from('Courses')
                .select('id, course_code');
            if (error) console.error('Error fetching all courses:', error);
            else setCourses(data);
        } else {
            const { data, error } = await supabase
                .from('Courses')
                .select('id, course_code')
                .eq('campus_id', campusId);
            if (error) console.error('Error fetching courses for campus:', error);
            else setCourses(data);
        }
    };

    // Handles campus selection change
    const handleCampusChange = (e) => {
        const campusId = e.target.value;
        setSelectedCampus(campusId);
        if (campusId === 'all') {
            setSelectedCourse('all'); // Set course to 'all' when "All Campuses" is selected
        } else {
            setSelectedCourse(''); // Reset course selection for specific campus
        }
    };

    // Handles course selection change
    const handleCourseChange = (e) => {
        const courseId = e.target.value;
        setSelectedCourse(courseId);
    };

    // Applies selected filters
    const handleApply = () => {
        onFilterChange({
            campusId: selectedCampus === 'all' ? null : selectedCampus,
            courseId: selectedCourse === 'all' ? null : selectedCourse // Treat 'all' as null for courseId
        });
    };

    // Apply button is disabled until a specific course is selected (or all - all)
    const isApplyDisabled = selectedCampus === 'all' && selectedCourse === 'all' ? false : !selectedCampus || !selectedCourse;

    return (
        <div className="filters-border">
            <div className="filters-title">Filter by course</div>
            <hr className="filters-divider" />
            <div className="filter-section">
                <label className="filter-label">Campus</label>
                <select
                    className="filter-input"
                    value={selectedCampus}
                    onChange={handleCampusChange}
                >
                    <option value="all">All Campuses</option>
                    {campuses.map(campus => (
                        <option key={campus.id} value={campus.id}>{campus.name}</option>
                    ))}
                </select>
            </div>
            <div className="filter-section">
                <label className="filter-label">Course</label>
                <select
                    className="filter-input"
                    value={selectedCourse}
                    onChange={handleCourseChange}
                    disabled={!selectedCampus} // Disable if no campus selected
                >
                    <option value="">Select Course</option> {/* Default option */}
                    {selectedCampus === 'all' ? (
                        <option value="all">All Courses</option> // Allow only All Courses for All Campuses
                    ) : (
                        courses.map(course => (
                            <option key={course.id} value={course.id}>{course.course_code}</option>
                        ))
                    )}
                </select>
            </div>
            <hr className="filters-divider" />
            <button
                className={`apply-button ${isApplyDisabled ? 'disabled' : ''}`}
                onClick={handleApply}
                disabled={isApplyDisabled}
            >
                Apply
            </button>
        </div>
    );
};

export default TimetableFilterComponent;
