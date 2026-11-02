import React, { useState, useRef, useEffect } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import "./ReportsDatePicker.css";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const padZero = (n) => String(n).padStart(2, "0");

const toDateString = (year, month, day) => {
  return `${year}-${padZero(month + 1)}-${padZero(day)}`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
};

const ReportsDatePicker = ({
  value,
  onChange,
  min,
  max,
  disabled = false,
  placeholder = "Select date",
  title = "Date",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Month currently in view in the calendar
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    if (max) {
      const [y, m] = max.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  // Sync viewDate when popup opens or value changes
  useEffect(() => {
    if (isOpen) {
      if (value) {
        const [y, m] = value.split("-").map(Number);
        setViewDate(new Date(y, m - 1, 1));
      } else if (max) {
        const [y, m] = max.split("-").map(Number);
        setViewDate(new Date(y, m - 1, 1));
      }
    }
  }, [isOpen, value, max]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Check if next month is completely beyond max
  const isNextMonthDisabled = (() => {
    if (!max) return false;
    const firstOfNextMonth = toDateString(viewYear, viewMonth + 1, 1);
    return firstOfNextMonth > max;
  })();

  // Check if prev month is completely before min
  const isPrevMonthDisabled = (() => {
    if (!min) return false;
    const lastOfPrevMonth = new Date(viewYear, viewMonth, 0);
    const lastOfPrevStr = toDateString(
      lastOfPrevMonth.getFullYear(),
      lastOfPrevMonth.getMonth(),
      lastOfPrevMonth.getDate()
    );
    return lastOfPrevStr < min;
  })();

  // Build grid days
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({ key: `blank-${i}`, isBlank: true });
  }
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = toDateString(viewYear, viewMonth, d);
    const isPastMax = max ? dateStr > max : false;
    const isBeforeMin = min ? dateStr < min : false;
    const isDisabled = isPastMax || isBeforeMin;
    const isSelected = value === dateStr;

    days.push({
      key: dateStr,
      dayNumber: d,
      dateStr,
      isDisabled,
      isSelected,
    });
  }

  const handleDaySelect = (dayObj, e) => {
    e.stopPropagation();
    if (dayObj.isDisabled || dayObj.isBlank) return;
    onChange(dayObj.dateStr);
    setIsOpen(false);
  };

  return (
    <div className="reports-datepicker-wrapper" ref={containerRef}>
      <button
        type="button"
        className={`reports-datepicker-btn ${isOpen ? "active" : ""}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        title={title}
      >
        <span className="reports-datepicker-text">
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <FiCalendar className="reports-datepicker-icon" />
      </button>

      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="reports-datepicker-backdrop"
            onClick={() => setIsOpen(false)}
          />

          <div className="reports-datepicker-calendar" role="dialog" aria-modal="true">
            <div className="reports-datepicker-header">
              <span className="reports-datepicker-title">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <div className="reports-datepicker-nav">
                <button
                  type="button"
                  className="reports-datepicker-nav-btn"
                  onClick={handlePrevMonth}
                  disabled={isPrevMonthDisabled}
                  aria-label="Previous month"
                >
                  <FiChevronLeft />
                </button>
                <button
                  type="button"
                  className="reports-datepicker-nav-btn"
                  onClick={handleNextMonth}
                  disabled={isNextMonthDisabled}
                  aria-label="Next month"
                >
                  <FiChevronRight />
                </button>
                <button
                  type="button"
                  className="reports-datepicker-close-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="reports-datepicker-weekdays">
              {WEEKDAYS.map((wd) => (
                <span key={wd} className="reports-datepicker-weekday">
                  {wd}
                </span>
              ))}
            </div>

            <div className="reports-datepicker-days">
              {days.map((item) => {
                if (item.isBlank) {
                  return (
                    <div
                      key={item.key}
                      className="reports-datepicker-day blank"
                    />
                  );
                }
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`reports-datepicker-day ${
                      item.isSelected ? "selected" : ""
                    } ${item.isDisabled ? "disabled" : ""}`}
                    disabled={item.isDisabled}
                    onClick={(e) => handleDaySelect(item, e)}
                  >
                    {item.dayNumber}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsDatePicker;
