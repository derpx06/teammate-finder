import React, { useEffect, useMemo, useState } from 'react';
import { Filter, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationItem from './NotificationItem';
import { API_BASE_URL } from '../../config/api';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pendingActionId, setPendingActionId] = useState('');

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    };

    const fetchNotifications = async (showLoader = true) => {
        if (showLoader) {
            setLoading(true);
        }
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/notification`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch notifications');
            }
            setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        } catch (fetchError) {
            setError(fetchError.message || 'Failed to fetch notifications');
        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchNotifications(true);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchNotifications(false);
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    const runNotificationAction = async (id, action) => {
        try {
            setPendingActionId(id);
            const response = await fetch(`${API_BASE_URL}/api/notification/${id}/${action}`, {
                method: 'POST',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Failed to ${action} notification`);
            }
            setNotifications((current) =>
                current.map((notification) =>
                    notification.id === id
                        ? { ...notification, ...data.notification }
                        : notification
                )
            );
        } catch (actionError) {
            setError(actionError.message || 'Action failed');
        } finally {
            setPendingActionId('');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notification/mark-all-read`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to mark notifications as read');
            }
            setNotifications((current) =>
                current.map((notification) => ({ ...notification, isRead: true }))
            );
        } catch (actionError) {
            setError(actionError.message || 'Unable to update notifications');
        }
    };

    const markNotificationRead = async (id) => {
        const target = notifications.find((item) => item.id === id);
        if (!target || target.isRead) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/notification/${id}/read`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to mark notification as read');
            }
            setNotifications((current) =>
                current.map((notification) =>
                    notification.id === id
                        ? { ...notification, ...data.notification }
                        : notification
                )
            );
        } catch (_error) {
            // Keep UX non-blocking for read updates.
        }
    };

    const filteredNotifications = filter === 'all'
        ? notifications
        : notifications.filter(n => n.type === filter || (filter === 'unread' && !n.isRead));

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'unread', label: 'Unread' },
        { id: 'invite', label: 'Invites' },
        { id: 'application', label: 'Applications' },
        { id: 'message', label: 'Messages' },
        { id: 'alert', label: 'System' }
    ];

    const hasUnread = useMemo(
        () => notifications.some((notification) => !notification.isRead),
        [notifications]
    );

    return (
        <div className="max-w-4xl mx-auto page-shell">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Notifications</h1>
                    <p className="page-subtitle">Manage your alerts and activity updates.</p>
                </div>
                <button
                    onClick={handleMarkAllRead}
                    disabled={!hasUnread}
                    className="btn-secondary flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CheckCircle size={18} />
                    Mark all as read
                </button>
            </div>

            <div className="surface-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {error ? (
                    <div className="m-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                        {error}
                    </div>
                ) : null}

                {/* Filters */}
                <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50 overflow-x-auto">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f.id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div>
                    {loading ? (
                        <div className="p-12 flex items-center justify-center text-gray-500">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Loading notifications...
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        filteredNotifications.map(notification => {
                            const canActOnNotification =
                                ['project_invite', 'project_application', 'connection_request'].includes(notification.rawType) &&
                                notification.status === 'pending';

                            const actions = [];
                            if (
                                ['project_application', 'connection_request'].includes(notification.rawType) &&
                                notification.sender?.id
                            ) {
                                actions.push({
                                    label: 'View Profile',
                                    variant: 'secondary',
                                    onClick: () => navigate(`/user/${notification.sender.id}`),
                                });
                            }

                            if (canActOnNotification) {
                                actions.push(
                                    {
                                        label: pendingActionId === notification.id ? 'Accepting...' : 'Accept',
                                        onClick: () => runNotificationAction(notification.id, 'accept'),
                                        disabled: pendingActionId === notification.id,
                                    },
                                    {
                                        label: pendingActionId === notification.id ? 'Rejecting...' : 'Reject',
                                        onClick: () => runNotificationAction(notification.id, 'reject'),
                                        variant: 'secondary',
                                        disabled: pendingActionId === notification.id,
                                    }
                                );
                            }

                            return (
                                <NotificationItem
                                    key={notification.id}
                                    {...notification}
                                    onClick={() => markNotificationRead(notification.id)}
                                    actions={actions}
                                />
                            );
                        })
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            <Filter size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>No notifications found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
