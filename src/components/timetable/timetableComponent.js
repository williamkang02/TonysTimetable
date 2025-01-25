import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import '../../styles/timetablePage.css';
import GenerateTimetablePopup from '../popups/generateTimetablePopup';
import CourseSelectionPopup from '../popups/courseSelectionPopup';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import exportTimetable from '../../utils/exportTimetable';

const TimetableComponent = ({ filters }) => {
    const [classes, setClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [showCourseWarning, setShowCourseWarning] = useState(false);
    const timetableRef = useRef(null);

    // Fetch timetable data based on selected filters
    const fetchTimetableData = async () => {
        setIsLoading(true);
        try {
            // Build query
            let query = supabase 
                .from('Classes')
                .select(`
                    id,
                    class_type,
                    subject_id,
                    is_online,
                    location_id,
                    start_time,
                    duration_30mins,
                    Subjects (code, course_id, Courses(campus_id, name)),
                    Locations (name),
                    staff_id,
                    Staff (name)
                `)
                .order('start_time');
    
            // Apply filters if they exist
            if (filters.campusId) {
                query = query.eq('Subjects.Courses.campus_id', filters.campusId);
            }
            if (filters.courseId) {
                query = query.eq('Subjects.course_id', filters.courseId);
            }
    
            // Execute query
            const { data, error } = await query;
            if (error) throw error;
            
            // Filter out classes w NA codes
            const filteredData = data.filter(classItem => classItem.Subjects && classItem.Subjects.code !== 'N/A');
            setClasses(filteredData || []);
        } catch (error) {
            console.error('Error fetching timetable data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch timetable whenever filters change
    useEffect(() => {
        fetchTimetableData();
    }, [filters]);

    // Generate and fetch new timetable
    const generateAndFetchTimetable = async () => {
        setIsLoading(true);
        try {
            // Invoke Supabase function to generate timetable
            const { data, error } = await supabase.functions.invoke('generate-timetable', {
                body: JSON.stringify(filters)
            });
            if (error) throw error;
            await fetchTimetableData();
        } catch (error) {
            console.error('Error generating timetable:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // When user confirms timetable generation
    const handleConfirmGenerate = () => {
        generateAndFetchTimetable();
        setShowPopup(false);
    };

    // Click to show popup
    const handleGenerateClick = () => {
        setShowPopup(true);
    };

    const isGenerateDisabled = filters.campusId || filters.courseId;

    // Export timetable as PDF
    const handleExportPDF = async () => {
        if (timetableRef.current) {

            // Clone the timetable
            const timetableClone = timetableRef.current.cloneNode(true);
            document.body.appendChild(timetableClone);
            timetableClone.classList.add('pdf-export');

            // Visual changes for pdf
            const classSlots = timetableClone.getElementsByClassName('class-slot');
            Array.from(classSlots).forEach(slot => {
                const duration = parseInt(slot.style.height);
                slot.style.height = `${Math.max(duration, 60)}px`;
            });

            try {
                const canvas = await html2canvas(timetableClone, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    windowWidth: timetableClone.offsetWidth,
                    windowHeight: timetableClone.scrollHeight,
                    onclone: (clonedDoc) => {
                        const clonedElement = clonedDoc.body.firstChild;
                        clonedElement.style.transform = 'scale(1)';
                        clonedElement.style.transformOrigin = 'top left';
                    }
                });

                const imgData = canvas.toDataURL('image/png');
                const pdfWidth = timetableClone.offsetWidth * 0.75;
                const pdfHeight = timetableClone.scrollHeight * 0.75;

                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'pt',
                    format: [pdfWidth, pdfHeight]
                });

                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

                const imgX = (pdfWidth - imgWidth * ratio) / 2;
                const imgY = (pdfHeight - imgHeight * ratio) / 2;

                pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
                pdf.save('timetable.pdf');
            } finally {
                document.body.removeChild(timetableClone);
            }
        }
    };

    // Export timetable as Excel
    const handleExportExcel = async () => {
        if (filters.courseId) {
            try {
                const { data: courseData, error: courseError } = await supabase
                    .from('Courses')
                    .select(`
                        *,
                        Campuses(venue_name)
                    `)
                    .eq('id', filters.courseId)
                    .single();
                if (courseError) throw courseError;
                await exportTimetable(courseData);
            } catch (error) {
                console.error('Error exporting:', error);
            }
        } else {
            setShowCourseWarning(true);
        }
    };

    // Store geenerated colours for class codes
    const colorMap = {};
    const getClassColor = (subjectCode) => {
        if (!subjectCode || subjectCode === 'N/A') return '#FFFFFF';
        if (!colorMap[subjectCode]) {
            // Unique colour per subject
            const hue = subjectCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 137.508;
            colorMap[subjectCode] = `hsl(${hue % 360}, 70%, 85%)`;
        }
        return colorMap[subjectCode];
    };

    // Render each class in the correct time slot
    const renderTimeSlot = (halfHourIndex, dayIndex) => {
        const dbTime = dayIndex * 48 + halfHourIndex + 16;
        const classesInSlot = classes.filter(c => c.start_time === dbTime);
        if (classesInSlot.length === 0) return null;
    
        return classesInSlot.map((classItem, index) => {
            const subjectCode = classItem.Subjects?.code || 'N/A';
            const classLocation = classItem.Locations?.name || 'N/A';
            const backgroundColor = getClassColor(subjectCode);
            const staffName = classItem.Staff?.name;
    
            return (
                <div
                    key={index}
                    className={`class-slot ${classItem.is_online ? 'online-class' : ''}`}
                    style={{
                        height: `${classItem.duration_30mins * 29.2 - 6}px`, // Height for class slots
                        backgroundColor,
                    }}
                >
                    <div className="class-content">
                        <div className="class-code">{subjectCode}</div>
                        <div className="class-type">
                            {`${classItem.class_type} - ${staffName}` || 'Class Type N/A'}
                        </div>
                        <div className="class-location">
                            {classItem.is_online ? `Online & ${classLocation}` : classLocation}
                        </div>
                    </div>
                </div>
            );
        });
    };    

    // Render timetable for the week
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = Array.from({ length: 25 }, (_, i) => i);

    const formatTimeLabel = (halfHourIndex) => {
        const hour = Math.floor(halfHourIndex / 2) + 8;
        const minute = halfHourIndex % 2 === 0 ? '00' : '30';
        return `${hour.toString().padStart(2, '0')}:${minute}`;
    };

    // Render main component
    return (
        <div className="timetable-section">
            {showPopup && (
                <GenerateTimetablePopup
                    onClose={() => setShowPopup(false)}
                    onConfirm={handleConfirmGenerate}
                />
            )}
            {showCourseWarning && (
                <CourseSelectionPopup
                    onClose={() => setShowCourseWarning(false)}
                />
            )}
    
            <div className="timetable" ref={timetableRef}>
                <div className="timetable-header">
                    <div className="time-header">Time</div>
                    {daysOfWeek.map((day) => (
                        <div key={day} className="day-header">{day}</div>
                    ))}
                </div>
                <div className="timetable-body">
                    {timeSlots.map((halfHourIndex) => (
                        <div key={halfHourIndex} className="time-row">
                            <div className="time-label">
                                {formatTimeLabel(halfHourIndex)}
                            </div>
                            {daysOfWeek.map((day, dayIndex) => (
                                <div key={`${day}-${halfHourIndex}`} className="day-cell">
                                    {renderTimeSlot(halfHourIndex, dayIndex)}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <div className="button-container">
                <button
                    onClick={handleGenerateClick}
                    disabled={isLoading || isGenerateDisabled}
                    className={`generate-button ${isGenerateDisabled ? 'disabled' : ''}`}
                >
                    {isLoading ? 'Loading...' : 'Generate New Timetable'}
                </button>
    
                <div className="export-dropdown">
                    <button
                        onClick={() => setShowExportDropdown(!showExportDropdown)}
                        className="export-button"
                    >
                        Export
                    </button>
                    {showExportDropdown && (
                        <div className="export-dropdown-content">
                            <button onClick={handleExportPDF}>Export as PDF</button>
                            <button onClick={handleExportExcel}>Export as Excel</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );    
};

export default TimetableComponent;