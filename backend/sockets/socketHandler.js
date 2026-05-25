// socketHandler.js
const Bus = require('../models/Bus');
const { getRouteForBus } = require('../config/routingHelper');

module.exports = (io) => {
  // Track which drivers are currently online: Map<socketId, { busId, lat, lng, routePath }>
  const onlineDrivers = new Map();

  // Track waitlists: Map<busId, Set<socketId>>
  const waitlists = new Map();

  // Helper to emit waitlist update
  const emitWaitlistUpdate = (busId) => {
    const count = waitlists.has(busId) ? waitlists.get(busId).size : 0;
    io.emit('waitlistUpdate', { busId, count });
  };

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send currently online drivers to the newly connected client
    socket.emit('onlineDriversList', Array.from(onlineDrivers.values()));

    // When a driver emits their real GPS location
    socket.on('updateLocation', async (data) => {
      try {
        if (!data || !data.id) return;
        const { id, lat, lng, seats, driverName, busCode } = data;

        // Fetch or compute the premium street route coordinates
        let routePath = null;
        if (lat !== undefined && lng !== undefined) {
          routePath = await getRouteForBus(id, lat, lng);
        }

        // Build the update payload
        const updatePayload = { lastUpdated: new Date() };

        if (lat !== undefined && lng !== undefined) {
          updatePayload.currentLocation = { lat, lng };
        }
        if (seats !== undefined) {
          updatePayload.availableSeats = seats;
        }
        if (driverName !== undefined) {
          updatePayload.driverName = driverName;
        }
        if (busCode !== undefined) {
          updatePayload.busCode = busCode;
        }

        // Broadcast the real-time data IMMEDIATELY in-memory to reduce latency for 5000+ users
        io.emit('busUpdate', {
          id,
          lat,
          lng,
          seats,
          driverName,
          busCode,
          routePath, // Pass the premium, backend-computed street path directly to frontend
          lastUpdated: new Date().toISOString(),
        });

        // Persist to MongoDB asynchronously in the background to prevent thread block
        Bus.findByIdAndUpdate(id, updatePayload, { new: true })
          .then(updatedBus => {
            if (updatedBus) {
              onlineDrivers.set(socket.id, {
                busId: id,
                busNumber: updatedBus.busNumber,
                driverName: updatedBus.driverName,
                route: updatedBus.route,
                busCode: updatedBus.busCode || '',
                lat: lat !== undefined ? lat : updatedBus.currentLocation?.lat,
                lng: lng !== undefined ? lng : updatedBus.currentLocation?.lng,
                seats: seats !== undefined ? seats : updatedBus.availableSeats,
                routePath: routePath || (updatedBus.currentLocation?.lat ? [{ lat: updatedBus.currentLocation.lat, lng: updatedBus.currentLocation.lng }] : null),
              });
            }
          })
          .catch(err => {
            console.error('Background DB location update error:', err.message);
          });

        emitWaitlistUpdate(id);
      } catch (err) {
        console.error('Error in location update:', err.message);
      }
    });

    // Student joins waitlist for a specific bus
    socket.on('joinWaitlist', (data) => {
      try {
        if (!data || !data.busId) return;
        const { busId } = data;
        if (!waitlists.has(busId)) {
          waitlists.set(busId, new Set());
        }
        waitlists.get(busId).add(socket.id);
        emitWaitlistUpdate(busId);
      } catch (err) {
        console.error('Error in joinWaitlist:', err.message);
      }
    });

    // Student leaves waitlist
    socket.on('leaveWaitlist', (data) => {
      try {
        if (!data || !data.busId) return;
        const { busId } = data;
        if (waitlists.has(busId)) {
          waitlists.get(busId).delete(socket.id);
          emitWaitlistUpdate(busId);
        }
      } catch (err) {
        console.error('Error in leaveWaitlist:', err.message);
      }
    });

    // When a driver explicitly goes offline
    socket.on('driverGoingOffline', (data) => {
      try {
        onlineDrivers.delete(socket.id);
        io.emit('driverOffline', { busId: data?.busId, socketId: socket.id });
      } catch (err) {
        console.error('Error in driverGoingOffline:', err.message);
      }
    });

    // When an admin sends a notification
    socket.on('sendAdminAlert', (alert) => {
      try {
        io.emit('adminAlert', alert);
      } catch (err) {
        console.error('Error in sendAdminAlert:', err.message);
      }
    });

    socket.on('disconnect', () => {
      // Clean up online driver tracking
      const driverInfo = onlineDrivers.get(socket.id);
      if (driverInfo) {
        io.emit('driverOffline', { busId: driverInfo.busId, socketId: socket.id });
        onlineDrivers.delete(socket.id);
      }

      // Clean up from any waitlists
      for (const [busId, students] of waitlists.entries()) {
        if (students.has(socket.id)) {
          students.delete(socket.id);
          emitWaitlistUpdate(busId);
        }
      }

      console.log('Client disconnected:', socket.id);
    });
  });
};
