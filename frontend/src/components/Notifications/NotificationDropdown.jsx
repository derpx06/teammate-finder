import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NotificationItem from './NotificationItem';
import { API_BASE_URL } from '../../config/api';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    };

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notification`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch notifications');
            }
            setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        } catch (_error) {
            setNotifications([]);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const handleViewAll = () => {
        setIsOpen(false);
        navigate('/notifications');
    };

    const handleMarkAllRead = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notification/mark-all-read`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to mark all as read');
            }
            setNotifications((current) =>
                current.map((notification) => ({ ...notification, isRead: true }))
            );
        } catch (_error) {
            // Non-blocking in dropdown.
        }
    };

    const handleNotificationClick = async (notificationId, isRead) => {
        if (isRead) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/notification/${notificationId}/read`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to mark notification as read');
            }
            setNotifications((current) =>
                current.map((notification) =>
                    notification.id === notificationId
                        ? { ...notification, ...data.notification }
                        : notification
                )
            );
        } catch (_error) {
            // Non-blocking in dropdown.
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-all focus:outline-none"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 origin-top-right"
                    >
                        <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Mark all as read
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.slice(0, 5).map(notification => (
                                    <NotificationItem
                                        key={notification.id}
                                        {...notification}
                                        onClick={() =>
                                            handleNotificationClick(notification.id, notification.isRead)
                                        }
                                    />
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    <p>No new notifications</p>
                                </div>
                            )}
                        </div>

                        <div className="p-2 border-t border-gray-50 bg-gray-50/50">
                            <button
                                onClick={handleViewAll}
                                className="w-full py-2 text-sm text-center text-gray-600 hover:text-blue-600 font-medium rounded-lg hover:bg-white transition-all"
                            >
                                View all notifications
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
