/**
 * @param {number} bytes
 * @returns {string}
 */
const HumanReadableSize = (bytes) => {
  const power = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** power).toFixed(2)} ${['B', 'kB', 'MB', 'GB', 'TB'][power]}`;
};

export default HumanReadableSize;
