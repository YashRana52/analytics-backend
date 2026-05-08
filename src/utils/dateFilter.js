export function getDateFilter(query) {
  const { startDate, endDate } = query;

  const filter = {};

  if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }

  return filter;
}
