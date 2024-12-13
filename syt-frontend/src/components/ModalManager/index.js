// src/components/ModalManager/index.jsx
import React from 'react';
import ActivityModal from '../Modals/ActivityModal';
import FlightModal from '../Modals/FlightModal';
import HotelModal from '../Modals/HotelModal';
import TransferModal from '../Modals/TransferModal';

const ModalManager = () => {
  return (
    <>
      <ActivityModal />
      <FlightModal />
      <HotelModal />
      <TransferModal />
    </>
  );
};

export default ModalManager;