import { Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DestinationForm = () => {
  const [open, setOpen] = useState(false);
  const [promotedCountries, setPromotedCountries] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const removeDuplicates = (array) => {
    const uniqueItems = new Set();
    return array.filter(item => {
      if (!uniqueItems.has(item.name)) {
        uniqueItems.add(item.name);
        return true;
      }
      return false;
    });
  };

  useEffect(() => {
    const fetchPromotedCountries = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/destinations/promoted-countries');
        const data = await response.json();
        const formattedCountries = removeDuplicates(
          data.countries.map(country => ({ name: country, type: 'country' }))
        );
        setPromotedCountries(formattedCountries);
      } catch (error) {
        console.error('Error fetching promoted countries:', error);
      }
    };
    fetchPromotedCountries();
  }, []);

  const handleSearch = async (value) => {
    setQuery(value);
    setOpen(true);
    
    if (value.length > 2) {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:5000/api/destinations/search?query=${encodeURIComponent(value)}`
        );
        const data = await response.json();
        const deduplicatedResults = removeDuplicates(data);
        setSearchResults(deduplicatedResults);
      } catch (error) {
        console.error('Error searching destinations:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelect = (selectedOption) => {
    if (selectedOption) {
      const { name, type, destination_id, country, continent, ranking, imageUrl } = selectedOption;

      if (type === 'city') {
        navigate('/itinerary-inquiry', {
          state: {
            destination: name,
            destinationType: type,
            destination_id,
            country,
            continent,
            ranking,
            imageUrl
          },
        });
      } else {
        navigate('/itinerary-inquiry', {
          state: {
            destination: name,
            destinationType: type,
          },
        });
      }
    }
    setOpen(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 
                    backdrop-blur-md bg-opacity-50 dark:bg-opacity-50">
        <div className="relative" ref={inputRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search cities, countries, or continents..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            className="w-full h-12 pl-10 pr-4 text-base rounded-xl border-2 border-gray-200 
                     dark:border-gray-700 bg-transparent
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                     placeholder-gray-400 dark:placeholder-gray-500
                     text-gray-900 dark:text-gray-100"
          />
        </div>

        {open && (
          <div 
            ref={dropdownRef}
            className="absolute left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-xl
                     border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
                     shadow-lg z-50"
          >
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Searching...
              </div>
            ) : (searchResults.length > 0 || promotedCountries.length > 0) ? (
              <ul className="py-2">
                {(searchResults.length > 0 ? searchResults : promotedCountries).map((option) => (
                  <li
                    key={option.name}
                    onClick={() => handleSelect(option)}
                    className="px-4 py-3 flex items-center justify-between cursor-pointer
                             hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="text-gray-900 dark:text-gray-100">{option.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {option.type}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No results found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DestinationForm;