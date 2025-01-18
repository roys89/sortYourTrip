import { Minus, Plus } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const ModifyTravelers = ({ travelersDetails, onUpdate }) => {
  const [type, setType] = useState(travelersDetails?.type || 'solo');
  const [rooms, setRooms] = useState(travelersDetails?.rooms || []);

  useEffect(() => {
    if (travelersDetails) {
      setType(travelersDetails.type);
      setRooms(travelersDetails.rooms);
    }
  }, [travelersDetails]);

  const handleTypeChange = (newType) => {
    let newRooms = [];
    switch (newType) {
      case 'solo':
        newRooms = [{ adults: [''] }]; // Solo: just one adult
        break;
      case 'couple':
        newRooms = [{ adults: ['', ''] }]; // Couple: two adults
        break;
      case 'family':
      case 'friends':
        newRooms = [{ adults: [], children: [] }];
        break;
      default:
        newRooms = [];
    }
    setType(newType);
    setRooms(newRooms);
    onUpdate({ type: newType, rooms: newRooms });
  };

  const handleAddRoom = () => {
    const newRooms = [...rooms, { adults: [], children: [] }];
    setRooms(newRooms);
    onUpdate({ type, rooms: newRooms });
  };

  const handleRemoveRoom = (roomIndex) => {
    const newRooms = rooms.filter((_, index) => index !== roomIndex);
    setRooms(newRooms);
    onUpdate({ type, rooms: newRooms });
  };

  const handleAddAdult = (roomIndex) => {
    const newRooms = [...rooms];
    const room = newRooms[roomIndex];
    const totalOccupants = room.adults.length + (room.children?.length || 0);
    
    if (room.adults.length < 3 && totalOccupants < 4) {
      newRooms[roomIndex].adults.push('');
      setRooms(newRooms);
      onUpdate({ type, rooms: newRooms });
    }
  };

  const handleAddChild = (roomIndex) => {
    const newRooms = [...rooms];
    if (!newRooms[roomIndex].children) return;
    
    if (newRooms[roomIndex].children.length < 2 && 
        newRooms[roomIndex].adults.length + newRooms[roomIndex].children.length < 4) {
      newRooms[roomIndex].children.push('');
      setRooms(newRooms);
      onUpdate({ type, rooms: newRooms });
    }
  };

  const handleRemoveAdult = (roomIndex, adultIndex) => {
    const newRooms = [...rooms];
    newRooms[roomIndex].adults.splice(adultIndex, 1);
    setRooms(newRooms);
    onUpdate({ type, rooms: newRooms });
  };

  const handleRemoveChild = (roomIndex, childIndex) => {
    const newRooms = [...rooms];
    if (!newRooms[roomIndex].children) return;
    
    newRooms[roomIndex].children.splice(childIndex, 1);
    setRooms(newRooms);
    onUpdate({ type, rooms: newRooms });
  };

  const handleAgeChange = (roomIndex, personType, personIndex, value) => {
    const newRooms = [...rooms];
    if (personType === 'children' && !newRooms[roomIndex].children) return;
    
    newRooms[roomIndex][personType][personIndex] = value;
    setRooms(newRooms);
    onUpdate({ type, rooms: newRooms });
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Traveler Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['solo', 'couple', 'family', 'friends'].map((travelType) => (
            <button
              key={travelType}
              onClick={() => handleTypeChange(travelType)}
              className={`px-4 py-3 rounded-lg border ${
                type === travelType
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:border-blue-400'
              } capitalize transition-colors`}
            >
              {travelType}
            </button>
          ))}
        </div>
      </div>

      {(type === 'family' || type === 'friends') && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Rooms</h3>
          <button
            onClick={handleAddRoom}
            className="flex items-center gap-1 px-2 py-1 text-sm border border-gray-300 rounded-lg hover:border-blue-400"
          >
            <Plus className="h-4 w-4" />
            Add Room
          </button>
        </div>
      )}

      <div className="space-y-6">
        {rooms.map((room, roomIndex) => (
          <div key={roomIndex} className="p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Room {roomIndex + 1}</h3>
              {rooms.length > 1 && (type === 'family' || type === 'friends') && (
                <button
                  onClick={() => handleRemoveRoom(roomIndex)}
                  className="p-1 text-red-500 hover:text-red-600 rounded-full hover:bg-red-50"
                >
                  <Minus className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className={`${type === 'couple' ? 'block' : 'grid md:grid-cols-2 gap-6'}`}>
              {/* Adults Section */}
              <div className="border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center p-4 pb-3">
                  <h4 className="font-medium">Adults</h4>
                  {(type === 'family' || type === 'friends') && room.adults.length < 3 && 
                   room.adults.length + (room.children?.length || 0) < 4 && (
                    <button
                      onClick={() => handleAddAdult(roomIndex)}
                      className="flex items-center gap-1 px-2 py-1 text-sm border border-gray-300 rounded-lg hover:border-blue-400"
                    >
                      <Plus className="h-4 w-4" />
                      Add Adult
                    </button>
                  )}
                </div>
                <div className="px-4 pb-4">
                  {type === 'solo' ? (
                    // Solo: Single input
                    <input
                      type="number"
                      value={room.adults[0]}
                      onChange={(e) => handleAgeChange(roomIndex, 'adults', 0, e.target.value)}
                      placeholder="Age"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : type === 'couple' ? (
                    // Couple: Full width inputs with side by side labels
                    <div className="grid grid-cols-2 gap-4">
                      {room.adults.map((age, adultIndex) => (
                        <div key={adultIndex}>
                          <span className="text-sm text-gray-600 block mb-2">Adult {adultIndex + 1}</span>
                          <input
                            type="number"
                            value={age}
                            onChange={(e) => handleAgeChange(roomIndex, 'adults', adultIndex, e.target.value)}
                            placeholder="Age"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Family/Friends: Adults with remove buttons
                    <div className="space-y-2">
                      {room.adults.map((age, adultIndex) => (
                        <div key={adultIndex} className="flex gap-2">
                          <input
                            type="number"
                            value={age}
                            onChange={(e) => handleAgeChange(roomIndex, 'adults', adultIndex, e.target.value)}
                            placeholder="Age"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleRemoveAdult(roomIndex, adultIndex)}
                            className="p-2 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <Minus className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Children Section - Only for family/friends */}
              {(type === 'family' || type === 'friends') && room.children && (
                <div className="border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center p-4 pb-3">
                    <h4 className="font-medium">Children</h4>
                    {room.children.length < 2 && 
                     room.adults.length + room.children.length < 4 && (
                      <button
                        onClick={() => handleAddChild(roomIndex)}
                        className="flex items-center gap-1 px-2 py-1 text-sm border border-gray-300 rounded-lg hover:border-blue-400"
                      >
                        <Plus className="h-4 w-4" />
                        Add Child
                      </button>
                    )}
                  </div>
                  <div className={`${room.children.length > 0 ? 'space-y-2 px-4 pb-4' : ''}`}>
                    {room.children.map((age, childIndex) => (
                      <div key={childIndex} className="flex gap-2">
                        <input
                          type="number"
                          value={age}
                          onChange={(e) => handleAgeChange(roomIndex, 'children', childIndex, e.target.value)}
                          placeholder="Age"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleRemoveChild(roomIndex, childIndex)}
                          className="p-2 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModifyTravelers;