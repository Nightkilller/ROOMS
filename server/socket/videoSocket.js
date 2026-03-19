// WebRTC Signaling via Socket.IO
// Relays SDP offers/answers and ICE candidates between users

let userSocketMap = null;
const activeCalls = new Map(); // roomID -> call info

const getSocketId = (userId) => {
    if (!userSocketMap) return null;
    const sockets = userSocketMap.get(userId?.toString());
    if (!sockets || sockets.size === 0) return null;
    return sockets.values().next().value;
};

module.exports = (io, socket, sharedUserSocketMap) => {
    if (sharedUserSocketMap) userSocketMap = sharedUserSocketMap;

    const userId = socket.userId?.toString();
    if (!userId) return;

    // ── 1. Caller initiates a call ──────────────────────────────────────
    socket.on('call-user', ({ targetUserId, callerName, callType = 'video' }) => {
        if (!targetUserId || targetUserId.toString() === userId) return;

        const roomID = [userId, targetUserId.toString()].sort().join('_');
        console.log(`[Call] call-user | roomID=${roomID} | caller=${userId} | type=${callType}`);

        if (activeCalls.has(roomID)) {
            socket.emit('call-error', { message: 'User is already on a call.' });
            return;
        }

        activeCalls.set(roomID, {
            callerId: userId,
            targetId: targetUserId.toString(),
            callType,
            startedAt: new Date(),
        });

        // Caller immediately joins the signaling room
        socket.join(`call_${roomID}`);
        console.log(`[Call] Caller ${userId} joined call_${roomID}`);

        const targetSocketId = getSocketId(targetUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit('incoming-call', {
                roomID,
                callerId: userId,
                callerName: callerName || 'Unknown',
                callType,
            });
            console.log(`[Call] Sent incoming-call to ${targetUserId} (socket=${targetSocketId})`);
        } else {
            activeCalls.delete(roomID);
            socket.leave(`call_${roomID}`);
            socket.emit('call-error', { message: 'User is currently offline.' });
            console.log(`[Call] Target ${targetUserId} offline — aborted`);
        }
    });

    // ── 2. Receiver accepts ─────────────────────────────────────────────
    socket.on('accept-call', ({ roomID, callerId }) => {
        if (!roomID || !callerId) return;
        console.log(`[Call] accept-call | roomID=${roomID} | acceptedBy=${userId}`);

        // Receiver joins the signaling room BEFORE any WebRTC signals are sent
        socket.join(`call_${roomID}`);
        console.log(`[Call] Receiver ${userId} joined call_${roomID}`);

        // Notify BOTH users — they start WebRTC only after this event
        io.to(`call_${roomID}`).emit('call-accepted', {
            acceptedBy: userId,
            roomID,
        });
        console.log(`[Call] Emitted call-accepted to room call_${roomID}`);
    });

    // ── 3. Receiver rejects ─────────────────────────────────────────────
    socket.on('reject-call', ({ roomID, callerId }) => {
        if (!roomID || !callerId) return;
        console.log(`[Call] reject-call | roomID=${roomID}`);

        activeCalls.delete(roomID);
        const callerSocketId = getSocketId(callerId);
        if (callerSocketId) {
            io.to(callerSocketId).emit('reject-call', { rejectedBy: userId, roomID });
        }
    });

    // ── 4. WebRTC Offer ─────────────────────────────────────────────────
    socket.on('webrtc-offer', ({ roomID, offer }) => {
        console.log(`[WebRTC] offer relayed | roomID=${roomID}`);
        socket.to(`call_${roomID}`).emit('webrtc-offer', { offer });
    });

    // ── 5. WebRTC Answer ────────────────────────────────────────────────
    socket.on('webrtc-answer', ({ roomID, answer }) => {
        console.log(`[WebRTC] answer relayed | roomID=${roomID}`);
        socket.to(`call_${roomID}`).emit('webrtc-answer', { answer });
    });

    // ── 6. ICE Candidate ────────────────────────────────────────────────
    socket.on('webrtc-ice-candidate', ({ roomID, candidate }) => {
        // Relay to the other peer without logging every candidate (too noisy)
        socket.to(`call_${roomID}`).emit('webrtc-ice-candidate', { candidate });
    });

    // ── 7. End call ─────────────────────────────────────────────────────
    socket.on('end-call', ({ roomID }) => {
        if (!roomID) return;
        console.log(`[Call] end-call | roomID=${roomID} | by=${userId}`);

        activeCalls.delete(roomID);
        io.to(`call_${roomID}`).emit('end-call', { roomID, endedBy: userId });

        // Make all sockets leave the call room
        const roomSockets = io.sockets.adapter.rooms.get(`call_${roomID}`);
        if (roomSockets) {
            for (const sid of roomSockets) {
                const s = io.sockets.sockets.get(sid);
                if (s) s.leave(`call_${roomID}`);
            }
        }
    });

    // ── 8. Disconnect cleanup ───────────────────────────────────────────
    socket.on('disconnect', () => {
        for (const [roomID, call] of activeCalls.entries()) {
            if (call.callerId === userId || call.targetId === userId) {
                console.log(`[Call] Disconnect cleanup | roomID=${roomID} | disconnected=${userId}`);
                activeCalls.delete(roomID);

                io.to(`call_${roomID}`).emit('end-call', { roomID, endedBy: userId });

                const roomSockets = io.sockets.adapter.rooms.get(`call_${roomID}`);
                if (roomSockets) {
                    for (const sid of roomSockets) {
                        const s = io.sockets.sockets.get(sid);
                        if (s) s.leave(`call_${roomID}`);
                    }
                }
            }
        }
    });
};
