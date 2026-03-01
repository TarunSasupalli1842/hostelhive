
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getHostels, getRooms, getBookings, getStudents, getOwners,
    addHostel, addRoom, deleteDocument, updateDocument, deleteBookingRecord,
    banStudent, getHostelsByOwner, getRoomsByOwner, getBookingsByOwner
} from '../utils/firebaseService';
import { Plus, Trash2, Edit, X, Building, Building2, Home as HomeIcon, Users, BookOpen, LayoutDashboard, Search, TrendingUp, Eye, ArrowLeft } from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const [activeTab, setActiveTab] = useState('hostels');
    const [hostels, setHostels] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [students, setStudents] = useState([]);
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Form states
    const [showHostelForm, setShowHostelForm] = useState(false);
    const [newHostel, setNewHostel] = useState({ name: '', location: '', distance: '', price: '', description: '', amenities: '', images: '' });
    const [showRoomForm, setShowRoomForm] = useState(false);
    const [newRoom, setNewRoom] = useState({ hostelId: '', type: '', price: '', capacity: '', available: '', image: '' });

    // Editing states
    const [editingHostelId, setEditingHostelId] = useState(null);
    const [editingRoomId, setEditingRoomId] = useState(null);

    const fetchData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            let h, r, b, s, o;

            if (currentUser.role === 'owner') {
                [h, r, b] = await Promise.all([
                    getHostelsByOwner(currentUser.id),
                    getRoomsByOwner(currentUser.id),
                    getBookingsByOwner(currentUser.id)
                ]);
                s = [];
                o = [];
            } else {
                [h, r, b, s, o] = await Promise.all([
                    getHostels(), getRooms(), getBookings(), getStudents(), getOwners()
                ]);
            }
            setHostels(h);
            setRooms(r);
            setBookings(b);
            setStudents(s);
            setOwners(o);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner')) {
            navigate('/admin-login');
        } else {
            fetchData();
        }
    }, [navigate]);

    const handleSaveHostel = async (e) => {
        e.preventDefault();
        const rawImages = newHostel.images || '';
        const imageList = typeof rawImages === 'string' ? rawImages.split(',').map(i => i.trim()).filter(i => i) : rawImages;

        const hostelData = {
            ...newHostel,
            price: parseInt(newHostel.price) || 0,
            amenities: typeof newHostel.amenities === 'string' ? newHostel.amenities.split(',').map(a => a.trim()).filter(a => a) : (newHostel.amenities || []),
            images: (Array.isArray(imageList) && imageList.length > 0) ? imageList : ['https://images.unsplash.com/photo-1555854817-5b2738a7528d?auto=format&fit=crop&w=800&q=80'],
            ownerId: currentUser.id
        };

        if (editingHostelId) {
            await updateDocument('hostels', editingHostelId, hostelData);
        } else {
            await addHostel(hostelData);
        }

        await fetchData();
        setShowHostelForm(false);
        setEditingHostelId(null);
        setNewHostel({ name: '', location: '', distance: '', price: '', description: '', amenities: '', images: '' });
    };

    const startEditHostel = (hostel) => {
        setNewHostel({
            name: hostel.name,
            location: hostel.location,
            distance: hostel.distance,
            price: hostel.price,
            description: hostel.description,
            amenities: hostel.amenities.join(', '),
            images: hostel.images.join(', ')
        });
        setEditingHostelId(hostel.id);
        setShowHostelForm(true);
    };

    const deleteHostel = async (id) => {
        if (window.confirm("Delete this hostel? This cannot be undone.")) {
            await deleteDocument('hostels', id);
            await fetchData();
        }
    };

    const handleSaveRoom = async (e) => {
        e.preventDefault();
        if (!newRoom.hostelId) { alert("Please select a hostel"); return; }

        const roomData = {
            hostelId: newRoom.hostelId,
            type: newRoom.type,
            price: parseInt(newRoom.price),
            capacity: parseInt(newRoom.capacity),
            available: parseInt(newRoom.available),
            image: newRoom.image || 'https://images.unsplash.com/photo-1522771739844-6a9fb69e2b87?auto=format&fit=crop&w=800&q=80'
        };

        if (editingRoomId) {
            await updateDocument('rooms', editingRoomId, roomData);
        } else {
            await addRoom(roomData);
        }

        await fetchData();
        setShowRoomForm(false);
        setEditingRoomId(null);
        setNewRoom({ hostelId: '', type: '', price: '', capacity: '', available: '' });
    };

    const startEditRoom = (room) => {
        setNewRoom({
            hostelId: room.hostelId,
            type: room.type,
            price: room.price,
            capacity: room.capacity,
            available: room.available,
            image: room.image || ''
        });
        setEditingRoomId(room.id);
        setShowRoomForm(true);
    };

    const deleteRoom = async (id) => {
        if (window.confirm("Delete this room configuration?")) {
            await deleteDocument('rooms', id);
            await fetchData();
        }
    };

    const deleteStudent = async (id) => {
        const student = students.find(s => s.id === id);
        if (!student) return;

        if (window.confirm(`Are you sure you want to ban ${student.name}? This student will PERMANENTLY lose access to their account and won't be able to re-register with this email.`)) {
            await banStudent(id, student.email);
            await fetchData();
        }
    };

    const deleteBooking = async (id) => {
        if (window.confirm("Are you sure you want to delete this booking? The room availability will be restored.")) {
            await deleteBookingRecord(id);
            await fetchData();
        }
    };

    const deleteOwner = async (id) => {
        if (window.confirm("Are you sure you want to remove this hostel owner? Their properties will remain but will be orphaned.")) {
            await deleteDocument('owners', id);
            await fetchData();
        }
    };

    const updateBookingStatus = async (id, newStatus) => {
        await updateDocument('bookings', id, { status: newStatus });
        await fetchData();
    };

    const getFilteredData = () => {
        const term = searchTerm.toLowerCase();
        switch (activeTab) {
            case 'hostels':
                return hostels.filter(h =>
                    h.name.toLowerCase().includes(term) ||
                    h.location.toLowerCase().includes(term)
                );
            case 'rooms':
                return rooms.filter(r => {
                    const hostel = hostels.find(h => h.id === r.hostelId);
                    return (
                        r.type.toLowerCase().includes(term) ||
                        (hostel && hostel.name.toLowerCase().includes(term))
                    );
                });
            case 'bookings':
                return bookings.filter(b => {
                    const matchesSearch = b.studentName.toLowerCase().includes(term) ||
                        b.hostelName.toLowerCase().includes(term) ||
                        b.phone.toLowerCase().includes(term);
                    const matchesFilter = filterStatus === 'All' || b.status === filterStatus;
                    return matchesSearch && matchesFilter;
                }).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            case 'students':
                return students.filter(s =>
                    s.name.toLowerCase().includes(term) ||
                    s.email.toLowerCase().includes(term) ||
                    s.college.toLowerCase().includes(term)
                );
            case 'owners':
                return owners.filter(o =>
                    o.name.toLowerCase().includes(term) ||
                    o.email.toLowerCase().includes(term) ||
                    (o.phone && o.phone.toLowerCase().includes(term))
                );
            default:
                return [];
        }
    };

    const stats = [
        { label: 'Total Hostels', value: hostels.length, icon: <Building size={24} />, color: '#6366f1' },
        { label: 'Total Bookings', value: bookings.length, icon: <BookOpen size={24} />, color: '#10b981' },
        currentUser?.role === 'admin' ? { label: 'Registered Students', value: students.length, icon: <Users size={24} />, color: '#f59e0b' } : null,
        currentUser?.role === 'admin' ? { label: 'Hostel Owners', value: owners.length, icon: <Building2 size={24} />, color: '#8b5cf6' } : null,
        { label: 'Available Rooms', value: rooms.reduce((acc, r) => acc + (r.available || 0), 0), icon: <HomeIcon size={24} />, color: '#f43f5e' },
    ].filter(s => s);

    return (
        <div className="theme-slate" style={{ background: '#f8fafc', minHeight: '100vh', padding: '130px 0 60px' }}>
            <div className="container">
                {/* Dashboard Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '8px 18px', borderRadius: '12px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                            <ArrowLeft size={16} /> Back to Home
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '800', fontSize: '14px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <LayoutDashboard size={18} /> {currentUser?.role === 'owner' ? 'Owner Performance' : 'Administrative Nexus'}
                        </div>
                        <h1 style={{ fontSize: '48px', letterSpacing: '-1.5px' }}>{currentUser?.role === 'owner' ? 'Owner' : 'Nexus'} <span className="gradient-text">Dashboard</span></h1>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button onClick={() => setShowHostelForm(true)} className="btn-primary" style={{ borderRadius: '16px' }}>
                            <Plus size={20} /> Add New Hostel
                        </button>
                        <button onClick={() => setShowRoomForm(true)} className="btn-outline" style={{ borderRadius: '16px' }}>
                            <Plus size={20} /> Add Room Config
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
                    {stats.map((stat, i) => (
                        <div key={i} className="card" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px', background: 'white' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '20px',
                                background: `${stat.color}15`,
                                color: stat.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {stat.icon}
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: '600' }}>{stat.label}</div>
                                <div style={{ fontSize: '32px', fontWeight: '800' }}>{stat.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }} className="admin-layout">
                    {/* Sidebar Tabs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            { id: 'hostels', icon: <Building size={20} />, label: 'Manage Hostels' },
                            { id: 'rooms', icon: <HomeIcon size={20} />, label: 'Room Configurations' },
                            { id: 'bookings', icon: <BookOpen size={20} />, label: 'Real-time Bookings' },
                            currentUser?.role === 'admin' ? { id: 'owners', icon: <Building2 size={20} />, label: 'Hostel Owners' } : null,
                            currentUser?.role === 'admin' ? { id: 'students', icon: <Users size={20} />, label: 'Student Directory' } : null
                        ].filter(t => t).map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    justifyContent: 'flex-start',
                                    padding: '16px 24px',
                                    borderRadius: '16px',
                                    background: activeTab === tab.id ? 'white' : 'transparent',
                                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                                    boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                                    border: activeTab === tab.id ? '1px solid var(--border-light)' : '1px solid transparent',
                                    fontSize: '16px'
                                }}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Table View */}
                    <div className="card" style={{ background: 'white', borderRadius: '32px', padding: '32px', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '24px' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-light)' }} size={18} />
                                    <input
                                        placeholder={`Search ${activeTab}...`}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ height: '44px', paddingLeft: '40px', fontSize: '14px', borderRadius: '12px', width: '250px' }}
                                    />
                                </div>
                                {activeTab === 'bookings' && (
                                    <div style={{ height: '44px', padding: '0 16px', fontSize: '14px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', fontWeight: '700' }}>
                                        <TrendingUp size={16} /> All Confirmed
                                    </div>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto' }}></div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                {activeTab === 'hostels' && (
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                        <thead>
                                            <tr style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'left' }}>
                                                <th style={{ padding: '0 20px 10px' }}>PROPERTY NAME</th>
                                                <th style={{ padding: '0 20px 10px' }}>LOCATION</th>
                                                <th style={{ padding: '0 20px 10px' }}>BASE PRICE</th>
                                                <th style={{ padding: '0 20px 10px' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getFilteredData().map(h => (
                                                <tr key={h.id} style={{ background: 'var(--bg-subtle)' }}>
                                                    <td style={{ padding: '20px', borderRadius: '16px 0 0 16px', fontWeight: '700' }}>{h.name}</td>
                                                    <td style={{ padding: '20px' }}>{h.location}</td>
                                                    <td style={{ padding: '20px', color: 'var(--primary)', fontWeight: '800' }}>₹{h.price}</td>
                                                    <td style={{ padding: '20px', borderRadius: '0 16px 16px 0' }}>
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            <button onClick={() => startEditHostel(h)} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', borderRadius: '10px', background: '#eff6ff', color: '#3b82f6', boxShadow: '0 2px 8px rgba(59,130,246,0.15)', border: '1px solid #bfdbfe', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}><Edit size={14} /> Edit</button>
                                                            <button onClick={() => alert(`🏨 Hostel Info\n\nName: ${h.name}\nLocation: ${h.location}\nPrice: ₹${h.price}/mo\nDistance: ${h.distance}\nAmenities: ${(h.amenities || []).join(', ')}\nDescription: ${h.description || 'N/A'}`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', boxShadow: '0 2px 8px rgba(22,163,74,0.15)', border: '1px solid #bbf7d0', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}><Eye size={14} /> Info</button>
                                                            <button onClick={() => deleteHostel(h.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,0.15)', border: '1px solid #fecaca', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}><Trash2 size={14} /> Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {activeTab === 'rooms' && (
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                        <thead>
                                            <tr style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'left' }}>
                                                <th style={{ padding: '0 20px 10px' }}>HOSTEL</th>
                                                <th style={{ padding: '0 20px 10px' }}>TYPE</th>
                                                <th style={{ padding: '0 20px 10px' }}>RENT</th>
                                                <th style={{ padding: '0 20px 10px' }}>AVAILABILITY</th>
                                                <th style={{ padding: '0 20px 10px' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getFilteredData().map(r => (
                                                <tr key={r.id} style={{ background: 'var(--bg-subtle)' }}>
                                                    <td style={{ padding: '20px', borderRadius: '16px 0 0 16px', fontSize: '15px' }}>{hostels.find(h => h.id === r.hostelId)?.name || 'Unknown'}</td>
                                                    <td style={{ padding: '20px', fontWeight: '700' }}>{r.type}</td>
                                                    <td style={{ padding: '20px', fontWeight: '800', color: 'var(--primary)' }}>₹{r.price}</td>
                                                    <td style={{ padding: '20px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <span className="badge badge-green" style={{ background: 'white' }}>{r.available} Units Left</span>
                                                            {r.available > 0 && (
                                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                                    Active: {r.currentOccupancy || 0} / {r.capacity} filled
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '20px', borderRadius: '0 16px 16px 0' }}>
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            <button onClick={() => startEditRoom(r)} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', borderRadius: '10px', background: '#eff6ff', color: '#3b82f6', boxShadow: '0 2px 8px rgba(59,130,246,0.15)', border: '1px solid #bfdbfe', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}><Edit size={14} /> Edit</button>
                                                            <button onClick={() => { const h = hostels.find(x => x.id === r.hostelId); alert(`🛏️ Room Info\n\nHostel: ${h?.name || 'Unknown'}\nType: ${r.type}\nRent: ₹${r.price}/mo\nCapacity: ${r.capacity} persons\nAvailable: ${r.available} units`); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', boxShadow: '0 2px 8px rgba(22,163,74,0.15)', border: '1px solid #bbf7d0', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}><Eye size={14} /> Info</button>
                                                            <button onClick={() => deleteRoom(r.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,0.15)', border: '1px solid #fecaca', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}><Trash2 size={14} /> Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {activeTab === 'bookings' && (
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                        <thead>
                                            <tr style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'left' }}>
                                                <th style={{ padding: '0 20px 10px' }}>STUDENT</th>
                                                <th style={{ padding: '0 20px 10px' }}>PROPERTY / ROOM</th>
                                                <th style={{ padding: '0 20px 10px' }}>REVENUE</th>
                                                <th style={{ padding: '0 20px 10px' }}>STATUS</th>
                                                <th style={{ padding: '0 20px 10px' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getFilteredData().map(b => (
                                                <tr key={b.id} style={{ background: 'var(--bg-subtle)' }}>
                                                    <td style={{ padding: '20px', borderRadius: '16px 0 0 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ fontWeight: '700' }}>{b.studentName}</div>
                                                            {b.createdAt && (Date.now() - b.createdAt.toDate().getTime() < 86400000) && (
                                                                <span style={{ fontSize: '10px', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '6px', fontWeight: '800' }}>NEW</span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{b.phone}</div>
                                                    </td>
                                                    <td style={{ padding: '20px' }}>
                                                        <div style={{ fontWeight: '600' }}>{b.hostelName}</div>
                                                        <div style={{ fontSize: '13px', color: 'var(--primary)' }}>{b.roomType}</div>
                                                    </td>
                                                    <td style={{ padding: '20px', fontWeight: '800' }}>₹{b.totalAmount}</td>
                                                    <td style={{ padding: '20px' }}>
                                                        <span className="badge badge-green" style={{ background: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                            <TrendingUp size={14} /> Confirmed
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '20px', borderRadius: '0 16px 16px 0' }}>
                                                        <button
                                                            onClick={() => deleteBooking(b.id)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                height: '36px',
                                                                padding: '0 14px',
                                                                borderRadius: '10px',
                                                                background: '#fef2f2',
                                                                color: '#ef4444',
                                                                boxShadow: '0 2px 8px rgba(239,68,68,0.15)',
                                                                border: '1px solid #fecaca',
                                                                fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {activeTab === 'owners' && (
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                        <thead>
                                            <tr style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'left' }}>
                                                <th style={{ padding: '0 20px 10px' }}>OWNER NAME</th>
                                                <th style={{ padding: '0 20px 10px' }}>CONTACT INFO</th>
                                                <th style={{ padding: '0 20px 10px' }}>HOSTELS MANAGED</th>
                                                <th style={{ padding: '0 20px 10px' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getFilteredData().map(o => (
                                                <tr key={o.id} style={{ background: 'var(--bg-subtle)' }}>
                                                    <td style={{ padding: '20px', borderRadius: '16px 0 0 16px', fontWeight: '700' }}>{o.name}</td>
                                                    <td style={{ padding: '20px' }}>
                                                        <div style={{ fontSize: '14px' }}>{o.email}</div>
                                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{o.phone || 'N/A'}</div>
                                                    </td>
                                                    <td style={{ padding: '20px' }}>
                                                        <span className="badge badge-blue" style={{ background: 'white' }}>
                                                            {hostels.filter(h => h.ownerId === o.id).length} Properties
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '20px', borderRadius: '0 16px 16px 0' }}>
                                                        <button onClick={() => deleteOwner(o.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,0.15)', border: '1px solid #fecaca', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {activeTab === 'students' && (
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                        <thead>
                                            <tr style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'left' }}>
                                                <th style={{ padding: '0 20px 10px' }}>STUDENT NAME</th>
                                                <th style={{ padding: '0 20px 10px' }}>CONTACT INFO</th>
                                                <th style={{ padding: '0 20px 10px' }}>COLLEGE / INSTITUTION</th>
                                                <th style={{ padding: '0 20px 10px' }}>ACCOUNT STATUS</th>
                                                <th style={{ padding: '0 20px 10px' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getFilteredData().map(s => (
                                                <tr key={s.id} style={{ background: 'var(--bg-subtle)' }}>
                                                    <td style={{ padding: '20px', borderRadius: '16px 0 0 16px', fontWeight: '700' }}>{s.name}</td>
                                                    <td style={{ padding: '20px' }}>
                                                        <div style={{ fontSize: '14px' }}>{s.email}</div>
                                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.phone}</div>
                                                    </td>
                                                    <td style={{ padding: '20px' }}>{s.college}</td>
                                                    <td style={{ padding: '20px' }}>
                                                        <span className="badge badge-blue" style={{ background: 'white' }}>Active Member</span>
                                                    </td>
                                                    <td style={{ padding: '20px', borderRadius: '0 16px 16px 0' }}>
                                                        <button onClick={() => deleteStudent(s.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,0.15)', border: '1px solid #fecaca', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                            <Trash2 size={14} /> Ban
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showHostelForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '24px', backdropFilter: 'blur(8px)' }}>
                    <div className="card animate-fade" style={{ position: 'relative', width: '100%', maxWidth: '700px', padding: '48px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '40px' }}>
                        <button
                            onClick={() => { setShowHostelForm(false); setEditingHostelId(null); setNewHostel({ name: '', location: '', distance: '', price: '', description: '', amenities: '', images: '' }); }}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: '#111827', width: '40px', height: '40px', borderRadius: '50%', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#374151'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <span style={{ color: 'white', fontSize: '20px', fontWeight: '700', lineHeight: 1, userSelect: 'none' }}>✕</span>
                        </button>
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '32px' }}>{editingHostelId ? 'Update Property' : 'Register Property'}</h3>
                        </div>
                        <form onSubmit={handleSaveHostel} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px' }}>Hostel Name</label>
                                <input placeholder="e.g. Imperial Student Suites" value={newHostel.name} onChange={e => setNewHostel({ ...newHostel, name: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px' }}>Location / Area</label>
                                    <input placeholder="Green Valley" value={newHostel.location} onChange={e => setNewHostel({ ...newHostel, location: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px' }}>Distance from Campus</label>
                                    <input placeholder="0.5 km from Main Gate" value={newHostel.distance} onChange={e => setNewHostel({ ...newHostel, distance: e.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px' }}>Monthly Starting Price (₹)</label>
                                <input placeholder="5000" type="number" value={newHostel.price} onChange={e => setNewHostel({ ...newHostel, price: e.target.value })} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px' }}>Property Description</label>
                                <textarea placeholder="Share what makes this property special..." value={newHostel.description} onChange={e => setNewHostel({ ...newHostel, description: e.target.value })} style={{ height: '120px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px' }}>Amenities (WiFi, Food, Laundry...)</label>
                                <input placeholder="Comma separated list" value={newHostel.amenities} onChange={e => setNewHostel({ ...newHostel, amenities: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px' }}>High-res Image URLs (Direct Links)</label>
                                <input
                                    placeholder="Right-click on Google image and select 'Copy Image Address'"
                                    value={newHostel.images}
                                    onChange={e => setNewHostel({ ...newHostel, images: e.target.value })}
                                />
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Pro tip: Paste one or more direct links separated by commas.</p>
                            </div>
                            <button type="submit" className="btn-primary" style={{ height: '70px', borderRadius: '24px', fontSize: '20px', marginTop: '16px' }}>
                                {editingHostelId ? 'Apply Property Updates' : 'Publish Property Listing'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showRoomForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '24px', backdropFilter: 'blur(8px)' }}>
                    <div className="card animate-fade" style={{ position: 'relative', width: '100%', maxWidth: '600px', padding: '48px', borderRadius: '40px' }}>
                        <button
                            onClick={() => { setShowRoomForm(false); setEditingRoomId(null); setNewRoom({ hostelId: '', type: '', price: '', capacity: '', available: '' }); }}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: '#111827', width: '40px', height: '40px', borderRadius: '50%', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#374151'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <span style={{ color: 'white', fontSize: '20px', fontWeight: '700', lineHeight: 1, userSelect: 'none' }}>✕</span>
                        </button>
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '32px' }}>{editingRoomId ? 'Edit Configuration' : 'New Configuration'}</h3>
                        </div>
                        <form onSubmit={handleSaveRoom} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px' }}>Parent Property</label>
                                <select
                                    style={{ height: '64px', fontSize: '16px' }}
                                    value={newRoom.hostelId}
                                    onChange={e => setNewRoom({ ...newRoom, hostelId: e.target.value })}
                                    required
                                >
                                    <option value="">-- Choose a property --</option>
                                    {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px' }}>Room Type / Classification</label>
                                <input
                                    placeholder="e.g. Platinum Single AC"
                                    value={newRoom.type}
                                    onChange={e => setNewRoom({ ...newRoom, type: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px' }}>Monthly Rent (₹)</label>
                                    <input placeholder="0" type="number" value={newRoom.price} onChange={e => setNewRoom({ ...newRoom, price: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px' }}>Max Occupancy</label>
                                    <input placeholder="1" type="number" value={newRoom.capacity} onChange={e => setNewRoom({ ...newRoom, capacity: e.target.value })} required />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px' }}>Current Inventory (Available Rooms)</label>
                                <input placeholder="0" type="number" value={newRoom.available} onChange={e => setNewRoom({ ...newRoom, available: e.target.value })} required />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px' }}>Room Type Image URL</label>
                                <input
                                    placeholder="Paste a direct image link for this specific room"
                                    value={newRoom.image}
                                    onChange={e => setNewRoom({ ...newRoom, image: e.target.value })}
                                />
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Pro tip: Use a direct link (Right-click to Copy Image Address)</p>
                            </div>

                            <button type="submit" className="btn-primary" style={{ height: '70px', marginTop: '16px', borderRadius: '24px', fontSize: '20px' }}>
                                {editingRoomId ? 'Update Config' : 'Create Configuration'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 900px) {
                    .admin-layout { grid-template-columns: 1fr !important; }
                }
                table { border-collapse: separate; border-spacing: 0 8px; width: 100%; }
                td { transition: all 0.2s; }
                tr:hover td { background: #f1f5f9 !important; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
