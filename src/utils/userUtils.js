export const getDisplayName = (user) => {
  if (!user) return '';
  return user.username || user.email || '';
}; 