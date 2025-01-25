import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

/**
 * CourseFilterComponent - A component to filter courses by campus.
 * Allows users to select a campus and a course, then apply filters.
 * @param {function} onFilterChange - Callback to send filter values to the parent component.
 */
const CourseFilterComponent = ({ onFilterChange }) => {
    // State hooks
    const [campuses, setCampuses] = useState([]);       // List of campuses
    const [courses, setCourses] = useState([]);         // List of courses based on selected campus
    const [selectedCampus, setSelectedCampus] = useState('all'); // Selected campus filter
    const [selectedCourse, setSelectedCourse] = useState('');    // Selected course filter

    /**
     * Fetch campuses data when the component mounts.
     */
    useEffect(() => {
        fetchCampuses();
    }, []);

    /**
     * Fetch courses data whenever selectedCampus changes.
     * If 'all' is selected, fetch all courses; otherwise, fetch courses for the selected campus.
     */
    useEffect(() => {
        if (selectedCampus === 'all') {
            fetchCourses('all');
            setSelectedCourse('all');
        } else {
            fetchCourses(selectedCampus);
            setSelectedCourse('');
        }
    }, [selectedCampus]);

    /**
     * Fetch the list of campuses from Supabase.
     */
    const fetchCampuses = async () => {
        const { data, error } = await supabase
            .from('Campuses')
            .select('id, name');
        if (error) console.error('Error fetching campuses:', error);
        else setCampuses(data);
    };

    /**
     * Fetch the list of courses based on campus ID from Supabase.
     * @param {string} campusId - The ID of the selected campus.
     */
    const fetchCourses = async (campusId) => {
        let query = supabase.from('Courses').select('id, name');
        if (campusId !== 'all') {
            query = query.eq('campus_id', campusId);
        }
        const { data, error } = await query;
        if (error) console.error('Error fetching courses:', error);
        else setCourses(data);
    };

    /**
     * handleCampusChange - Updates selectedCampus when a new campus is selected.
     * @param {Event} e - Change event from campus select input.
     */
    const handleCampusChange = (e) => {
        const campusId = e.target.value;
        setSelectedCampus(campusId);
        if (campusId === 'all') {
            setSelectedCourse('all');
        } else {
            setSelectedCourse('');
        }
    };

    /**
     * handleCourseChange - Updates selectedCourse when a new course is selected.
     * @param {Event} e - Change event from course select input.
     */
    const handleCourseChange = (e) => {
        const courseId = e.target.value;
        setSelectedCourse(courseId);
    };

    /**
     * handleApply - Calls onFilterChange with the selected filters.
     * Sends courseId or null if 'all' is selected.
     */
    const handleApply = () => {
        onFilterChange({
            courseId: selectedCourse === 'all' ? null : Number(selectedCourse)
        });
    };

    // Disable "Apply" button if no campus or course is selected
    const isApplyDisabled = selectedCampus === 'all' && selectedCourse === 'all' ? false : !selectedCampus || !selectedCourse;

    return (
        <div className="filters-border">
            <div className="filters-title">Filter by course</div>
            <hr className="filters-divider" />
            
            {/* Campus Filter */}
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

            {/* Course Filter */}
            <div className="filter-section">
                <label className="filter-label">Course</label>
                <select
                    className="filter-input"
                    value={selectedCourse}
                    onChange={handleCourseChange}
                    disabled={!selectedCampus} // Disable if no campus selected
                >
                    <option value="">Select Course</option>
                    {selectedCampus === 'all' ? (
                        <option value="all">All Courses</option>
                    ) : (
                        courses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))
                    )}
                </select>
            </div>
            <hr className="filters-divider" />

            {/* Apply Button */}
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

export default CourseFilterComponent;
