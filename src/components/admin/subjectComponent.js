import React, { useState, useEffect } from 'react';
import AddSubjectPopup from '../popups/addSubjectPopup';
import EditSubjectPopup from '../popups/editSubjectPopup';
import EditSubjectClassPopup from '../popups/editSubjectClassPopup';
import RemovePopup from '../popups/removePopup'; // Import the RemovePopup
import { supabase } from '../../utils/supabaseClient';
import '../../styles/adminPage.css';
import '../../styles/courseComponent.css';

/**
 * SubjectComponent - A component for displaying, adding, editing, and removing subjects.
 * It fetches courses, campuses, and subjects from Supabase and applies filters based on the `filters` prop.
 */
const SubjectComponent = ({ filters }) => {
    // State hooks
    const [courses, setCourses] = useState([]);                // List of courses
    const [campuses, setCampuses] = useState([]);              // List of campuses
    const [subjects, setSubjects] = useState([]);              // List of subjects
    const [filteredSubjects, setFilteredSubjects] = useState([]); // Filtered subjects based on filters
    const [isLoading, setIsLoading] = useState(true);          // Loading indicator
    const [showSubjectPopup, setShowSubjectPopup] = useState(false); // Control Add Subject popup visibility
    const [showEditSubjectPopup, setShowEditSubjectPopup] = useState(false); // Control Edit Subject popup visibility
    const [showEditClassPopup, setShowEditClassPopup] = useState(false); // Control Edit Class popup visibility
    const [showRemovePopup, setShowRemovePopup] = useState(false); // Control Remove popup visibility
    const [selectedSubject, setSelectedSubject] = useState(null); // Currently selected subject for editing or removal

    /**
     * useEffect hook - Fetches courses, campuses, and subjects data from Supabase when the component mounts.
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch courses
                const { data: coursesData, error: coursesError } = await supabase
                    .from('Courses')
                    .select('*');
                if (coursesError) {
                    console.error('Error fetching courses:', coursesError);
                } else {
                    setCourses(coursesData);
                }

                // Fetch campuses
                const { data: campusesData, error: campusesError } = await supabase
                    .from('Campuses')
                    .select('*');
                if (campusesError) {
                    console.error('Error fetching campuses:', campusesError);
                } else {
                    setCampuses(campusesData);
                }

                // Fetch subjects
                const { data: subjectsData, error: subjectsError } = await supabase
                    .from('Subjects')
                    .select('*');
                if (subjectsError) {
                    console.error('Error fetching subjects:', subjectsError);
                } else {
                    setSubjects(subjectsData);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    /**
     * useEffect hook - Filters subjects based on selected filters.
     * Updates `filteredSubjects` state whenever `filters` or `subjects` change.
     */
    useEffect(() => {
        const filtered = subjects.filter(subject => {
            const matchesCourse = filters.courseId ? subject.course_id === filters.courseId : true;
            const matchesSubjectCode = filters.subjectCode ? subject.id === filters.subjectCode : true;
            return matchesCourse && matchesSubjectCode;
        });
        setFilteredSubjects(filtered);
    }, [filters, subjects]);

    /**
     * getCourseName - Finds and returns the course name based on course ID.
     * @param {string} courseId - The ID of the course.
     * @returns {string} - The name of the course or 'Unknown Course' if not found.
     */
    const getCourseName = (courseId) => {
        const course = courses.find((course) => course.id === courseId);
        return course ? course.name : 'Unknown Course';
    };

    /**
     * getCampusName - Finds and returns the campus name based on the course's campus ID.
     * @param {string} courseId - The ID of the course.
     * @returns {string} - The name of the campus or 'Unknown Campus' if not found.
     */
    const getCampusName = (courseId) => {
        const course = courses.find((course) => course.id === courseId);
        if (course) {
            const campus = campuses.find((campus) => campus.id === course.campus_id);
            return campus ? campus.name : 'Unknown Campus';
        }
        return 'Unknown Campus';
    };

    /**
     * addSubject - Inserts a new subject into the Supabase database.
     * Adds the new subject to `subjects` state.
     * @param {Object} subjectData - The new subject data.
     */
    const addSubject = async (subjectData) => {
        try {
            const { data, error } = await supabase
                .from('Subjects')
                .insert([subjectData])
                .select();
            if (error) {
                console.error('Error adding subject:', error);
            } else if (data && data.length > 0) {
                setSubjects((prevSubjects) => [...prevSubjects, data[0]]);
            }
        } catch (error) {
            console.error('Error adding subject:', error);
        }
    };

    /**
     * handleDeleteSubject - Deletes a subject and associated records from the Supabase database.
     * Updates the `subjects` state to remove the deleted subject.
     * @param {string} subjectId - The ID of the subject to be deleted.
     */
    const handleDeleteSubject = async (subjectId) => {
        try {
            // Delete related entries in StudentSubject table
            const { error: subjectRelationError } = await supabase
                .from('StudentSubject')
                .delete()
                .eq('subject_id', subjectId);
            if (subjectRelationError) {
                console.error('Error deleting from StudentSubject:', subjectRelationError);
                return;
            }

            // Delete related classes
            const { error: classesError } = await supabase
                .from('Classes')
                .delete()
                .eq('subject_id', subjectId);
            if (classesError) {
                console.error('Error deleting classes related to subject:', classesError);
                return;
            }

            // Delete the subject
            const { error: subjectError } = await supabase
                .from('Subjects')
                .delete()
                .eq('id', subjectId);
            if (subjectError) {
                console.error('Error deleting subject:', subjectError);
            } else {
                setSubjects(subjects.filter((subject) => subject.id !== subjectId));
            }
        } catch (error) {
            console.error('Error deleting subject:', error);
        }
    };

    /**
     * Popup handling functions for editing and removing subjects.
     */
    const handleEditSubject = (subject) => {
        setSelectedSubject(subject);
        setShowEditSubjectPopup(true);
    };

    const handleEditSubjectClass = (subject) => {
        setSelectedSubject(subject);
        setShowEditClassPopup(true);
    };

    const handleRemoveSubjectClick = (subject) => {
        setSelectedSubject(subject);
        setShowRemovePopup(true);
    };

    /**
     * updateSubject - Updates the selected subject in the `subjects` state.
     * @param {Object} updatedSubject - The updated subject object.
     */
    const updateSubject = (updatedSubject) => {
        setSubjects(subjects.map((subject) => (subject.id === updatedSubject.id ? updatedSubject : subject)));
    };

    return (
        <div className="admin-section">

            {isLoading ? (
                // Display loading indicator while data is being fetched
                <div className='courses-list'>
                    <div className='course-row'>
                        <p>Loading Units</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="courses-list">
                        {filteredSubjects.map((subject, index) => (
                            <div key={index} className="course-row">
                                <div className="course-info">
                                    <div className="course-name">{subject.name}</div>
                                    <div className="course-details">
                                        <div className="course-code">{subject.code}</div>
                                        <div className="course-code">{getCourseName(subject.course_id)}</div>
                                        <div className="course-code">{getCampusName(subject.course_id)}</div>
                                    </div>
                                </div>
                                <div className="subject-actions">
                                    <button className="more-options" onClick={() => handleEditSubject(subject)}>Edit Unit</button>
                                    <button className="more-options" onClick={() => handleEditSubjectClass(subject)}>Classes</button>
                                    <button className="more-options" onClick={() => handleRemoveSubjectClick(subject)}>Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <br />

            {/* Button to open the Add Subject popup */}
            <button className='more-options' type="button" onClick={() => setShowSubjectPopup(true)}>
                Add Unit
            </button>

            {/* Popups */}
            {showSubjectPopup && (
                <AddSubjectPopup
                    onClose={() => setShowSubjectPopup(false)}
                    onSubmit={addSubject}
                />
            )}

            {showEditSubjectPopup && selectedSubject && (
                <EditSubjectPopup
                    subject={selectedSubject}
                    onClose={() => setShowEditSubjectPopup(false)}
                    onSubmit={updateSubject}
                />
            )}

            {showEditClassPopup && selectedSubject && (
                <EditSubjectClassPopup
                    subject={selectedSubject}
                    onClose={() => setShowEditClassPopup(false)}
                />
            )}

            {showRemovePopup && selectedSubject && (
                <RemovePopup
                    onClose={() => setShowRemovePopup(false)}
                    onConfirm={() => {
                        handleDeleteSubject(selectedSubject.id);
                        setShowRemovePopup(false);
                    }}
                />
            )}
        </div>
    );
};

export default SubjectComponent;
