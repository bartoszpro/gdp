"use client";

import React, { useState } from "react";
import Map from "./components/Map";

export default function Home() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2023");

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    setIsDropdownOpen(false);
  };

  return (
    <div className='flex flex-col justify-center items-center h-screen bg-white'>
      <div className='relative font-[sans-serif] w-max mx-auto mb-4'>
        <button
          type='button'
          id='dropdownToggle'
          onClick={toggleDropdown}
          className='px-5 py-2.5 border border-gray-300 text-gray-800 text-sm outline-none bg-white hover:bg-gray-50'
        >
          Year: {selectedYear}
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='w-3 fill-gray-500 inline ml-3'
            viewBox='0 0 24 24'
          >
            <path
              fillRule='evenodd'
              d='M11.99997 18.1669a2.38 2.38 0 0 1-1.68266-.69733l-9.52-9.52a2.38 2.38 0 1 1 3.36532-3.36532l7.83734 7.83734 7.83734-7.83734a2.38 2.38 0 1 1 3.36532 3.36532l-9.52 9.52a2.38 2.38 0 0 1-1.68266.69734z'
              clipRule='evenodd'
              data-original='#000000'
            />
          </svg>
        </button>

        <ul
          id='dropdownMenu'
          className={`absolute ${
            isDropdownOpen ? "block" : "hidden"
          } shadow-[0_8px_19px_-7px_rgba(6,81,237,0.2)] bg-white py-2 z-[1000] min-w-full w-max divide-y max-h-96 overflow-auto`}
        >
          {["2023", "2022"].map((year) => (
            <li
              key={year}
              className='py-3 px-5 hover:bg-gray-50 text-gray-800 text-sm cursor-pointer'
              onClick={() => handleYearSelect(year)}
            >
              {year}
            </li>
          ))}
        </ul>
      </div>
      <div className='flex-grow flex justify-center items-center'>
        <Map selectedYear={selectedYear} />
      </div>
    </div>
  );
}
