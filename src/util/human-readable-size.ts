export default function HumanReadableSize(bytes: number | undefined): string {
  if (!bytes) bytes = 0;

  const power = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** power).toFixed(2)} ${['B', 'kB', 'MB', 'GB', 'TB'][power]}`;
}
