/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const files = [
  ...fs.readdirSync("components").filter((f) => f.endsWith(".tsx")).map((f) => path.join("components", f)),
  ...fs.readdirSync("app").filter((f) => f.endsWith(".tsx")).map((f) => path.join("app", f)),
];

const tokens = new Set();
const tokenRe = /(?:[a-z0-9-]+:)*(bg|text|border|ring|decoration)-\[(#[0-9a-fA-F]{6})\](?:\/(\d+))?/g;
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(tokenRe)) {
    const full = match[0];
    const prefix = full.slice(0, full.lastIndexOf(match[1] + "-["));
    tokens.add(`${match[1]}|${match[2].toLowerCase()}|${match[3] ?? ""}|${prefix}`);
  }
}

function hexToRgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}
function rgbToHsl(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}
function rgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const bgManual = {
  "#f6f2e8": "#141810",
  "#f6f2e7": "#141810",
  "#fcfaf5": "#1d221a",
  "#fcfaf4": "#1d221a",
  "#fdfbf6": "#1f251c",
  "#fffdf9": "#232920",
  "#fffdf8": "#232920",
  "#fbf9f2": "#222820",
  "#fbf8f1": "#1f251c",
  "#fdfaf4": "#20261d",
  "#fffaf7": "#20261d",
  "#faf7f0": "#232920",
  "#f9f5ed": "#20261d",
  "#f8f5ed": "#1d221a",
  "#f8f4ec": "#232920",
  "#f8f4e8": "#232920",
  "#f7f3ea": "#1d221a",
  "#f7f2e8": "#20261d",
  "#f7f2e7": "#20261d",
  "#f5f1e8": "#20261d",
  "#f5f0e7": "#20261d",
  "#f4efe5": "#242a21",
  "#f3efe6": "#242a21",
  "#f1ede4": "#262c23",
  "#f0ebe1": "#262c23",
  "#efe9db": "#282e24",
  "#eef4e9": "#223126",
  "#eaf4e8": "#223126",
  "#e8f2e5": "#223126",
  "#e8f1e2": "#223126",
  "#eaf1e6": "#223126",
  "#eaf1e4": "#223126",
  "#e9f2e7": "#223126",
  "#f3f8f0": "#223126",
  "#f8fcf4": "#213024",
  "#f1f7ed": "#223126",
  "#f1f7ec": "#223126",
  "#f9fcf6": "#223126",
  "#f0f7ec": "#213024",
  "#f3f8ef": "#223126",
  "#eef2e9": "#242b22",
  "#f4f5ec": "#242b22",
  "#fbf2d8": "#352d1d",
  "#fbf1d0": "#352d1d",
  "#fcf4de": "#352f1e",
  "#f9f0dc": "#342b1b",
  "#fbf3d8": "#352d1c",
  "#fdf9ea": "#332d1c",
  "#fdf8e9": "#332d1c",
  "#f8ebc3": "#3a311b",
  "#f5e6b8": "#3a311b",
  "#f7edc8": "#382f1d",
  "#f6e7b7": "#3a311c",
  "#faeae5": "#372420",
  "#f9e6df": "#382621",
  "#fdf3f0": "#36241f",
  "#fdf4f1": "#36241f",
  "#fdf3f2": "#36241f",
  "#fdf5ee": "#33271f",
  "#faeee6": "#33271f",
  "#faece7": "#362420",
  "#fbf0e8": "#33271f",
  "#fbf0eb": "#36241f",
  "#f8e2de": "#3b2721",
  "#f7e3d4": "#38291f",
  "#f7e2dc": "#3b2621",
  "#f7e1da": "#3b2621",
  "#f1d5ce": "#402a24",
  "#f1eef8": "#292535",
  "#f7f5fd": "#292535",
  "#eeecf8": "#292535",
  "#ede9f8": "#2a2737",
  "#f1edf7": "#292535",
  "#f2f8fa": "#1f2b2f",
  "#e4f0f3": "#1f2b2f",
  "#eaf0f3": "#1f2b2f",
  "#e8f1e2": "#223126",
  "#fcf6e6": "#332c1d",
  "#f9ebe6": "#362420",
  "#f9f6ef": "#20261d",
  "#f6f1e7": "#242a21",
  "#f1ece1": "#20261d",
  "#f1ebe0": "#20261d",
  "#f3eee3": "#20261d",
};

const textManual = {
  "#2a2d24": "#ece9dd",
  "#2d3128": "#ece9dd",
  "#2e3229": "#ece9dd",
  "#30332a": "#ece9dd",
  "#34372e": "#e6e3d7",
  "#31342b": "#e6e3d7",
  "#2c2f26": "#ece9dd",
  "#383b31": "#dfdcd0",
  "#3a3d33": "#dfdcd0",
  "#3b3e34": "#dfdcd0",
  "#3c3f35": "#dfdcd0",
  "#474a3f": "#cdcbbf",
  "#4b4e43": "#cdcbbf",
  "#4b4a3f": "#cdcbbf",
  "#55594d": "#bfbdb1",
  "#5e6155": "#bfbdb1",
  "#5f6156": "#bfbdb1",
  "#65685c": "#b3b3a6",
  "#686b5e": "#b3b3a6",
  "#6b6c60": "#b3b3a6",
  "#74786a": "#a4a698",
  "#74766a": "#a4a698",
  "#717469": "#a4a698",
  "#707367": "#a4a698",
  "#777a6d": "#a4a698",
  "#8d897c": "#96998c",
  "#8c887b": "#96998c",
  "#898579": "#96998c",
  "#8a8679": "#96998c",
  "#888377": "#96998c",
  "#858277": "#96998c",
  "#8b887d": "#96998c",
  "#9a9589": "#8f9285",
  "#9b978b": "#8f9285",
  "#9d988c": "#8f9285",
  "#9e998d": "#8f9285",
  "#a09b8f": "#8f9285",
  "#a09b90": "#8f9285",
  "#a19c90": "#8f9285",
  "#a19b8f": "#8f9285",
  "#a29d91": "#8f9285",
  "#a39e92": "#8f9285",
  "#a8a296": "#8f9285",
  "#aaa498": "#898c80",
  "#aaa69b": "#898c80",
  "#aaa599": "#898c80",
  "#aaa497": "#898c80",
  "#a9a498": "#898c80",
  "#a7a296": "#898c80",
  "#a6a195": "#898c80",
  "#a49f93": "#898c80",
  "#a19b8e": "#898c80",
  "#b3afa3": "#8f9487",
  "#b8b3a7": "#8f9487",
  "#b9b1a1": "#8f9487",
  "#c5c6b8": "#5f6558",
};

const borderManual = {
  "#e5ded0": "#343a2e",
  "#e8e1d4": "#343a2e",
  "#e9e2d5": "#333a2e",
  "#e9e2d6": "#333a2e",
  "#e6dfd2": "#353b2f",
  "#ebe4d7": "#32382c",
  "#ebe4d8": "#32382c",
  "#eee8dc": "#30362b",
  "#f0eadf": "#2d3328",
  "#eae3d7": "#33392d",
  "#eae3d6": "#33392d",
  "#e5dfd2": "#353b2f",
  "#e4ded2": "#353b2f",
  "#e5ded1": "#343a2e",
  "#e8e1d5": "#343a2e",
  "#e9e2d5": "#333a2e",
  "#ece6da": "#2e3429",
  "#d8d0c0": "#4a5243",
  "#ddd6c8": "#3d4438",
  "#e1dacd": "#3a4135",
  "#e2dbcc": "#3a4135",
  "#e5ded2": "#353b2f",
  "#ead9b9": "#51442b",
  "#eccfc8": "#553b33",
  "#e8c9c0": "#593b33",
  "#e8cec6": "#553b33",
  "#d6e5d1": "#3c513c",
  "#d9e5d3": "#3c513c",
  "#eccbc3": "#553b33",
  "#ebdda9": "#51462b",
  "#cce1cb": "#3c543d",
  "#d4e6d0": "#3c543d",
};

function darkFor(role, hex) {
  const manual = role === "bg" ? bgManual : role === "text" || role === "decoration" ? textManual : role === "border" || role === "ring" ? borderManual : {};
  if (manual[hex]) return manual[hex];
  const { h, s, l } = rgbToHsl(hex);
  const neutral = s < 0.16;

  if (role === "bg") {
    if (l >= 0.985) return "#232920";
    if (l >= 0.955) return "#20261d";
    if (l >= 0.925) return "#1a1f17";
    if (l >= 0.84) return "#2b3127";
    if (l >= 0.7) return "#4d5547";
    if (l >= 0.45) return "#56604f";
    if (l < 0.32 && s >= 0.16) return hslToHex(h, s, Math.min(0.34, l + 0.11));
    if (neutral) return "#343a2e";
    return hex;
  }

  if (role === "text" || role === "decoration") {
    if (l < 0.18) return neutral ? "#ece9dd" : hslToHex(h, Math.min(0.55, s + 0.08), 0.72);
    if (l < 0.32) return neutral ? "#d9d6c9" : hslToHex(h, Math.min(0.55, s + 0.08), 0.72);
    if (l < 0.45) return neutral ? "#c0bfb2" : hslToHex(h, Math.min(0.5, s), 0.7);
    if (l < 0.6) return neutral ? "#a4a698" : hslToHex(h, Math.min(0.45, s), 0.72);
    if (l < 0.72) return neutral ? "#929589" : hslToHex(h, Math.min(0.4, s), 0.7);
    return hex;
  }

  // border / ring
  if (l >= 0.84) return neutral ? "#353b2f" : hslToHex(h, Math.min(0.3, s), 0.28);
  if (l >= 0.6) return neutral ? "#424a3b" : hslToHex(h, Math.min(0.35, s), 0.34);
  return neutral ? "#555d4c" : hslToHex(h, Math.min(0.4, s), 0.44);
}

function cssEscape(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, (char) => "\\" + char);
}

const groups = new Map();
for (const token of tokens) {
  const [role, hex, alpha, prefix] = token.split("|");
  const baseClass = `${prefix}${role}-[${hex}]${alpha ? "/" + alpha : ""}`;
  const variants = baseClass.split(":").slice(0, -1);
  const className = baseClass;
  if (variants.some((v) => ["sm", "md", "lg", "xl", "2xl", "dark"].includes(v))) continue;

  const dark = darkFor(role, hex);
  const alphaValue = alpha ? Number(alpha) / 100 : 1;
  const value = alpha ? rgba(dark, alphaValue) : dark;

  let selector = `[data-theme="dark"] .${cssEscape(className)}`;
  if (variants.includes("hover")) selector += ":hover";
  if (variants.includes("focus")) selector += ":focus";
  if (variants.includes("active")) selector += ":active";
  if (variants.includes("disabled")) selector += ":disabled";
  if (variants.includes("group-hover")) selector = `[data-theme="dark"] .group:hover .${cssEscape(className)}`;

  const property =
    role === "bg"
      ? "background-color"
      : role === "text"
        ? "color"
        : role === "border"
          ? "border-color"
          : role === "ring"
            ? "--tw-ring-color"
            : "text-decoration-color";

  const key = `${property}|${value}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(selector);
}

let css = `/* Generated by tmp/gen-dark.js — dark theme color utility overrides. */\n`;
for (const [key, selectors] of groups) {
  const [property, value] = key.split("|");
  css += `${selectors.join(",\n")} {\n  ${property}: ${value};\n}\n`;
}

fs.writeFileSync("app/dark-theme.css", css);
console.log("tokens", tokens.size, "groups", groups.size, "bytes", css.length);
