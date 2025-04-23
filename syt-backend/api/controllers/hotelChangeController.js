  async function searchHotels(req, res) {
    try {
      log.info(`searchHotels: ${req.body.itinerary_id}`);

      // Extract params
      const itineraryId = req.body.itinerary_id;
      const location = req.body.location;
      const locationId = req.body.locationId;
      const dateCheckIn = req.body.dateCheckIn;
      const dateCheckOut = req.body.dateCheckOut;
      const hotelIds = req.body.hotelIds; // Keep this for backward compatibility
      const hotelId = req.body.hotelId; // Add direct hotelId handling
      const paxes = req.body.paxCount;
      const roomCount = req.body.roomCount;

      log.debug(`searchHotels: Searching for hotels in ${location} (locationId: ${locationId}), date range: ${dateCheckIn} to ${dateCheckOut}`);
      if (hotelId) {
        log.debug(`searchHotels: Requested specific hotel ID: ${hotelId}`);
      } else if (hotelIds && hotelIds.length > 0) {
        log.debug(`searchHotels: Requested specific hotel IDs: ${hotelIds.join(', ')}`);
      }

      // Get token
      const token = req.headers.authorization;
      if (!token) {
        log.error('searchHotels: No auth token provided');
        return res.status(401).send({ message: 'No authorization token was found' });
      }

      // Build search params - if we have hotelId, pass it directly (not as array)
      const searchParams = {
        itineraryId,
        location,
        locationId,
        dateCheckIn,
        dateCheckOut,
        hotelId,      // Add hotelId as a separate parameter
        hotelIds,     // Keep this for backward compatibility
        paxes,
        roomCount,
        token
      };

      // ... existing code ...
    } catch (error) {
      log.error('searchHotels: Error', error);
      return res.status(500).send({ message: 'An error occurred while searching for hotels' });
    }
  } 