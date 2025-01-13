// src/components/ModalManager/index.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeRoomChangeModal } from '../../redux/slices/roomChangeSlice';
import ActivityModal from '../Modals/ActivityModal';
import FlightModal from '../Modals/FlightModal';
import HotelModal from '../Modals/HotelModal';
import RoomChangeModal from '../Modals/RoomChangeModal';
import TransferModal from '../Modals/TransferModal';

const ModalManager = () => {
  const dispatch = useDispatch();
  const { 
    isModalOpen, 
    selectedHotel, 
    modalData, 
    initialized 
  } = useSelector((state) => state.roomChange);

  const handleRoomChangeClose = () => {
    dispatch(closeRoomChangeModal());
  };

  return (
    <>
      <ActivityModal />
      <FlightModal />
      <HotelModal />
      <TransferModal />
      {initialized && isModalOpen && selectedHotel && modalData && (
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
    </>
  );
};

export default ModalManager;