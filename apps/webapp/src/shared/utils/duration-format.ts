import { differenceInDays } from 'date-fns';

const formatDuration = (startDate: string, endDate: string | null) => {
  if (!endDate) {
    return 'Permanent';
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = differenceInDays(end, start);

  if (days === 1) {
    return '1 day';
  } else if (days < 7) {
    return `${days} days`;
  } else if (days < 30) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  } else {
    const months = Math.round(days / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
}

export default formatDuration;
