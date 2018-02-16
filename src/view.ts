export const calcWidth = (text: string) => (typeof text !== "string" ? 1 : Math.ceil((text.length + 3) / 6));
