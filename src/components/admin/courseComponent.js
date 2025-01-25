import React, { useState, useEffect } from 'react';
import AddCoursePopup from '../popups/addCoursePopup';
import EditCoursePopup from '../popups/editCoursePopup';
import RemovePopup from '../popups/removePopup'; // Import RemovePopup for delete confirmation
import { supabase } from '../../utils/supabaseClient';
import '../../styles/adminPage.css';

/**
 * CourseComponent - A component to display, add, edit, and remove courses.
 * It fetches courses and campus data from Supabase, and applies filters based on props.
 */
const CourseComponent = ({ filters }) => {
    // State hooks
    const [courses, setCourses] = useState([]);               // List of courses
    const [campuses, setCampuses] = useState([]);             // List of campuses
    const [isLoading, setIsLoading] = useState(true);         // Loading indicator
    const [filtered_course, setFilteredCourses] = useState([]); // Filtered list of courses
    const [showAddCoursePopup, setShowAddCoursePopup] = useState(false); // Control Add popup visibility
    const [showEditCoursePopup, setShowEditCoursePopup] = useState(false); // Control Edit popup visibility
    const [showRemovePopup, setShowRemovePopup] = useState(false); // Control Remove popup visibility
    const [selectedCourse, setSelectedCourse] = useState(null);   // Currently selected course for editing
    const [courseToRemove, setCourseToRemove] = useState(null);   // Course selected for removal

    /**
     * useEffect hook - Fetches courses and campuses data from Supabase when the component mounts.
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch courses data from Supabase
                const { data: coursesData, error: coursesError } = await supabase
                    .from('Courses')
                    .select('*');
                if (coursesError) {
                    console.error('Error fetching courses:', coursesError);
                }

                // Fetch campuses data from Supabase
                const { data: campusesData, error: campusesError } = await supabase
                    .from('Campuses')
                    .select('*');
                if (campusesError) {
                    console.error('Error fetching campuses:', campusesError);
                }

                // Store fetched data in state
                setCourses(coursesData || []);
                setCampuses(campusesData || []);
            } finally {
                setIsLoading(false); // Set loading state to false once data is fetched
            }
        };

        fetchData(); // Trigger the fetch data function
    }, []);

    /**
     * useEffect hook - Filters courses based on provided filters.
     * Updates filtered_course state whenever filters or courses change.
     */
    useEffect(() => {
        const filtered_course = courses.filter(course => {
            const matchesCourse = filters.courseId ? course.id === filters.courseId : true;
            return matchesCourse;
        });

        setFilteredCourses(filtered_course); // Update the filtered courses state
    }, [filters, courses]);

    /**
     * addCourse - Adds a new course to the courses state.
     * @param {Object} newCourse - The new course object to be added.
     */
    const addCourse = (newCourse) => {
        setCourses([...courses, newCourse]);
    };

    /**
     * handleDeleteCourse - Deletes a course and associated subjects from Supabase.
     * Updates the state to remove the deleted course from the list.
     * @param {string} courseId - The ID of the course to be deleted.
     */
    const handleDeleteCourse = async (courseId) => {
        try {
            // Step 1: Delete associated subjects
            const { error: subjectsError } = await supabase
                .from('Subjects')
                .delete()
                .eq('course_id', courseId);
            if (subjectsError) {
                console.error('Error deleting subjects related to course:', subjectsError);
                return;
            }

            // Step 2: Delete the course
            const { error: deleteError } = await supabase
                .from('Courses')
                .delete()
                .eq('id', courseId);
            if (deleteError) {
                console.error('Error deleting course:', deleteError);
            } else {
                setCourses(courses.filter((course) => course.id !== courseId)); // Update state to remove course
            }
        } catch (error) {
            console.error('Error deleting course:', error);
        }
    };

    /**
     * handleEditCourse - Sets the selected course and shows the Edit popup.
     * @param {Object} course - The course to be edited.
     */
    const handleEditCourse = (course) => {
        setSelectedCourse(course);
        setShowEditCoursePopup(true);
    };

    /**
     * updateCourse - Updates the course in the courses state.
     * @param {Object} updatedCourse - The updated course object.
     */
    const updateCourse = (updatedCourse) => {
        setCourses(courses.map((course) => (course.id === updatedCourse.id ? updatedCourse : course)));
    };

    /**
     * getCampusName - Finds and returns the campus name based on campus ID.
     * @param {string} campusId - The ID of the campus.
     * @returns {string} - The name of the campus or 'Unknown Campus' if not found.
     */
    const getCampusName = (campusId) => {
        const campus = campuses.find((campus) => campus.id === campusId);
        return campus ? campus.name : 'Unknown Campus';
    };

    /**
     * handleRemoveClick - Sets the course to be removed and shows the Remove popup.
     * @param {Object} course - The course to be removed.
     */
    const handleRemoveClick = (course) => {
        setCourseToRemove(course);
        setShowRemovePopup(true);
    };

    /**
     * confirmRemoveCourse - Confirms and deletes the selected course.
     * Calls handleDeleteCourse and hides the Remove popup.
     */
    const confirmRemoveCourse = () => {
        handleDeleteCourse(courseToRemove.id);
        setShowRemovePopup(false);
    };

    return (
        <div className="admin-section">
            {isLoading ? (
                // Display loading indicator while data is being fetched
                <div className='courses-list'>   
                    <div className='course-row'>
                        <p>Loading Courses</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="courses-list">
                        {filtered_course.map((course, index) => (
                            <div key={index} className="course-row">
                                <div className="course-info">
                                    <div className="course-name">{course.name}</div>
                                    <div className='course-details'>    
                                        <div className="course-code">{course.course_code || 'No Code'}</div>
                                        <div className="course-code">{getCampusName(course.campus_id)}</div> 
                                    </div>
                                </div>
                                <div className="course-actions">
                                    <button className="more-options" onClick={() => handleEditCourse(course)}>
                                        Edit
                                    </button>
                                    <button className="more-options" onClick={() => handleRemoveClick(course)}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <br />

            {/* Button to open the Add Course popup */}
            <button className="more-options" type="button" onClick={() => setShowAddCoursePopup(true)}>
                Add Course
            </button>

            {/* Popups */}
            {showAddCoursePopup && (
                <AddCoursePopup
                    onClose={() => setShowAddCoursePopup(false)}
                    onSubmit={addCourse}
                />
            )}

            {showEditCoursePopup && selectedCourse && (
                <EditCoursePopup
                    course={selectedCourse}
                    onClose={() => setShowEditCoursePopup(false)}
                    onSubmit={updateCourse}
                />
            )}

            {showRemovePopup && (
                <RemovePopup
                    onClose={() => setShowRemovePopup(false)}
                    onConfirm={confirmRemoveCourse}
                />
            )}
        </div>
    );
};

export default CourseComponent;
