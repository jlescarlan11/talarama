export const validateWatchedDate = (dateString: string): boolean => {
  if (!dateString) return false;

  const selectedDate = new Date(dateString);
  const today = new Date();

  // Set time to end of day for comparison
  today.setHours(23, 59, 59, 999);

  // Check if date is valid
  if (isNaN(selectedDate.getTime())) return false;

  return selectedDate <= today;
};

export const formatDateForInput = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString().split("T")[0];
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};
