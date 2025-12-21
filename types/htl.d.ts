declare module "htl" {
  export const html: (template: readonly string[], ...values: unknown[]) => HTMLElement;
  export const svg: (template: readonly string[], ...values: unknown[]) => SVGElement;
}
