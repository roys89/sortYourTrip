// src/components/ModalManager/index.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeSeatModal } from '../../redux/slices/flightSlice';
import { closeRoomChangeModal } from '../../redux/slices/roomChangeSlice';
import ActivityModal from '../Modals/ActivityModal';
import FlightModal from '../Modals/FlightModal';
import HotelModal from '../Modals/HotelModal';
import RoomChangeModal from '../Modals/RoomChangeModal';
import SeatSelectionModal from '../Modals/SeatSelectionModal';
import TransferModal from '../Modals/TransferModal';

const ModalManager = () => {
  const dispatch = useDispatch();
  const { 
    isModalOpen: isRoomModalOpen, 
    selectedHotel, 
    modalData, 
    initialized 
  } = useSelector((state) => state.roomChange);

  const {
    isSeatModalOpen,
    selectedFlight,
    seatSelectionLoading
  } = useSelector((state) => state.flights);

  const handleRoomChangeClose = () => {
    dispatch(closeRoomChangeModal());
  };

  const handleSeatModalClose = () => {
    dispatch(closeSeatModal());
  };

  return (
    <>
      <ActivityModal />
      <FlightModal />
      <HotelModal />
      <TransferModal />
      {initialized && isRoomModalOpen && selectedHotel && modalData && (
        <RoomChangeModal
          hotel={selectedHotel}
          hotelId={modalData.hotelId}
          traceId={modalData.traceId}
          onClose={handleRoomChangeClose}
          isLoading={false}
          itineraryToken={modalData.itineraryToken}
          inquiryToken={modalData.inquiryToken}
          city={modalData.city}
          date={modalData.date}
          dates={modalData.dates}
          existingPrice={modalData.existingPrice}
        />
      )}
      {selectedFlight && isSeatModalOpen && (
        <SeatSelectionModal
          isOpen={isSeatModalOpen}
          onClose={handleSeatModalClose}
          flightData={selectedFlight.flightData}
          maxSeats={
            selectedFlight.travelersDetails.type === 'SOLO' 
              ? 1 
              : selectedFlight.travelersDetails.type === 'COUPLE' 
                ? 2 
                : selectedFlight.travelersDetails.rooms?.reduce(
                    (total, room) => total + (room.adults?.length || 0) + (room.children?.length || 0), 
                    0
                  ) || 1
          }
          isLoading={seatSelectionLoading}
          inquiryToken={selectedFlight.inquiryToken}
          itineraryToken={selectedFlight.itineraryToken}
        />
      )}
    </>
  );
};

export default ModalManager;