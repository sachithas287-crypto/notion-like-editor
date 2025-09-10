// Calendar helper functions
function getCalendarGrid(year, month) {
  const weeks = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekday = firstDay.getDay(); // Sunday = 0
  const daysInMonth = lastDay.getDate();

  // Previous month's days to show
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  let currentDay = 1;
  let nextMonthDay = 1;

  for (let week = 0; week < 6; week++) {
    const weekArr = [];
    for (let day = 0; day < 7; day++) {
      let dateObj = null;
      const gridIndex = week * 7 + day;
      if (gridIndex < firstWeekday) {
        // Previous month
        const prevDay = prevMonthLastDay - firstWeekday + day + 1;
        dateObj = new Date(year, month -1, prevDay);
        weekArr.push({ dateObj, currentMonth: false });
      } else if (currentDay > daysInMonth) {
        // Next month
        dateObj = new Date(year, month +1, nextMonthDay++);
        weekArr.push({ dateObj, currentMonth: false });
      } else {
        // Current month
        dateObj = new Date(year, month, currentDay++);
        weekArr.push({ dateObj, currentMonth: true });
      }
    }
    weeks.push(weekArr);
    // Stop if last day reached and next month days filled
    if (currentDay > daysInMonth && nextMonthDay > 7) break;
  }
  return weeks;
}