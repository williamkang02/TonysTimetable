import React, { useState, useEffect } from 'react';
import { MultiSelect } from 'primereact/multiselect'; // PrimeReact MultiSelect for class types
import { supabase } from '../../utils/supabaseClient';
import '../../styles/popup.css';
import 'primereact/resources/themes/saga-blue/theme.css'; // PrimeReact theme
import 'primereact/resources/primereact.min.css'; // PrimeReact core CSS

const EditClassPopup = ({ classroom, onClose, onSubmit }) => {
    const [name, setName] = useState(classroom.name);
    const [capacity, setCapacity] = useState(classroom.capacity);
    const [selectedClassTypes, setSelectedClassTypes] = useState(classroom.class_types || []); // Multi-select prefilled with class types
    const [campuses, setCampuses] = useState([]);
    const [selectedCampus, setSelectedCampus] = useState(classroom.campus_id);

    // Define available class types
    const classTypeOptions = [
        { label: 'Tutorial', value: 'Tutorial' },
        { label: 'Practical', value: 'Practical' },
        { label: 'Lecture', value: 'Lecture' },
    ];

    // Fetch campuses for campus selection
    useEffect(() => {
        const fetchCampuses = async () => {
            const { data, error } = await supabase
                .from('Campuses')
                .select('*');

            if (error) {
                console.error('Error fetching campuses:', error);
            } else {
                setCampuses(data); // Store fetched campuses
            }
        };

        fetchCampuses();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (name.trim() !== '' && !isNaN(capacity) && selectedClassTypes.length > 0 && selectedCampus !== '') {
            try {
                const { data, error } = await supabase
                    .from('Locations') // Update Locations table
                    .update({ name, capacity, class_types: selectedClassTypes, campus_id: selectedCampus }) // Update class_types as an array
                    .eq('id', classroom.id)
                    .select();

                if (error) {
                    console.error('Error updating classroom:', error);
                } else {
                    onSubmit(data[0]); // Send the updated classroom data to ClassComponent
                }
            } catch (error) {
                console.error('Error updating classroom:', error.message);
            }
            onClose();
        }
    };

    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Edit Classroom</div>
                <form onSubmit={handleSubmit}>
                    <label>
                        Classroom Name:
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Enter Classroom Name"
                        />
                    </label>

                    <label>
                        Capacity:
                        <input
                            type="number"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            required
                            placeholder="Enter Capacity"
                        />
                    </label>

                    <label>
                        Class Types:
                        <MultiSelect
                            value={selectedClassTypes}
                            options={classTypeOptions} // Use predefined options for class types
                            onChange={(e) => setSelectedClassTypes(e.value)} // Handle change in selected class types
                            placeholder="Select Class Types"
                            display="chip"
                            className="multiselect-custom"
                        />
                    </label>

                    <label>
                        Select Campus:
                        <select
                            value={selectedCampus}
                            onChange={(e) => setSelectedCampus(e.target.value)}
                            required
                        >
                            <option value="" disabled hidden className="placeholder-option">Select a Campus</option>
                            {campuses.map((campus) => (
                                <option key={campus.id} value={campus.id}>
                                    {campus.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="popup-buttons">
                        <button type="submit">Save</button>
                        <button type="button" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditClassPopup;
