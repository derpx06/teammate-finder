import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const OpenRoles = ({ formData, updateFormData }) => {
    const [newRole, setNewRole] = useState({ title: '', skills: '', spots: 1, durationHours: '' });

    const handleAddRole = () => {
        if (newRole.title && newRole.skills) {
            updateFormData('roles', [...formData.roles, { ...newRole, id: Date.now() }]);
            setNewRole({ title: '', skills: '', spots: 1, durationHours: '' });
        }
    };

    const handleRemoveRole = (id) => {
        updateFormData('roles', formData.roles.filter(role => role.id !== id));
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Open Roles</h2>

            {/* Add New Role Form */}
            <div className="bg-gray-50 p-4 rounded-xl mb-6 space-y-3">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Add New Role</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                        type="text"
                        placeholder="Role Title (e.g. Frontend Dev)"
                        value={newRole.title}
                        onChange={(e) => setNewRole({ ...newRole, title: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="Required Skills (e.g. React, Node)"
                        value={newRole.skills}
                        onChange={(e) => setNewRole({ ...newRole, skills: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <div>
                        <input
                            type="number"
                            min="1"
                            placeholder="Spots"
                            value={newRole.spots}
                            onChange={(e) => setNewRole({ ...newRole, spots: parseInt(e.target.value, 10) || 1 })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            min="1"
                            placeholder="Urgency (hours, optional)"
                            value={newRole.durationHours}
                            onChange={(e) => setNewRole({ ...newRole, durationHours: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleAddRole}
                        disabled={!newRole.title || !newRole.skills}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={16} />
                        Add Role
                    </button>
                </div>
            </div>

            {/* Roles List */}
            <div className="space-y-3">
                {formData.roles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No roles added yet. Add a role to start building your team.
                    </div>
                ) : (
                    formData.roles.map(role => (
                        <div key={role.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 transition-colors shadow-sm">
                            <div>
                                <h4 className="font-bold text-gray-900">{role.title}</h4>
                                <p className="text-sm text-gray-600">Skills: {role.skills}</p>
                                {Number(role.durationHours) > 0 ? (
                                    <p className="text-xs text-amber-700 mt-1">Urgent: {role.durationHours} hours</p>
                                ) : null}
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                    {role.spots} Spot{role.spots > 1 ? 's' : ''}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRole(role.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default OpenRoles;
