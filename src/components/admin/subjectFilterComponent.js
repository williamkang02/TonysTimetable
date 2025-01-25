import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

/**
 * SubjectFilterComponent - A component to filter subjects by campus, course, and subject code.
 * It allows users to select a campus, a course, and a subject, then apply filters.
 * @param {function} onFilterChange - Callback to send filter values to the parent component.
 */
const SubjectFilterComponent = ({ onFilterChange }) => {
    // State hooks
    const [campuses, setCampuses] = useState([]);           // List of campuses
    const [courses, setCourses] = useState([]);             // List of courses based on selected campus
    const [units, setUnits] = useState([]);                 // List of subjects (units) based on selected campus
    const [selectedCampus, setSelectedCampus] = useState('all'); // Selected campus filter
    const [selectedCourse, setSelectedCourse] = useState('');    // Selected course filter
    const [selectedUnit, setSelectedUnit] = useState('');        // Selected subject (unit) filter

    /**
     * useEffect - Fetches campuses data when the component mounts.
     */
    useEffect(() => {
        fetchCampuses();
    }, []);

    /**
     * useEffect - Fetches courses and units whenever selectedCampus changes.
     * Resets selected course and unit when campus changes.
     */
    useEffect(() => {
        fetchUnits(selectedCampus); // Fetch units based on the selected campus
        if (selectedCampus === 'all') {
            fetchCourses('all');
            setSelectedCourse('all');
        } else {
            fetchCourses(selectedCampus);
            setSelectedCourse('');
            setSelectedUnit('');
        }
    }, [selectedCampus]);

    /**
     * fetchCampuses - Retrieves the list of campuses from Supabase.
     */
    const fetchCampuses = async () => {
        const { data, error } = await supabase
            .from('Campuses')
            .select('id, name');
        if (error) console.error('Error fetching campuses:', error);
        else setCampuses(data);
    };

    /**
     * fetchCourses - Retrieves the list of courses based on campus ID from Supabase.
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
     * fetchUnits - Retrieves the list of subjects based on campus ID from Supabase.
     * @param {string} campusId - The ID of the selected campus.
     */
    const fetchUnits = async (campusId) => {
        let query = supabase.from('Subjects').select('id, code, Courses (campus_id, Campuses (name))'); // Fetch campus_name
        if (campusId !== 'all') {
            query = query.eq('Courses.campus_id', campusId);
        }
        const { data, error } = await query;
        if (error) console.error('Error fetching units for campus:', error);
        else setUnits(data);
    };

    /**
     * handleCampusChange - Updates selectedCampus when a new campus is selected.
     * Resets selected course and unit.
     * @param {Event} e - Change event from campus select input.
     */
    const handleCampusChange = (e) => {
        const campusId = e.target.value;
        setSelectedCampus(campusId);
        if (campusId === 'all') {
            setSelectedCourse('all');
            setSelectedUnit('');
        } else {
            setSelectedCourse('');
            setSelectedUnit('');
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
     * handleUnitChange - Updates selectedUnit when a new subject is selected.
     * @param {Event} e - Change event from subject select input.
     */
    const handleUnitChange = (e) => {
        const unitId = e.target.value;
        setSelectedUnit(unitId);
    };

    /**
     * handleApply - Calls onFilterChange with the selected filters.
     * Sends campusId, courseId, and subjectCode, or null if 'all' is selected.
     */
    const handleApply = () => {
        onFilterChange({
            campusId: selectedCampus === 'all' ? null : Number(selectedCampus),
            courseId: selectedCourse === 'all' ? null : Number(selectedCourse),
            subjectCode: selectedUnit === 'all' ? null : Number(selectedUnit)
        });
    };

    // Disable "Apply" button if no campus or course is selected, unless "All" is chosen for both
    const isApplyDisabled = selectedCampus === 'all' && selectedCourse === 'all' ? false : !selectedCampus || !selectedCourse;

    return (
        <div className="filters-border">
            <div className="filters-title">Filter by Unit</div>
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

            {/* Subject Filter */}
            <div className="filter-section">
                <label className="filter-label">Subject Code</label>
                <select
                    className="filter-input"
                    value={selectedUnit}
                    onChange={handleUnitChange}
                    disabled={!selectedCampus} // Disable if no campus selected
                >
                    <option value="">Select Subject</option>
                    {selectedCampus === 'all' ? (
                        <option value="all">All Subjects</option>
                    ) : (
                        units.map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.code}</option>
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

export default SubjectFilterComponent;
