/**
 * Generates an .ics file content for a calendar event
 * @param {Object} event - Event object with properties: name, date, time, description, location, organizer, link
 * @returns {string} - ICS file content
 */
export const generateICS = (event) => {
  // Helper function to format date for ICS (YYYYMMDDTHHmmssZ)
  const formatICSDate = (dateString, timeString = null) => {
    if (!dateString) return null;
    
    let date;
    // Handle dd/mm/yyyy format
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      date = new Date(`${year}-${month}-${day}`);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return null;
    
    // If time is provided, parse it
    if (timeString) {
      const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        date.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
      }
    } else {
      // Default to 10:00 AM if no time provided
      date.setHours(10, 0, 0, 0);
    }
    
    // Format as YYYYMMDDTHHmmssZ
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };
  
  // Helper function to escape text for ICS format
  const escapeICS = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };
  
  const startDate = formatICSDate(event.date, event.time);
  if (!startDate) {
    throw new Error('Event must have a valid date');
  }
  
  // Parse start date to calculate end date (1 hour later)
  // startDate is in format YYYYMMDDTHHmmssZ
  const startYear = parseInt(startDate.slice(0, 4), 10);
  const startMonth = parseInt(startDate.slice(4, 6), 10) - 1;
  const startDay = parseInt(startDate.slice(6, 8), 10);
  const startHour = parseInt(startDate.slice(9, 11), 10);
  const startMin = parseInt(startDate.slice(11, 13), 10);
  const startSec = parseInt(startDate.slice(13, 15), 10);
  
  const startDateObj = new Date(Date.UTC(startYear, startMonth, startDay, startHour, startMin, startSec));
  const endDateObj = new Date(startDateObj);
  endDateObj.setUTCHours(endDateObj.getUTCHours() + 1);
  
  // Format end date
  const endYear = endDateObj.getUTCFullYear();
  const endMonth = String(endDateObj.getUTCMonth() + 1).padStart(2, '0');
  const endDay = String(endDateObj.getUTCDate()).padStart(2, '0');
  const endHours = String(endDateObj.getUTCHours()).padStart(2, '0');
  const endMinutes = String(endDateObj.getUTCMinutes()).padStart(2, '0');
  const endSeconds = String(endDateObj.getUTCSeconds()).padStart(2, '0');
  const endDateStr = `${endYear}${endMonth}${endDay}T${endHours}${endMinutes}${endSeconds}Z`;
  
  // Generate DTSTAMP (current date/time)
  const now = new Date();
  const stampYear = now.getUTCFullYear();
  const stampMonth = String(now.getUTCMonth() + 1).padStart(2, '0');
  const stampDay = String(now.getUTCDate()).padStart(2, '0');
  const stampHours = String(now.getUTCHours()).padStart(2, '0');
  const stampMinutes = String(now.getUTCMinutes()).padStart(2, '0');
  const stampSeconds = String(now.getUTCSeconds()).padStart(2, '0');
  const dtStamp = `${stampYear}${stampMonth}${stampDay}T${stampHours}${stampMinutes}${stampSeconds}Z`;
  
  // Generate unique ID
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}@blau-tech`;
  
  // Build description with link if available
  let description = event.description || '';
  if (event.link) {
    if (description) {
      description += '\\n\\n';
    }
    description += `Event Link: ${event.link}`;
  }
  
  // Build ICS content
  const eventTitle = `${event.name} — BT 🩵`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Blau Tech//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDateStr}`,
    `SUMMARY:${escapeICS(eventTitle)}`,
  ];
  
  if (description) {
    lines.push(`DESCRIPTION:${escapeICS(description)}`);
  }
  
  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`);
  }
  
  if (event.organizer) {
    lines.push(`ORGANIZER:CN=${escapeICS(event.organizer)}`);
  }
  
  if (event.link) {
    lines.push(`URL:${event.link}`);
  }
  
  lines.push(
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  );
  
  return lines.join('\r\n');
};

/**
 * Downloads an event as an .ics file
 * @param {Object} event - Event object
 */
export const downloadICS = (event) => {
  try {
    const icsContent = generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating ICS file:', error);
    alert('Unable to generate calendar file. Please ensure the event has a valid date.');
  }
};

