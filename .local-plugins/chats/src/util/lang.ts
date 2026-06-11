export function classNames(
  displayClass?: string,
  ...classes: string[]
): string {
  const result = classes.filter(Boolean)
  if (displayClass) {
    result.push(displayClass)
  }
  return result.join(" ")
}
