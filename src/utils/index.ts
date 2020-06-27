export * from './toCSSColor'
export * from './rgbToHex'
export * from './toCSSPTValue'
export * from './webFontLoader'
export * from './toCSSLineSpacing'
export * from './splitPage'

export const mmTopxConverter = (mm: number): number => mm * 3.7795275591
export const convert2Millimeter = (value: number): number => value * 3.7795275591
export const convert2Point = (value: number): number => value * 0.75
export const pxToMmConverter = (px: number): number => px / 3.7795275591

export function isNull(value: any): boolean {
  return !!(value === null)
}

export function isUndefined(value: any): boolean {
  return !!(value === undefined)
}

export function isNullOrUndefined(value: any): boolean {
  return isNull(value) || isUndefined(value)
}
