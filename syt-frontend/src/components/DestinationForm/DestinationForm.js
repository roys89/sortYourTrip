import { useTheme } from '@mui/material';
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
  const theme = useTheme();

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

  const styles = {
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
    color: theme.palette.text.primary,
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <div className="relative w-full" ref={inputRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search cities, countries, or continents..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          style={styles}
          className="w-full h-12 pl-10 pr-4 text-base rounded-xl 
                   border border-gray-200 dark:border-gray-700
                   focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                   placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {open && (
        <div 
          ref={dropdownRef}
          style={styles}
          className="w-full absolute mt-2 max-h-96 overflow-y-auto rounded-xl
                   border border-gray-200 dark:border-gray-700 
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
                  style={styles}
                  className="px-4 py-3 flex items-center justify-between cursor-pointer
                           hover:bg-gray-50/80 dark:hover:bg-gray-700/50"
                >
                  <span>{option.name}</span>
                  <span className="text-sm text-gray-500 capitalize ml-4">
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
  );
};

export default DestinationForm;