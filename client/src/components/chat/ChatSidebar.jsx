import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { searchUsers, createDM, createGroup } from '../../api/chatApi';

export default function ChatSidebar({ onSelectChat }) {
    const { user } = useAuth();
    const { chats, loadChats, activeChat, onlineUsers, unreadMap } = useChat();
    const myId = user?.id || user?._id;

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const searchTimer = useRef(null);

    // ── Search users ─────────────────────────────────────────
    useEffect(() => {
        clearTimeout(searchTimer.current);
        if (searchQuery.length < 2) { setSearchResults([]); return; }
        setSearching(true);
        searchTimer.current = setTimeout(async () => {
            try {
                const { data } = await searchUsers(searchQuery);
                setSearchResults(data);
            } catch { setSearchResults([]); }
            setSearching(false);
        }, 300);
        return () => clearTimeout(searchTimer.current);
    }, [searchQuery]);

    // ── Start DM ─────────────────────────────────────────────
    const startDM = async (userId) => {
        try {
            const { data } = await createDM(userId);
            await loadChats();
            onSelectChat(data);
            setSearchQuery('');
            setSearchResults([]);
        } catch (err) {
            console.error('Start DM error:', err);
        }
    };

    // ── Create group ─────────────────────────────────────────
    const handleCreateGroup = async () => {
        if (selectedUsers.length < 1) return;
        try {
            const { data } = await createGroup(
                groupName || 'Group Chat',
                selectedUsers.map(u => u._id)
            );
            await loadChats();
            onSelectChat(data);
            setShowNewGroup(false);
            setGroupName('');
            setSelectedUsers([]);
            setSearchQuery('');
            setSearchResults([]);
        } catch (err) {
            console.error('Create group error:', err);
        }
    };

    const toggleUserSelection = (u) => {
        setSelectedUsers(prev =>
            prev.some(s => s._id === u._id)
                ? prev.filter(s => s._id !== u._id)
                : [...prev, u]
        );
    };

    // ── Get display name for a chat ──────────────────────────
    const getChatName = (chat) => {
        if (chat.type === 'group') return chat.name || 'Group Chat';
        const other = chat.participants?.find(p => {
            const pid = p._id || p;
            return pid.toString() !== myId;
        });
        return other?.fullName || 'User';
    };

    const getChatAvatar = (chat) => {
        const name = getChatName(chat);
        return name[0]?.toUpperCase() || '?';
    };

    const isOnline = (chat) => {
        if (chat.type === 'group') return false;
        const other = chat.participants?.find(p => (p._id || p).toString() !== myId);
        return onlineUsers.has(other?._id);
    };

    return (
        <div className="flex flex-col h-full bg-dark-800 border-r border-brand-500/10">
            {/* Header */}
            <div className="p-4 border-b border-brand-500/10 shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold">Messages</h2>
                    <button
                        onClick={() => setShowNewGroup(!showNewGroup)}
                        className="text-xs bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 px-3 py-1.5 rounded-lg transition"
                        title="New group chat"
                    >
                        + Group
                    </button>
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="input-field py-2 text-sm"
                />
            </div>

            {/* New Group Panel */}
            {showNewGroup && (
                <div className="p-3 border-b border-brand-500/10 bg-dark-700 animate-fade-in">
                    <input
                        type="text"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        placeholder="Group name"
                        className="input-field py-2 text-sm mb-2"
                        maxLength={100}
                    />
                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                            {selectedUsers.map(u => (
                                <span key={u._id}
                                    className="text-xs bg-brand-500/20 text-brand-300 px-2 py-1 rounded-full flex items-center gap-1">
                                    {u.fullName}
                                    <button onClick={() => toggleUserSelection(u)} className="hover:text-red-400">×</button>
                                </span>
                            ))}
                        </div>
                    )}
                    <button onClick={handleCreateGroup} disabled={selectedUsers.length < 1}
                        className="btn-primary w-full py-2 text-sm disabled:opacity-40">
                        Create Group ({selectedUsers.length})
                    </button>
                </div>
            )}

            {/* Search Results */}
            {searchQuery.length >= 2 && (
                <div className="border-b border-brand-500/10 max-h-48 overflow-y-auto">
                    {searching && (
                        <p className="text-xs text-dark-200 p-3 text-center">Searching...</p>
                    )}
                    {!searching && searchResults.length === 0 && (
                        <p className="text-xs text-dark-200 p-3 text-center">No users found</p>
                    )}
                    {searchResults.map(u => (
                        <div key={u._id}
                            className="flex items-center gap-3 p-3 hover:bg-dark-700 cursor-pointer transition"
                            onClick={() => showNewGroup ? toggleUserSelection(u) : startDM(u._id)}>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center text-sm font-bold shrink-0">
                                {u.fullName[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{u.fullName}</p>
                                <p className="text-xs text-dark-300 truncate">{u.email}</p>
                            </div>
                            {showNewGroup && selectedUsers.some(s => s._id === u._id) && (
                                <span className="text-brand-400 text-sm">✓</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                {chats.length === 0 && searchQuery.length < 2 && (
                    <div className="text-center text-dark-300 text-sm py-12 px-4">
                        <p className="text-2xl mb-2">💬</p>
                        <p>No conversations yet.</p>
                        <p className="text-xs mt-1">Search for users to start chatting!</p>
                    </div>
                )}
                {chats.map(chat => {
                    const isActive = activeChat?._id === chat._id;
                    const unread = unreadMap[chat._id] || 0;
                    return (
                        <div key={chat._id}
                            onClick={() => onSelectChat(chat)}
                            className={`flex items-center gap-3 p-3 cursor-pointer transition border-l-2 ${isActive
                                    ? 'bg-brand-500/10 border-l-brand-500'
                                    : 'border-l-transparent hover:bg-dark-700'
                                }`}>
                            <div className="relative shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${chat.type === 'group'
                                        ? 'bg-gradient-to-br from-cyan-600 to-cyan-500'
                                        : 'bg-gradient-to-br from-brand-600 to-brand-500'
                                    }`}>
                                    {chat.type === 'group' ? '👥' : getChatAvatar(chat)}
                                </div>
                                {isOnline(chat) && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-800 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium truncate">{getChatName(chat)}</p>
                                    {chat.lastMessage?.timestamp && (
                                        <span className="text-[10px] text-dark-300 shrink-0 ml-2">
                                            {formatTime(chat.lastMessage.timestamp)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-dark-200 truncate">
                                        {chat.lastMessage?.text || 'No messages yet'}
                                    </p>
                                    {unread > 0 && (
                                        <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2 shrink-0">
                                            {unread > 99 ? '99+' : unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 86400000 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 604800000) {
        return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
