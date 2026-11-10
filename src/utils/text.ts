export function toTitleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}
